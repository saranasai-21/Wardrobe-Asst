'use client';

import React, { useState, useRef } from 'react';
import {
  GarmentCategory,
  PatternType,
  StyleVibe,
  ColorSwatch,
  FitTransform,
} from '@/types/database';
import { removeBackgroundClient } from '@/lib/segment';
import { analyzeGarmentImage } from '@/lib/colorAnalysis';
import { classifyGarment } from '@/lib/classifier';
import {
  Upload,
  X,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  Tag,
  Palette,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface GarmentScannerModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveGarment: (itemData: {
    name: string;
    category: GarmentCategory;
    fileBlob: Blob;
    primaryColor: string;
    secondaryColor?: string | null;
    colorPalette: ColorSwatch[];
    isNeutral: boolean;
    patternType: PatternType;
    styleVibe: StyleVibe;
  }) => Promise<void>;
}

const CATEGORIES: { id: GarmentCategory; label: string }[] = [
  { id: 'tshirt', label: 'T-Shirt / Tee' },
  { id: 'shirt', label: 'Collared Shirt' },
  { id: 'outerwear', label: 'Outerwear / Jacket' },
  { id: 'bottom', label: 'Bottoms / Pants / Jeans' },
  { id: 'footwear', label: 'Footwear / Shoes' },
  { id: 'accessory', label: 'Accessories' },
];

const STYLE_VIBES: { id: StyleVibe; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal / Office' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'athletic', label: 'Athletic' },
];

export function GarmentScannerModal({
  userId,
  isOpen,
  onClose,
  onSaveGarment,
}: GarmentScannerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transparentBlob, setTransparentBlob] = useState<Blob | null>(null);
  const [transparentDataUrl, setTransparentDataUrl] = useState<string | null>(null);

  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [modelCachingMsg, setModelCachingMsg] = useState<string | null>(null);

  // Extracted & Editable Fields
  const [garmentName, setGarmentName] = useState<string>('');
  const [category, setCategory] = useState<GarmentCategory>('tshirt');
  const [primaryColor, setPrimaryColor] = useState<string>('#000000');
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorSwatch[]>([]);
  const [isNeutral, setIsNeutral] = useState<boolean>(false);
  const [patternType, setPatternType] = useState<PatternType>('solid');
  const [styleVibe, setStyleVibe] = useState<StyleVibe>('casual');

  const [savingToCloud, setSavingToCloud] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);

      const baseName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setGarmentName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      setErrorMsg(null);
    }
  };

  /**
   * Run the Zero-Distortion Browser-Side Pipeline
   */
  const handleStartScan = async () => {
    if (!file) return;

    setStep('scanning');
    setScanProgress(5);
    setErrorMsg(null);

    try {
      // Step 1: Pixel-Exact Transparent Cutout (WASM @imgly)
      setScanStatus('Removing background (100% Free WASM)...');
      const cutout = await removeBackgroundClient(file, (pct) => {
        setScanProgress(Math.round(pct * 0.45)); // 0-45%
      });

      setTransparentBlob(cutout.blob);
      setTransparentDataUrl(cutout.dataUrl);
      setScanProgress(50);

      // Step 2: HTML5 Canvas K-Means Color Clustering & Pattern Analysis
      setScanStatus('Clustering exact fabric colors & pattern density...');
      const analysis = await analyzeGarmentImage(cutout.dataUrl);

      setPrimaryColor(analysis.primaryColor);
      setSecondaryColor(analysis.secondaryColor);
      setColorPalette(analysis.colorPalette);
      setIsNeutral(analysis.isNeutral);
      setPatternType(analysis.patternType);
      setScanProgress(65);

      // Step 3: Zero-Shot CLIP Web Worker Classification
      setScanStatus('Running local CLIP zero-shot classifier...');
      const classification = await classifyGarment(cutout.dataUrl, (pct, fileName) => {
        if (fileName) {
          setModelCachingMsg(`Caching CLIP weights: ${fileName} (${pct}%)`);
        }
        setScanProgress(65 + Math.round(pct * 0.3)); // 65-95%
      });

      setCategory(classification.category);
      setStyleVibe(classification.styleVibe);
      setScanProgress(100);

      // Move to review stage
      setStep('review');
    } catch (err: any) {
      console.error('Garment scan error:', err);
      setErrorMsg(err.message || 'Scanning failed. Please check image format.');
      setStep('upload');
    } finally {
      setModelCachingMsg(null);
    }
  };

  /**
   * Final Save: Upload to Supabase Storage & Database
   */
  const handleSaveToVault = async () => {
    if (!transparentBlob) return;
    setSavingToCloud(true);
    setErrorMsg(null);

    try {
      await onSaveGarment({
        name: garmentName.trim() || `${category.toUpperCase()} Item`,
        category,
        fileBlob: transparentBlob,
        primaryColor,
        secondaryColor,
        colorPalette,
        isNeutral,
        patternType,
        styleVibe,
      });

      onClose();
    } catch (err: any) {
      console.error('Save to vault error:', err);
      setErrorMsg(err.message || 'Failed to sync garment to Supabase.');
    } finally {
      setSavingToCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/90 text-zinc-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Zero-Distortion Garment Scanner
              </h2>
              <p className="text-[11px] text-zinc-400">
                100% untouched pixels &bull; Client-side CLIP &amp; K-Means extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={savingToCloud || step === 'scanning'}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Upload Source Photo */}
        {step === 'upload' && (
          <div className="mt-5 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.03]"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-white">
                  Take photo or select clothing item
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                  Original textures, folds, and logos are 100% preserved. Supports shirt, tees, pants, jackets, shoes, and caps.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-64 bg-zinc-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Clothing item"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-xs font-mono text-zinc-300 backdrop-blur-sm"
                  >
                    Change Photo
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    Zero distortion: The scanner extracts only transparent clothing pixels. No AI hallucination or redraw.
                  </span>
                </div>

                <button
                  onClick={handleStartScan}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run Client-Side Vision Scan</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Scanning Progress State */}
        {step === 'scanning' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                {scanStatus}
              </p>
              {modelCachingMsg && (
                <p className="text-xs text-amber-300 font-mono mt-1 animate-pulse">
                  {modelCachingMsg}
                </p>
              )}
            </div>

            <div className="w-full max-w-xs space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Client Neural Pipeline</span>
                <span className="text-amber-400 font-bold">{scanProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review Card & Metadata Tags */}
        {step === 'review' && transparentDataUrl && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Untouched Transparent Cutout Preview */}
              <div className="relative w-full h-56 bg-[#121216] rounded-xl border border-white/10 flex items-center justify-center p-3 overflow-hidden">
                <div className="absolute inset-0 bg-spotlight-radial pointer-events-none" />
                {/* Checkerboard subtle background */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={transparentDataUrl}
                  alt="Transparent Garment"
                  className="max-h-full max-w-full object-contain z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                />
                <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-zinc-400">
                  Untouched Cutout
                </div>
              </div>

              {/* Name & Extracted Colors */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Garment Name
                  </label>
                  <input
                    type="text"
                    value={garmentName}
                    onChange={(e) => setGarmentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Extracted Palette (K-Means)
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {colorPalette.map((swatch, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-950 border border-white/10 text-[10px] font-mono"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-zinc-300">{swatch.hex}</span>
                        <span className="text-zinc-500">{swatch.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/5">
                    <p className="text-[10px] text-zinc-500 font-mono">Tone Anchor</p>
                    <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                      {isNeutral ? 'Neutral Base' : 'Chromatic Hue'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/5">
                    <p className="text-[10px] text-zinc-500 font-mono">Surface Pattern</p>
                    <p className="text-xs font-semibold text-zinc-200 mt-0.5 capitalize">
                      {patternType}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Classification & Category Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center justify-between">
                <span>Clothing Classification</span>
                <span className="text-amber-400 text-[10px]">CLIP Auto-Tagged</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-medium transition-all text-left flex items-center justify-between ${
                      category === cat.id
                        ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold'
                        : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    {category === cat.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Vibe Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                Style Vibe Profile
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLE_VIBES.map((vibe) => (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => setStyleVibe(vibe.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono transition-all text-center ${
                      styleVibe === vibe.id
                        ? 'bg-white/15 border-white/40 text-white font-bold'
                        : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {vibe.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setStep('upload')}
                disabled={savingToCloud}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono"
              >
                Rescan
              </button>
              <button
                onClick={handleSaveToVault}
                disabled={savingToCloud}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono tracking-wider transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {savingToCloud ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save to Wardrobe Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
