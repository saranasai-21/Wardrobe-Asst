'use client';

import React, { useState, useMemo } from 'react';
import {
  WardrobeItemRecord,
  GeneratedOutfit,
  OutfitRecord,
  StyleVibe,
} from '@/types/database';
import { generateOutfitsFromWardrobe, OutfitFilter } from '@/lib/outfitEngine';
import {
  Sparkles,
  Check,
  Bookmark,
  Layers,
  Palette,
  Shuffle,
  ShieldAlert,
  ArrowRight,
  Shirt,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OutfitGeneratorPanelProps {
  wardrobe: WardrobeItemRecord[];
  onEquipOutfit: (items: WardrobeItemRecord[]) => void;
  onSaveLoadout: (outfit: {
    name: string;
    itemIds: string[];
    score: number;
    styleReason: string;
    styleVibe: string;
  }) => Promise<void>;
  onOpenScanner: () => void;
}

const FILTERS: { id: OutfitFilter; label: string }[] = [
  { id: 'any', label: 'All Combos' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal / Office' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'monochrome', label: 'Monochrome' },
  { id: 'high_contrast', label: 'High Contrast' },
];

export function OutfitGeneratorPanel({
  wardrobe,
  onEquipOutfit,
  onSaveLoadout,
  onOpenScanner,
}: OutfitGeneratorPanelProps) {
  const [filter, setFilter] = useState<OutfitFilter>('any');
  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Check wardrobe inventory requirements
  const hasTop = wardrobe.some((i) => i.category === 'shirt' || i.category === 'tshirt');
  const hasBottom = wardrobe.some((i) => i.category === 'bottom');

  // Deterministically generate outfits
  const generatedOutfits = useMemo(() => {
    return generateOutfitsFromWardrobe(wardrobe, filter, 5);
  }, [wardrobe, filter]);

  const handleSave = async (outfit: GeneratedOutfit) => {
    setSavingId(outfit.id);
    try {
      await onSaveLoadout({
        name: outfit.name,
        itemIds: outfit.items.map((i) => i.id),
        score: outfit.score,
        styleReason: outfit.reason,
        styleVibe: outfit.styleVibe,
      });

      setSavedOutfitIds((prev) => new Set(prev).add(outfit.id));
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Failed to save loadout:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Deterministic Outfit Stylist</span>
          </h3>
          <p className="text-[11px] text-zinc-400">
            HSL Color Theory &bull; Strictly curated from your real clothes
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex-shrink-0 ${
              filter === f.id
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Insufficient wardrobe state */}
      {(!hasTop || !hasBottom) && (
        <div className="p-8 rounded-2xl bg-zinc-900/60 border border-white/10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
            <Shirt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white font-mono uppercase">
            Wardrobe Core Required
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
            To generate color-harmonic outfits, scan at least{' '}
            <strong className="text-amber-400">1 Top (Shirt/T-Shirt)</strong> and{' '}
            <strong className="text-amber-400">1 Bottom (Jeans/Pants)</strong> into your Vault.
          </p>
          <button
            onClick={onOpenScanner}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider transition-all"
          >
            Scan Clothing Now
          </button>
        </div>
      )}

      {/* Outfits List */}
      {hasTop && hasBottom && generatedOutfits.length === 0 && (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-zinc-400 font-mono">
          No outfits matched filter &quot;{filter}&quot;. Try selecting &quot;All Combos&quot;.
        </div>
      )}

      {hasTop && hasBottom && (
        <div className="space-y-3">
          {generatedOutfits.map((outfit) => {
            const isSaved = savedOutfitIds.has(outfit.id);

            return (
              <div
                key={outfit.id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 hover:border-amber-400/40 transition-all backdrop-blur-sm group shadow-lg"
              >
                {/* Outfit Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {outfit.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-zinc-400 capitalize">
                      {outfit.styleVibe}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                    <Palette className="w-3.5 h-3.5" />
                    <span>{outfit.score}% Match</span>
                  </div>
                </div>

                {/* Outfit Pieces Thumbnails */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-3">
                  {outfit.items.map((item) => (
                    <div
                      key={item.id}
                      className="relative h-20 bg-black/50 rounded-xl border border-white/5 p-1 flex flex-col items-center justify-center overflow-hidden group/item"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-md"
                      />
                      <span className="absolute bottom-1 left-1 text-[9px] font-mono text-zinc-400 bg-black/60 px-1 rounded truncate max-w-[90%]">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Style Reason */}
                <p className="text-[11px] text-zinc-400 font-mono mb-3 leading-relaxed bg-black/30 p-2 rounded-lg border border-white/5">
                  &bull; {outfit.reason}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleSave(outfit)}
                    disabled={isSaved || savingId === outfit.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
                    }`}
                  >
                    {isSaved ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                    <span>{isSaved ? 'Loadout Saved' : 'Save Loadout'}</span>
                  </button>

                  <button
                    onClick={() => onEquipOutfit(outfit.items)}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <span>Equip Outfit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
