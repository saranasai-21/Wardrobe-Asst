'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  AvatarRecord,
  WardrobeItemRecord,
  FitTransform,
} from '@/types/database';
import { calculateAutoFitTransform } from '@/lib/pose';
import { FitTransformToolbar } from './FitTransformToolbar';
import { Avatar3DStage } from './Avatar3DStage';
import {
  Download,
  Trash2,
  Sliders,
  User,
  RefreshCw,
  Box,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AvatarStageProps {
  avatar: AvatarRecord | null;
  equippedItems: WardrobeItemRecord[];
  onUnequip: (item: WardrobeItemRecord) => void;
  onClearAll: () => void;
  onOpenAvatarUpload: () => void;
  onUpdateItemFit: (item: WardrobeItemRecord, newFit: FitTransform) => Promise<void>;
  onUseMannequin?: () => void;
}

export function AvatarStage({
  avatar,
  equippedItems,
  onUnequip,
  onClearAll,
  onOpenAvatarUpload,
  onUpdateItemFit,
  onUseMannequin,
}: AvatarStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<WardrobeItemRecord | null>(null);
  const [currentTransform, setCurrentTransform] = useState<FitTransform | null>(null);
  const [savingFit, setSavingFit] = useState(false);
  const [downloadingSnapshot, setDownloadingSnapshot] = useState(false);
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('3d');

  // Group equipped items by strict rendering order
  const bottoms = equippedItems.find((i) => i.category === 'bottom');
  const tops = equippedItems.find((i) => i.category === 'shirt' || i.category === 'tshirt');
  const outerwear = equippedItems.find((i) => i.category === 'outerwear');
  const footwear = equippedItems.find((i) => i.category === 'footwear');
  const accessories = equippedItems.find((i) => i.category === 'accessory');

  // Sync selected item's transform
  useEffect(() => {
    if (selectedItemForEdit) {
      setCurrentTransform(selectedItemForEdit.fit_transform);
    } else {
      setCurrentTransform(null);
    }
  }, [selectedItemForEdit]);

  const handleSelectGarmentForTuning = (item: WardrobeItemRecord) => {
    if (selectedItemForEdit?.id === item.id) {
      setSelectedItemForEdit(null);
    } else {
      setSelectedItemForEdit(item);
    }
  };

  const handleSaveFit = async () => {
    if (!selectedItemForEdit || !currentTransform) return;
    setSavingFit(true);
    try {
      await onUpdateItemFit(selectedItemForEdit, currentTransform);
      setSelectedItemForEdit(null);
    } catch (err) {
      console.error('Failed to save fit:', err);
    } finally {
      setSavingFit(false);
    }
  };

  const handleResetFit = () => {
    if (!selectedItemForEdit || !avatar) return;
    const defaultFit = calculateAutoFitTransform(avatar.landmarks, selectedItemForEdit.category);
    setCurrentTransform(defaultFit);
  };

  /**
   * Snapshot Export: Composites avatar + equipped garments onto canvas and downloads PNG
   */
  const handleDownloadLook = async () => {
    if (!avatar) return;
    setDownloadingSnapshot(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stageWidth = 1200;
      const stageHeight = 1600;
      canvas.width = stageWidth;
      canvas.height = stageHeight;

      // Draw studio background
      const bgGrad = ctx.createRadialGradient(
        stageWidth / 2, stageHeight * 0.45, 50,
        stageWidth / 2, stageHeight * 0.45, stageWidth * 0.7
      );
      bgGrad.addColorStop(0, '#1c1c22');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, stageWidth, stageHeight);

      // Draw pedestal ellipse
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(stageWidth / 2, stageHeight * 0.9, stageWidth * 0.35, stageHeight * 0.06, 0, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.restore();

      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = (e) => rej(e);
          img.src = url;
        });
      };

      // 1. Draw Avatar base
      const avatarImg = await loadImage(avatar.image_url);
      const avAspect = avatarImg.width / avatarImg.height;
      const targetAvH = stageHeight * 0.82;
      const targetAvW = targetAvH * avAspect;
      const avX = (stageWidth - targetAvW) / 2;
      const avY = stageHeight * 0.1;
      ctx.drawImage(avatarImg, avX, avY, targetAvW, targetAvH);

      // 2. Draw Layered Garments in order
      const renderLayers = [bottoms, tops, outerwear, footwear, accessories].filter(Boolean) as WardrobeItemRecord[];

      for (const garment of renderLayers) {
        try {
          const gImg = await loadImage(garment.image_url);
          const t = garment.id === selectedItemForEdit?.id && currentTransform ? currentTransform : garment.fit_transform;
          const gAspect = gImg.width / gImg.height;

          let baseW = targetAvW * t.scale * t.scaleX;
          let baseH = (baseW / gAspect) * t.scaleY;

          let anchorX = avX + targetAvW / 2 + (t.x / 100) * targetAvW;
          let anchorY = avY + targetAvH / 2 + (t.y / 100) * targetAvH;

          ctx.save();
          ctx.translate(anchorX, anchorY);
          if (t.rotation) {
            ctx.rotate((t.rotation * Math.PI) / 180);
          }
          ctx.drawImage(gImg, -baseW / 2, -baseH / 2, baseW, baseH);
          ctx.restore();
        } catch (gErr) {
          console.warn('Could not composite garment:', garment.name, gErr);
        }
      }

      // Add WardrobeLab watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('WARDROBELAB STUDIO // ' + new Date().toLocaleDateString(), 40, stageHeight - 40);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `WardrobeLab_Look_${Date.now()}.png`;
      a.click();

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Error generating look snapshot:', err);
    } finally {
      setDownloadingSnapshot(false);
    }
  };

  /**
   * Helper to compute CSS style for 2D garment layer
   */
  const getGarmentStyle = (item: WardrobeItemRecord) => {
    const t = item.id === selectedItemForEdit?.id && currentTransform ? currentTransform : item.fit_transform;
    return {
      transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale * t.scaleX}, ${t.scale * t.scaleY}) rotate(${t.rotation}deg)`,
      transformOrigin: 'center center',
      transition: selectedItemForEdit?.id === item.id ? 'none' : 'transform 0.15s ease-out',
    };
  };

  const renderGarmentLayer = (item: WardrobeItemRecord | undefined, zClass: string) => {
    if (!item) return null;
    return (
      <div
        onClick={() => handleSelectGarmentForTuning(item)}
        style={getGarmentStyle(item)}
        className={`absolute inset-0 w-full h-full flex items-center justify-center ${zClass} cursor-pointer group ${
          selectedItemForEdit?.id === item.id ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-b from-[#121216] via-[#0d0d10] to-[#09090b] overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Top 3D / 2D View Switcher Pill */}
      <div className="absolute top-3 right-3 z-30 flex items-center bg-black/70 backdrop-blur-md p-0.5 rounded-xl border border-white/10 text-[10px] font-mono">
        <button
          onClick={() => setRenderMode('3d')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
            renderMode === '3d'
              ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Box className="w-3 h-3" />
          <span>3D Rotatable</span>
        </button>
        <button
          onClick={() => setRenderMode('2d')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
            renderMode === '2d'
              ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>2D Photo</span>
        </button>
      </div>

      {/* Main Viewport Stage */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* Background Spotlight Radial */}
        <div className="absolute inset-0 bg-spotlight-radial pointer-events-none" />

        {renderMode === '3d' ? (
          // 3D ROTATABLE WEBGL MANNEQUIN STAGE
          <Avatar3DStage
            avatar={avatar}
            equippedItems={equippedItems}
            onSelectGarment={handleSelectGarmentForTuning}
            selectedItemId={selectedItemForEdit?.id}
          />
        ) : (
          // 2D PRECISION CALIBRATION VIEW
          <>
            {/* Studio Pedestal Floor Reflection */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[75%] max-w-[380px] h-16 bg-pedestal-gradient rounded-full blur-[2px] pointer-events-none" />
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-[60%] max-w-[300px] h-5 border-b border-amber-500/20 rounded-full pointer-events-none" />

            {avatar ? (
              <div className="relative h-[90%] aspect-[9/16] flex items-center justify-center">
                {/* 1. Base Avatar Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar.image_url}
                  alt="Avatar Model"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
                />

                {/* 2-6. Layered Garments */}
                {renderGarmentLayer(bottoms, 'z-20')}
                {renderGarmentLayer(tops, 'z-30')}
                {renderGarmentLayer(outerwear, 'z-[40]')}
                {renderGarmentLayer(footwear, 'z-50')}
                {renderGarmentLayer(accessories, 'z-[60]')}
              </div>
            ) : (
              /* Empty Avatar State */
              <div className="z-10 flex flex-col items-center justify-center text-center p-6 max-w-xs">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-amber-400 shadow-xl">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  No Avatar Loaded
                </h3>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Upload a photo or load the Studio Mannequin.
                </p>
                <div className="flex flex-col items-center gap-2 mt-4 w-full">
                  <button
                    onClick={onOpenAvatarUpload}
                    className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs tracking-wider uppercase font-mono transition-all shadow-lg shadow-amber-500/20"
                  >
                    Upload Photo
                  </button>
                  {onUseMannequin && (
                    <button
                      onClick={onUseMannequin}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-mono text-xs border border-white/10 transition-colors hover:border-amber-400/40"
                    >
                      Use Mannequin
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Floating Calibration Toolbar if an item is selected */}
        {selectedItemForEdit && currentTransform && (
          <FitTransformToolbar
            item={selectedItemForEdit}
            transform={currentTransform}
            onChange={setCurrentTransform}
            onSave={handleSaveFit}
            onReset={handleResetFit}
            onClose={() => setSelectedItemForEdit(null)}
            saving={savingFit}
          />
        )}
      </div>

      {/* Bottom Equipped Items Tray */}
      <div className="z-20 w-full px-3 py-2 bg-black/60 backdrop-blur-md border-t border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {equippedItems.length === 0 ? (
            <span className="text-[10px] text-zinc-500 italic font-mono">No clothes equipped</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-nowrap">
              {equippedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectGarmentForTuning(item)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer transition-all ${
                    selectedItemForEdit?.id === item.id
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.primary_color }} />
                  <span className="truncate max-w-[70px]">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnequip(item);
                      if (selectedItemForEdit?.id === item.id) setSelectedItemForEdit(null);
                    }}
                    className="ml-0.5 text-zinc-500 hover:text-red-400"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {equippedItems.length > 0 && (
            <>
              <button
                onClick={onClearAll}
                title="Unequip all items"
                className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleDownloadLook}
                disabled={downloadingSnapshot || !avatar}
                title="Export Look"
                className="p-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-[10px] flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
              >
                {downloadingSnapshot ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">Export</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
