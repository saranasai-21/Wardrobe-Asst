'use client';

import React, { useState } from 'react';
import {
  WardrobeItemRecord,
  OutfitRecord,
  GarmentCategory,
} from '@/types/database';
import { OutfitGeneratorPanel } from './OutfitGeneratorPanel';
import { HallOfArmorOutfits } from './HallOfArmorOutfits';
import {
  Plus,
  Trash2,
  Check,
  Shirt,
  Search,
  X,
} from 'lucide-react';

export type MainVaultTab = 'fashion' | 'outfits' | 'generator';
export type SubCategoryTab = 'tops' | 'outerwear' | 'bottoms' | 'footwear' | 'accessories' | 'all';

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

/**
 * Free Fire Vault Subcategory Icons (Vector SVGs matching the in-game rail)
 */
function CapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M2 17h16c2 0 4-1 4-2" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function JacketIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4l5 3v13H4z" />
      <path d="M20 4l-5 3v13h5z" />
      <path d="M9 7l3 4 3-4" />
      <path d="M12 11v9" />
    </svg>
  );
}

function ShirtIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3l3 2h6l3-2 3 5-3 2v11H6V10L3 8z" />
      <path d="M9 5a3 3 0 0 0 6 0" />
    </svg>
  );
}

function PantsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 3h14v5l-2 13h-4l-1-9-1 9H7L5 8z" />
      <path d="M5 8h14" />
    </svg>
  );
}

function ShoesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 14l3-6 5 2 2 4h7a2 2 0 0 1 2 2v2H3z" />
      <path d="M3 18h19" />
    </svg>
  );
}

function SetIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

const SUBCATEGORIES: { id: SubCategoryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'accessories', label: 'Headwear / Acc', icon: CapIcon },
  { id: 'outerwear', label: 'Jackets / Vests', icon: JacketIcon },
  { id: 'tops', label: 'Tops / Shirts', icon: ShirtIcon },
  { id: 'bottoms', label: 'Pants / Bottoms', icon: PantsIcon },
  { id: 'footwear', label: 'Shoes / Boots', icon: ShoesIcon },
  { id: 'all', label: 'Full Wardrobe', icon: SetIcon },
];

const MAIN_TABS: { id: MainVaultTab; label: string }[] = [
  { id: 'fashion', label: 'FASHION' },
  { id: 'outfits', label: 'OUTFITS' },
  { id: 'generator', label: 'STYLIST' },
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
  const [mainTab, setMainTab] = useState<MainVaultTab>('fashion');
  const [subCategory, setSubCategory] = useState<SubCategoryTab>('tops');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter items by active subcategory and search query
  const getFilteredItems = (): WardrobeItemRecord[] => {
    let items: WardrobeItemRecord[] = [];
    switch (subCategory) {
      case 'accessories':
        items = wardrobe.filter((i) => i.category === 'accessory');
        break;
      case 'outerwear':
        items = wardrobe.filter((i) => i.category === 'outerwear');
        break;
      case 'tops':
        items = wardrobe.filter((i) => i.category === 'shirt' || i.category === 'tshirt');
        break;
      case 'bottoms':
        items = wardrobe.filter((i) => i.category === 'bottom');
        break;
      case 'footwear':
        items = wardrobe.filter((i) => i.category === 'footwear');
        break;
      case 'all':
      default:
        items = [...wardrobe];
        break;
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

  // Rarity accent line color
  const getRarityColor = (vibe: string) => {
    switch (vibe?.toLowerCase()) {
      case 'formal':
        return 'bg-purple-500';
      case 'streetwear':
        return 'bg-amber-500';
      case 'athletic':
        return 'bg-emerald-500';
      case 'casual':
      default:
        return 'bg-cyan-500';
    }
  };

  return (
    <div className="w-full h-full flex items-stretch select-none">
      {/* Subcategory Icon Rail (only in fashion tab) */}
      {mainTab === 'fashion' && (
        <div className="w-10 sm:w-12 bg-[#090a0e]/80 border-r border-white/5 flex flex-col items-center py-2 sm:py-3 gap-1 sm:gap-1.5 flex-shrink-0">
          {SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            const isActive = subCategory === sub.id;
            const count = (() => {
              switch (sub.id) {
                case 'accessories': return wardrobe.filter(i => i.category === 'accessory').length;
                case 'outerwear': return wardrobe.filter(i => i.category === 'outerwear').length;
                case 'tops': return wardrobe.filter(i => i.category === 'shirt' || i.category === 'tshirt').length;
                case 'bottoms': return wardrobe.filter(i => i.category === 'bottom').length;
                case 'footwear': return wardrobe.filter(i => i.category === 'footwear').length;
                case 'all': return wardrobe.length;
              }
            })();

            return (
              <button
                key={sub.id}
                onClick={() => setSubCategory(sub.id)}
                title={sub.label}
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-400/60 shadow-md shadow-amber-500/10'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[13px] h-[13px] sm:min-w-[14px] sm:h-[14px] rounded-full text-[7px] sm:text-[8px] font-mono font-bold flex items-center justify-center ${
                    isActive ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-700 text-zinc-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area (3-Column Item Grid or Subpanels) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Search Bar */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-white/5 bg-black/30">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${subCategory} in vault...`}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-black/50 border border-white/10 focus:border-amber-400 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onOpenScanner}
            title="Scan and Add New Garment"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black font-mono text-xs uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/20 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>

        {/* Dynamic Panel Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* TAB: STYLIST AI */}
          {mainTab === 'generator' && (
            <OutfitGeneratorPanel
              wardrobe={wardrobe}
              onEquipOutfit={onEquipOutfit}
              onSaveLoadout={onSaveLoadout}
              onOpenScanner={onOpenScanner}
            />
          )}

          {/* TAB: SAVED OUTFITS - IRON MAN HALL OF ARMOR SUIT CHAMBERS */}
          {mainTab === 'outfits' && (
            <HallOfArmorOutfits
              savedOutfits={savedOutfits}
              wardrobe={wardrobe}
              equippedItems={equippedItems}
              onEquipOutfit={onEquipOutfit}
              onDeleteOutfit={onDeleteOutfit}
              onOpenStylist={() => setMainTab('generator')}
              onOpenScanner={onOpenScanner}
            />
          )}

          {/* TAB: FASHION (Free Fire 3-Column Grid) */}
          {mainTab === 'fashion' && (
            <div>
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <Shirt className="w-10 h-10 text-zinc-600 mb-3" />
                  <h4 className="text-sm font-bold font-mono uppercase text-white">
                    {searchQuery ? 'No Matches Found' : `No ${subCategory} In Vault`}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    {searchQuery
                      ? 'Try another search term or clear the filter.'
                      : 'Scan your real clothing using client-side background removal.'}
                  </p>
                  <button
                    onClick={onOpenScanner}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider"
                  >
                    Scan Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-3">
                  {filteredItems.map((item) => {
                    const equipped = isEquipped(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleEquip(item)}
                        className={`relative aspect-square rounded-xl bg-[#15161c] border transition-all cursor-pointer group flex flex-col items-center justify-between p-1.5 sm:p-2 overflow-hidden ${
                          equipped
                            ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                            : 'border-white/5 hover:border-white/20 hover:bg-[#1a1b24]'
                        }`}
                      >
                        {/* Top Info and Delete button */}
                        <div className="w-full flex items-center justify-between z-10">
                          {equipped ? (
                            <span className="text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              ON
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono text-zinc-500 uppercase truncate max-w-[60px]">
                              {item.style_vibe}
                            </span>
                          )}

                          <button
                            onClick={(e) => handleDelete(e, item.id)}
                            disabled={deletingId === item.id}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-black/80 hover:bg-red-500 text-zinc-400 hover:text-white transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Garment Image Showcase */}
                        <div className="relative w-full h-[65%] flex items-center justify-center my-auto">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] group-hover:scale-110 transition-transform duration-200"
                          />
                        </div>

                        {/* Free Fire Bottom Rarity Accent Bar */}
                        <div className="w-full flex flex-col items-center z-10">
                          <p className="text-[9px] font-mono font-semibold text-zinc-300 truncate w-full text-center">
                            {item.name}
                          </p>
                          <div
                            className={`w-full h-1 rounded-full mt-1 ${
                              equipped ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : getRarityColor(item.style_vibe)
                            }`}
                          />
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

      {/* Far-Right Main Category Tabs (Free Fire style vertical stack) */}
      <div className="w-14 sm:w-20 bg-[#06070a]/90 border-l border-white/10 flex flex-col items-stretch flex-shrink-0">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`py-4 sm:py-6 px-1 text-center text-[9px] sm:text-xs font-black font-mono tracking-wider sm:tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-1 border-b border-white/10 ${
              mainTab === tab.id
                ? 'bg-amber-400 text-zinc-950 shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            {tab.id === 'outfits' && savedOutfits.length > 0 && (
              <span
                className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 sm:py-0.5 rounded-full font-mono ${
                  mainTab === 'outfits' ? 'bg-black text-amber-300' : 'bg-white/10 text-zinc-300'
                }`}
              >
                {savedOutfits.length}
              </span>
            )}
          </button>
        ))}

        {/* Quick Scanner Action at bottom */}
        <button
          onClick={onOpenScanner}
          className="mt-auto py-3 sm:py-5 px-1 text-center text-[9px] sm:text-xs font-bold font-mono tracking-wider uppercase text-amber-400 hover:bg-amber-500/10 border-t border-white/10 transition-colors flex flex-col items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[8px] sm:text-[10px]">SCAN</span>
        </button>
      </div>
    </div>
  );
}
