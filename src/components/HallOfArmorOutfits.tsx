'use client';

import React, { useState } from 'react';
import { OutfitRecord, WardrobeItemRecord } from '@/types/database';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Trash2,
  Check,
  Plus,
  Shield,
  Layers,
  Sparkles as SparklesFallback,
  Sliders,
  Eye,
} from 'lucide-react';

interface HallOfArmorOutfitsProps {
  savedOutfits: OutfitRecord[];
  wardrobe: WardrobeItemRecord[];
  equippedItems: WardrobeItemRecord[];
  onEquipOutfit: (items: WardrobeItemRecord[]) => void;
  onDeleteOutfit: (outfitId: string) => Promise<void>;
  onOpenStylist: () => void;
  onOpenScanner: () => void;
}

// Built-in Tactical Armor Archetypes when user has 0 saved outfits
const DEFAULT_ARMOR_SUITS = [
  {
    mark: 'MK-01',
    codename: 'WAR MACHINE',
    vibe: 'STREETWEAR',
    score: 96,
    color: 'from-amber-500/20 to-amber-900/40',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    description: 'Reinforced urban tactical layer with high-contrast neutral base.',
  },
  {
    mark: 'MK-02',
    codename: 'STEALTH PROTOCOL',
    vibe: 'FORMAL',
    score: 98,
    color: 'from-cyan-500/20 to-blue-900/40',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    description: 'Monochromatic obsidian formal suit with crisp tailored line accents.',
  },
  {
    mark: 'MK-03',
    codename: 'CRIMSON VALKYRIE',
    vibe: 'CASUAL',
    score: 94,
    color: 'from-rose-500/20 to-red-950/40',
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    description: 'Dynamic warm-analogous harmony designed for high mobility.',
  },
  {
    mark: 'MK-04',
    codename: 'TITAN ODYSSEY',
    vibe: 'ATHLETIC',
    score: 92,
    color: 'from-emerald-500/20 to-emerald-950/40',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    description: 'All-weather performance ensemble with breathable technical fibers.',
  },
];

export function HallOfArmorOutfits({
  savedOutfits,
  wardrobe,
  equippedItems,
  onEquipOutfit,
  onDeleteOutfit,
  onOpenStylist,
  onOpenScanner,
}: HallOfArmorOutfitsProps) {
  const [selectedSuitIndex, setSelectedSuitIndex] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Combine user saved outfits or fallback to built-in armor chambers
  const hasUserOutfits = savedOutfits.length > 0;

  const handleEquipUserOutfit = (outfit: OutfitRecord) => {
    const outfitItems = wardrobe.filter((item) => outfit.item_ids.includes(item.id));
    onEquipOutfit(outfitItems);
  };

  const handleEquipDefaultSuit = (vibe: string) => {
    // Equip matching items from wardrobe that fit this vibe
    const top = wardrobe.find((i) => (i.category === 'shirt' || i.category === 'tshirt') && i.style_vibe.toLowerCase() === vibe.toLowerCase()) ||
      wardrobe.find((i) => i.category === 'shirt' || i.category === 'tshirt');
    const bottom = wardrobe.find((i) => i.category === 'bottom' && i.style_vibe.toLowerCase() === vibe.toLowerCase()) ||
      wardrobe.find((i) => i.category === 'bottom');
    const shoes = wardrobe.find((i) => i.category === 'footwear');
    const jacket = wardrobe.find((i) => i.category === 'outerwear');

    const loadout = [top, bottom, shoes, jacket].filter(Boolean) as WardrobeItemRecord[];
    if (loadout.length > 0) {
      onEquipOutfit(loadout);
    } else {
      onOpenStylist();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden relative select-none">
      {/* Top Hall of Armor Header Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white">
            HALL OF ARMOR // SUIT CHAMBERS
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {hasUserOutfits ? `${savedOutfits.length} Custom Suits` : '4 Armor Pods Active'}
          </span>
        </div>

        <button
          onClick={onOpenStylist}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Forge Suit</span>
        </button>
      </div>

      {/* Semicircular Iron Man Armor Chambers Carousel */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden p-4 sm:p-6 flex items-center gap-4 sm:gap-6 scrollbar-thin scrollbar-thumb-zinc-700">
        {hasUserOutfits ? (
          // USER SAVED OUTFIT CHAMBERS
          savedOutfits.map((outfit, idx) => {
            const outfitItems = wardrobe.filter((i) => outfit.item_ids.includes(i.id));
            const markLabel = `MK-${String(idx + 1).padStart(2, '0')}`;
            const isEquipped = outfitItems.length > 0 && outfitItems.every((item) => equippedItems.some((e) => e.id === item.id));

            return (
              <div
                key={outfit.id}
                className="relative flex-shrink-0 w-64 sm:w-72 h-[420px] rounded-2xl bg-gradient-to-b from-zinc-900/90 via-[#12131a]/95 to-black border border-white/15 overflow-hidden flex flex-col justify-between group shadow-2xl transition-all duration-300 hover:border-amber-400/70 hover:scale-[1.02]"
              >
                {/* 1. Neon Illuminated Columns (Sides of Chamber like Iron Man Hall of Armor) */}
                <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-cyan-400/80 via-white to-cyan-400/80 shadow-[0_0_12px_#38bdf8] pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b from-cyan-400/80 via-white to-cyan-400/80 shadow-[0_0_12px_#38bdf8] pointer-events-none" />

                {/* 2. Horizontal Metallic Chamber Slats / Vents in Background */}
                <div className="absolute inset-x-3 inset-y-0 opacity-15 pointer-events-none flex flex-col justify-between py-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-full h-1 bg-white/40 rounded-full" />
                  ))}
                </div>

                {/* 3. Top Down Chamber Spotlight */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-300/15 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-cyan-300 rounded-full blur-[2px]" />

                {/* Top Info Header */}
                <div className="relative z-10 px-5 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-black text-amber-400 tracking-widest uppercase">
                      {markLabel}
                    </span>
                    <h4 className="text-xs font-mono font-bold text-white truncate max-w-[150px]">
                      {outfit.name}
                    </h4>
                  </div>

                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {outfit.score}% HARMONY
                  </span>
                </div>

                {/* Center Showcase: Armor Suit Display on Chamber Pedestal */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-3">
                  {/* Floating Circular Platform in Alcove */}
                  <div className="absolute bottom-4 w-32 h-6 bg-cyan-500/20 rounded-full blur-[4px] border border-cyan-400/40" />

                  {/* Garment Layers inside Pod */}
                  <div className="relative w-full h-48 flex items-center justify-center">
                    {outfitItems.length > 0 ? (
                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[180px]">
                        {outfitItems.map((item) => (
                          <div
                            key={item.id}
                            className="w-14 h-14 bg-black/60 rounded-xl border border-white/10 p-1.5 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-zinc-500 text-xs font-mono">
                        Suit Calibrating...
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Pod Base & Deployment Actions */}
                <div className="relative z-10 p-4 border-t border-white/10 bg-black/70 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onDeleteOutfit(outfit.id)}
                      disabled={deletingId === outfit.id}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/5 transition-colors"
                      title="Decommission Suit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleEquipUserOutfit(outfit)}
                      className={`flex-1 py-2 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                        isEquipped
                          ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-amber-500/20'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>SUIT DEPLOYED</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>DEPLOY SUIT</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          // BUILT-IN IRON MAN ARMOR PODS (Hall of Armor)
          DEFAULT_ARMOR_SUITS.map((suit, idx) => (
            <div
              key={suit.mark}
              className="relative flex-shrink-0 w-64 sm:w-72 h-[420px] rounded-2xl bg-gradient-to-b from-zinc-900/90 via-[#12131a]/95 to-black border border-white/15 overflow-hidden flex flex-col justify-between group shadow-2xl transition-all duration-300 hover:border-amber-400/70 hover:scale-[1.02]"
            >
              {/* Neon Vertical Light Columns (Iron Man Hall of Armor) */}
              <div
                className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 shadow-[0_0_14px_#38bdf8] pointer-events-none"
                style={{ boxShadow: `0 0 14px ${suit.accentColor}` }}
              />
              <div
                className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 shadow-[0_0_14px_#38bdf8] pointer-events-none"
                style={{ boxShadow: `0 0 14px ${suit.accentColor}` }}
              />

              {/* Horizontal Metallic Slat Vents */}
              <div className="absolute inset-x-3 inset-y-0 opacity-15 pointer-events-none flex flex-col justify-between py-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-full h-1 bg-white/40 rounded-full" />
                ))}
              </div>

              {/* Top Down Spotlight Cone */}
              <div
                className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b via-transparent to-transparent pointer-events-none"
                style={{ background: `linear-gradient(to bottom, ${suit.glowColor}, transparent)` }}
              />
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full blur-[2px]"
                style={{ backgroundColor: suit.accentColor }}
              />

              {/* Top Plaque Header */}
              <div className="relative z-10 px-5 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black text-amber-400 tracking-widest uppercase">
                    {suit.mark}
                  </span>
                  <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                    {suit.codename}
                  </h4>
                </div>

                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    backgroundColor: `${suit.accentColor}20`,
                    borderColor: `${suit.accentColor}50`,
                    color: suit.accentColor,
                  }}
                >
                  {suit.score}% MATCH
                </span>
              </div>

              {/* Center Silhouette Armor Display */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                {/* Glowing Base Platform */}
                <div
                  className="absolute bottom-5 w-36 h-6 rounded-full blur-[3px] border"
                  style={{
                    backgroundColor: `${suit.accentColor}20`,
                    borderColor: `${suit.accentColor}60`,
                  }}
                />

                {/* Suit Icon Silhouette */}
                <div className="relative flex flex-col items-center justify-center text-center">
                  <div
                    className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-3 shadow-2xl group-hover:scale-110 transition-transform duration-300"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderColor: `${suit.accentColor}60`,
                      boxShadow: `0 0 25px ${suit.glowColor}`,
                    }}
                  >
                    <Shield className="w-10 h-10" style={{ color: suit.accentColor }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                    {suit.vibe}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px] leading-snug">
                    {suit.description}
                  </p>
                </div>
              </div>

              {/* Bottom Deploy Trigger */}
              <div className="relative z-10 p-4 border-t border-white/10 bg-black/70 backdrop-blur-md">
                <button
                  onClick={() => handleEquipDefaultSuit(suit.vibe)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>EQUIP {suit.mark} SUIT</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Forge / Add New Armor Alcove Pod */}
        <div
          onClick={onOpenStylist}
          className="relative flex-shrink-0 w-64 sm:w-72 h-[420px] rounded-2xl bg-zinc-950/60 border-2 border-dashed border-white/15 hover:border-amber-400/60 flex flex-col items-center justify-center text-center p-6 cursor-pointer group transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors">
            Forge New Suit
          </h4>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-xs">
            Generate new color-harmonic armor loadouts with Stylist AI and store them in the Hall of Armor.
          </p>
        </div>
      </div>
    </div>
  );
}
