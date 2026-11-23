'use client';

import React, { useState } from 'react';
import {
  WardrobeItemRecord,
  OutfitRecord,
  GarmentCategory,
} from '@/types/database';
import { OutfitGeneratorPanel } from './OutfitGeneratorPanel';
import {
  Plus,
  Trash2,
  Check,
  Sparkles,
  Shirt,
  Layers,
  Bookmark,
  Sliders,
  ChevronRight,
  Palette,
  Search,
  X,
} from 'lucide-react';

export type VaultTab =
  | 'shirts'
  | 'tshirts'
  | 'outerwear'
  | 'bottoms'
  | 'footwear'
  | 'accessories'
  | 'saved_outfits'
  | 'generator';

interface WardrobeVaultProps {
  wardrobe: WardrobeItemRecord[];
  savedOutfits: OutfitRecord[];
  equippedItems: WardrobeItemRecord[];
  onEquipItem: (item: WardrobeItemRecord) => void;
  onUnequipItem: (item: WardrobeItemRecord) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  onEquipOutfit: (items: WardrobeItemRecord[]) => void;
  onDeleteOutfit: (outfitId: string) => Promise<void>;
  onSaveLoadout: (outfit: {
    name: string;
    itemIds: string[];
    score: number;
    styleReason: string;
    styleVibe: string;
  }) => Promise<void>;
  onOpenScanner: () => void;
}

const TABS: { id: VaultTab; label: string; icon: any; countKey?: string }[] = [
  { id: 'shirts', label: 'Shirts', icon: Shirt },
  { id: 'tshirts', label: 'T-Shirts', icon: Shirt },
  { id: 'outerwear', label: 'Outerwear', icon: Layers },
  { id: 'bottoms', label: 'Bottoms', icon: Layers },
  { id: 'footwear', label: 'Footwear', icon: Layers },
  { id: 'accessories', label: 'Accessories', icon: Layers },
  { id: 'saved_outfits', label: 'Saved Outfits', icon: Bookmark },
  { id: 'generator', label: 'Stylist AI', icon: Sparkles },
];

export function WardrobeVault({
  wardrobe,
  savedOutfits,
  equippedItems,
  onEquipItem,
  onUnequipItem,
  onDeleteItem,
  onEquipOutfit,
  onDeleteOutfit,
  onSaveLoadout,
  onOpenScanner,
}: WardrobeVaultProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>('shirts');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter items by active tab category and search query
  const getFilteredItems = (): WardrobeItemRecord[] => {
    let items: WardrobeItemRecord[] = [];
    switch (activeTab) {
      case 'shirts':
        items = wardrobe.filter((i) => i.category === 'shirt');
        break;
      case 'tshirts':
        items = wardrobe.filter((i) => i.category === 'tshirt');
        break;
      case 'outerwear':
        items = wardrobe.filter((i) => i.category === 'outerwear');
        break;
      case 'bottoms':
        items = wardrobe.filter((i) => i.category === 'bottom');
        break;
      case 'footwear':
        items = wardrobe.filter((i) => i.category === 'footwear');
        break;
      case 'accessories':
        items = wardrobe.filter((i) => i.category === 'accessory');
        break;
      default:
        items = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.style_vibe.toLowerCase().includes(q) ||
          i.pattern_type.toLowerCase().includes(q)
      );
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const isEquipped = (itemId: string) => {
    return equippedItems.some((i) => i.id === itemId);
  };

  const handleToggleEquip = (item: WardrobeItemRecord) => {
    if (isEquipped(item.id)) {
      onUnequipItem(item);
    } else {
      onEquipItem(item);
    }
  };

  const handleDelete = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!confirm('Remove this garment from your Vault?')) return;
    setDeletingId(itemId);
    try {
      await onDeleteItem(itemId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteOutfit = async (e: React.MouseEvent, outfitId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this saved loadout?')) return;
    setDeletingId(outfitId);
    try {
      await onDeleteOutfit(outfitId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEquipSavedOutfit = (outfit: OutfitRecord) => {
    const outfitItems = wardrobe.filter((item) => outfit.item_ids.includes(item.id));
    onEquipOutfit(outfitItems);
  };

  // Get item counts for category badges
  const getCount = (tab: VaultTab) => {
    switch (tab) {
      case 'shirts':
        return wardrobe.filter((i) => i.category === 'shirt').length;
      case 'tshirts':
        return wardrobe.filter((i) => i.category === 'tshirt').length;
      case 'outerwear':
        return wardrobe.filter((i) => i.category === 'outerwear').length;
      case 'bottoms':
        return wardrobe.filter((i) => i.category === 'bottom').length;
      case 'footwear':
        return wardrobe.filter((i) => i.category === 'footwear').length;
      case 'accessories':
        return wardrobe.filter((i) => i.category === 'accessory').length;
      case 'saved_outfits':
        return savedOutfits.length;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Vault Header Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
              TACTICAL VAULT
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-300">
              {wardrobe.length} Total Garments
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black font-mono tracking-tight text-white mt-0.5">
            WARDROBE INVENTORY
          </h2>
        </div>

        <button
          onClick={onOpenScanner}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Scan Garment</span>
        </button>
      </div>

      {/* Vault Category Navigation Tabs */}
      <div className="flex items-center gap-1 p-2 bg-black/40 border-b border-white/5 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const count = getCount(tab.id);
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-zinc-950/40 text-zinc-900' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-[460px]">
        {/* TAB: Stylist AI / Outfit Generator */}
        {activeTab === 'generator' && (
          <OutfitGeneratorPanel
            wardrobe={wardrobe}
            onEquipOutfit={onEquipOutfit}
            onSaveLoadout={onSaveLoadout}
            onOpenScanner={onOpenScanner}
          />
        )}

        {/* TAB: Saved Outfits */}
        {activeTab === 'saved_outfits' && (
          <div className="space-y-3">
            {savedOutfits.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Bookmark className="w-10 h-10 text-zinc-600 mb-3" />
                <h4 className="text-sm font-bold font-mono uppercase text-white">
                  No Saved Outfits Yet
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                  Generate outfits with the Stylist AI and save your favorite loadouts to equip
                  instantly anytime.
                </p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 border border-white/10 text-xs font-mono font-bold"
                >
                  Open Stylist AI
                </button>
              </div>
            ) : (
              savedOutfits.map((outfit) => {
                const outfitItems = wardrobe.filter((i) => outfit.item_ids.includes(i.id));

                return (
                  <div
                    key={outfit.id}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-white">
                          {outfit.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {outfit.score}% Match
                        </span>
                      </div>

                      {/* Pieces Thumbnails */}
                      <div className="flex items-center gap-2">
                        {outfitItems.map((item) => (
                          <div
                            key={item.id}
                            className="w-12 h-12 bg-black/40 rounded-lg border border-white/5 p-1 flex items-center justify-center overflow-hidden"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-zinc-400 font-mono">
                        {outfit.style_reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={(e) => handleDeleteOutfit(e, outfit.id)}
                        disabled={deletingId === outfit.id}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEquipSavedOutfit(outfit)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <span>Equip Loadout</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: Garment Category Grid */}
        {activeTab !== 'generator' && activeTab !== 'saved_outfits' && (
          <div>
            {/* Quick Search & Filter Bar */}
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab} by name or style...`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/5 focus:border-amber-500/50 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Shirt className="w-10 h-10 text-zinc-600 mb-3" />
                <h4 className="text-sm font-bold font-mono uppercase text-white">
                  {searchQuery ? 'No Matches Found' : `No ${activeTab} in Vault`}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                  {searchQuery
                    ? `No items match "${searchQuery}". Try a different keyword or clear your filter.`
                    : `Scan your real ${activeTab} using our zero-distortion background removal pipeline.`}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs"
                  >
                    Clear Filter
                  </button>
                ) : (
                  <button
                    onClick={onOpenScanner}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    Scan {activeTab.slice(0, -1)}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredItems.map((item) => {
                  const equipped = isEquipped(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleEquip(item)}
                      className={`relative group rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                        equipped
                          ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/10'
                          : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/90'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between z-10">
                        {equipped ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Equipped
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {item.style_vibe}
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-black/60 hover:bg-red-500/30 text-zinc-400 hover:text-red-300 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Garment Cutout Display */}
                      <div className="relative w-full h-32 sm:h-36 my-2 flex items-center justify-center">
                        <div className="absolute inset-0 bg-spotlight-radial opacity-30 pointer-events-none" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      {/* Info & Tags */}
                      <div className="pt-2 border-t border-white/5 z-10">
                        <p className="text-xs font-bold font-mono text-white truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20"
                              style={{ backgroundColor: item.primary_color }}
                            />
                            <span className="capitalize">{item.pattern_type}</span>
                          </div>
                          <span className="text-zinc-500 capitalize">
                            {item.is_neutral ? 'Neutral' : 'Color'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
