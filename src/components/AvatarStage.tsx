'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  AvatarRecord,
  WardrobeItemRecord,
  FitTransform,
  GarmentCategory,
} from '@/types/database';
import { calculateAutoFitTransform } from '@/lib/pose';
import { DEFAULT_MANNEQUIN_SVG } from '@/lib/mannequin';
import { FitTransformToolbar } from './FitTransformToolbar';
import {
  Download,
  Trash2,
  Sliders,
  User,
  Check,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  const [stageZoom, setStageZoom] = useState<number>(1.0);

  const handleZoomIn = () => setStageZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))));
  const handleZoomOut = () => setStageZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))));
  const handleResetZoom = () => setStageZoom(1.0);

  // Group equipped items by strict rendering order
  // Order: Avatar -> Bottoms -> Shirt/Tshirt -> Outerwear -> Footwear -> Accessories
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
        stageWidth / 2,
        stageHeight * 0.45,
        50,
        stageWidth / 2,
        stageHeight * 0.45,
        stageWidth * 0.7
      );
      bgGrad.addColorStop(0, '#1c1c22');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, stageWidth, stageHeight);

      // Draw pedestal ellipse
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        stageWidth / 2,
        stageHeight * 0.9,
        stageWidth * 0.35,
        stageHeight * 0.06,
        0,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.restore();

      // Load image helper
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
      const renderLayers = [bottoms, tops, outerwear, footwear, accessories].filter(
        Boolean
      ) as WardrobeItemRecord[];

      for (const garment of renderLayers) {
        try {
          const gImg = await loadImage(garment.image_url);
          const t = garment.id === selectedItemForEdit?.id && currentTransform ? currentTransform : garment.fit_transform;
          const gAspect = gImg.width / gImg.height;

          let baseW = targetAvW * t.scale * t.scaleX;
          let baseH = (baseW / gAspect) * t.scaleY;

          // Anchor offset based on category
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

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Error generating look snapshot:', err);
    } finally {
      setDownloadingSnapshot(false);
    }
  };

  /**
   * Helper to compute CSS style for an equipped garment layer
   */
  const getGarmentStyle = (item: WardrobeItemRecord) => {
    const t = item.id === selectedItemForEdit?.id && currentTransform ? currentTransform : item.fit_transform;

    return {
      transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale * t.scaleX}, ${t.scale * t.scaleY}) rotate(${t.rotation}deg)`,
      transformOrigin: 'center center',
      transition: selectedItemForEdit?.id === item.id ? 'none' : 'transform 0.15s ease-out',
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[620px] lg:h-full min-h-[580px] bg-gradient-to-b from-[#121216] via-[#0d0d10] to-[#09090b] rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between select-none shadow-2xl"
    >
      {/* Top HUD Bar */}
      <div className="z-20 w-full px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
            Stage Viewport
          </span>
          {avatar?.id === 'mannequin_default' && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Studio Mannequin
            </span>
          )}
          {equippedItems.length > 0 && (
            <span className="ml-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {equippedItems.length} Equipped
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="text-[10px] font-mono text-zinc-400 hover:text-white px-1.5"
            >
              {Math.round(stageZoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {equippedItems.length > 0 && (
            <>
              <button
                onClick={onClearAll}
                title="Unequip all items"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors flex items-center gap-1 text-[11px] font-mono px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>

              <button
                onClick={handleDownloadLook}
                disabled={downloadingSnapshot || !avatar}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-[11px] flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {downloadingSnapshot ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export Look</span>
              </button>
            </>
          )}

          {!avatar && (
            <button
              onClick={onOpenAvatarUpload}
              className="p-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1.5 text-[11px] font-mono"
            >
              <User className="w-3.5 h-3.5" />
              <span>Set Avatar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* Background Spotlight Radial */}
        <div className="absolute inset-0 bg-spotlight-radial pointer-events-none" />

        {/* Studio Pedestal Floor Reflection */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[70%] max-w-[420px] h-20 bg-pedestal-gradient rounded-full blur-[2px] pointer-events-none" />
        <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-[55%] max-w-[340px] h-6 border-b border-amber-500/20 rounded-full pointer-events-none" />

        {avatar ? (
          <div
            style={{
              transform: `scale(${stageZoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative h-[86%] aspect-[9/16] flex items-center justify-center"
          >
            {/* 1. Base Avatar Image (Strictly Untouched Pixels) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar.image_url}
              alt="Avatar Model"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
            />

            {/* 2. Layer: Bottoms (z-20) */}
            {bottoms && (
              <div
                onClick={() => handleSelectGarmentForTuning(bottoms)}
                style={getGarmentStyle(bottoms)}
                className={`absolute inset-0 w-full h-full flex items-center justify-center z-20 cursor-pointer group ${
                  selectedItemForEdit?.id === bottoms.id ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bottoms.image_url}
                  alt={bottoms.name}
                  className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}

            {/* 3. Layer: T-Shirt / Shirt (z-30) */}
            {tops && (
              <div
                onClick={() => handleSelectGarmentForTuning(tops)}
                style={getGarmentStyle(tops)}
                className={`absolute inset-0 w-full h-full flex items-center justify-center z-30 cursor-pointer group ${
                  selectedItemForEdit?.id === tops.id ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tops.image_url}
                  alt={tops.name}
                  className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}

            {/* 4. Layer: Outerwear / Jacket (z-40) */}
            {outerwear && (
              <div
                onClick={() => handleSelectGarmentForTuning(outerwear)}
                style={getGarmentStyle(outerwear)}
                className={`absolute inset-0 w-full h-full flex items-center justify-center z-40 cursor-pointer group ${
                  selectedItemForEdit?.id === outerwear.id ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outerwear.image_url}
                  alt={outerwear.name}
                  className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
                />
              </div>
            )}

            {/* 5. Layer: Footwear (z-50) */}
            {footwear && (
              <div
                onClick={() => handleSelectGarmentForTuning(footwear)}
                style={getGarmentStyle(footwear)}
                className={`absolute inset-0 w-full h-full flex items-center justify-center z-50 cursor-pointer group ${
                  selectedItemForEdit?.id === footwear.id ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={footwear.image_url}
                  alt={footwear.name}
                  className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}

            {/* 6. Layer: Accessories (z-60) */}
            {accessories && (
              <div
                onClick={() => handleSelectGarmentForTuning(accessories)}
                style={getGarmentStyle(accessories)}
                className={`absolute inset-0 w-full h-full flex items-center justify-center z-60 cursor-pointer group ${
                  selectedItemForEdit?.id === accessories.id ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={accessories.image_url}
                  alt={accessories.name}
                  className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty Avatar State */
          <div className="z-10 flex flex-col items-center justify-center text-center p-6 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-amber-400 shadow-xl">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              No Avatar Calibrated
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Upload a full-body photo to map your pose anchors, or load the Studio Mannequin to start styling right away.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5 w-full justify-center">
              <button
                onClick={onOpenAvatarUpload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs tracking-wider uppercase font-mono transition-all shadow-lg shadow-amber-500/20"
              >
                Upload Photo
              </button>
              {onUseMannequin && (
                <button
                  onClick={onUseMannequin}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-mono text-xs border border-white/10 transition-colors hover:border-amber-400/40"
                >
                  Use Mannequin
                </button>
              )}
            </div>
          </div>
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

      {/* Bottom Equipped Garments Tray */}
      <div className="z-20 w-full px-4 py-2.5 bg-black/60 backdrop-blur-md border-t border-white/5 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Active Fit:
          </span>
          {equippedItems.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic">No clothes equipped. Click any item in the Vault!</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-nowrap">
              {equippedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectGarmentForTuning(item)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-all ${
                    selectedItemForEdit?.id === item.id
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.primary_color }} />
                  <span className="truncate max-w-[80px]">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnequip(item);
                      if (selectedItemForEdit?.id === item.id) setSelectedItemForEdit(null);
                    }}
                    className="ml-1 text-zinc-500 hover:text-red-400"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedItemForEdit && (
          <button
            onClick={() => setSelectedItemForEdit(null)}
            className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1 ml-2"
          >
            <Sliders className="w-3 h-3" />
            <span>Close Fine-Tune</span>
          </button>
        )}
      </div>
    </div>
  );
}
