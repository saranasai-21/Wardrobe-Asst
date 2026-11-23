'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  AvatarRecord,
  WardrobeItemRecord,
  OutfitRecord,
  FitTransform,
  BodyLandmarks,
  GarmentCategory,
  PatternType,
  StyleVibe,
  ColorSwatch,
} from '@/types/database';
import {
  getActiveAvatar,
  saveAvatar,
  getWardrobeItems,
  saveWardrobeItem,
  updateWardrobeItemFit,
  deleteWardrobeItem,
  getSavedOutfits,
  saveOutfit,
  deleteOutfit,
  uploadToStorage,
} from '@/lib/supabase/db';
import { calculateAutoFitTransform } from '@/lib/pose';
import { getDefaultMannequinAvatar } from '@/lib/mannequin';
import { Navbar } from '@/components/Navbar';
import { AvatarStage } from '@/components/AvatarStage';
import { WardrobeVault } from '@/components/WardrobeVault';
import { AvatarUploadModal } from '@/components/AvatarUploadModal';
import { GarmentScannerModal } from '@/components/GarmentScannerModal';
import { SettingsModal } from '@/components/SettingsModal';
import { InitialAvatarDialog } from '@/components/InitialAvatarDialog';
import { SessionGuard } from '@/components/SessionGuard';
import { RefreshCw, Zap, Shirt, User, Eye, LayoutGrid } from 'lucide-react';

export default function VaultPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string>('guest-user');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  const [avatar, setAvatar] = useState<AvatarRecord | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItemRecord[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<OutfitRecord[]>([]);
  const [equippedItems, setEquippedItems] = useState<WardrobeItemRecord[]>([]);

  // Mobile viewport view: 'vault' (default on mobile), 'character', or 'split'
  const [mobileView, setMobileView] = useState<'vault' | 'character' | 'split'>('vault');

  // Modals
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [initialAvatarOpen, setInitialAvatarOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  /**
   * Load User and Wardrobe Data on Mount
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeVault() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let uid = 'demo-user-id';
        if (user) {
          uid = user.id;
          if (isMounted) {
            setUserId(user.id);
            setUserEmail(user.email ?? null);
          }
        } else {
          if (isMounted) {
            setUserId(uid);
            setUserEmail('designer@wardrobelab.io');
          }
        }

        // Fetch User's Data
        const [activeAv, items, outfits] = await Promise.all([
          getActiveAvatar(uid).catch(() => null),
          getWardrobeItems(uid).catch(() => []),
          getSavedOutfits(uid).catch(() => []),
        ]);

        if (isMounted) {
          setAvatar(activeAv);
          setWardrobe(items);
          setSavedOutfits(outfits);
          if (!activeAv) {
            setInitialAvatarOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to initialize vault:', err);
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    }

    initializeVault();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Equip or Swap Garment
   */
  const handleEquipItem = useCallback(
    (item: WardrobeItemRecord) => {
      setEquippedItems((prev) => {
        let isSameCategory = (cat: GarmentCategory) => {
          if (item.category === 'shirt' || item.category === 'tshirt') {
            return cat === 'shirt' || cat === 'tshirt';
          }
          return cat === item.category;
        };

        const filtered = prev.filter((i) => !isSameCategory(i.category));

        let fit = item.fit_transform;
        if (!fit || (fit.scale === 1 && fit.x === 0 && fit.y === 0)) {
          if (avatar) {
            fit = calculateAutoFitTransform(avatar.landmarks, item.category);
          }
        }

        return [...filtered, { ...item, fit_transform: fit }];
      });
    },
    [avatar]
  );

  const handleUnequipItem = useCallback((item: WardrobeItemRecord) => {
    setEquippedItems((prev) => prev.filter((i) => i.id !== item.id));
  }, []);

  const handleClearAllEquipped = useCallback(() => {
    setEquippedItems([]);
  }, []);

  /**
   * Equip an Entire Outfit Loadout
   */
  const handleEquipOutfit = useCallback((items: WardrobeItemRecord[]) => {
    setEquippedItems(items);
    showNotification('Outfit loadout equipped!');
  }, []);

  /**
   * Update Fit Transform for Item and Persist
   */
  const handleUpdateItemFit = async (item: WardrobeItemRecord, newFit: FitTransform) => {
    setEquippedItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, fit_transform: newFit } : i))
    );
    setWardrobe((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, fit_transform: newFit } : i))
    );

    try {
      await updateWardrobeItemFit(item.id, newFit);
      showNotification('Fit calibration saved!');
    } catch (e) {
      console.warn('Could not persist fit to cloud:', e);
    }
  };

  /**
   * Handle Scanned Garment Save
   */
  const handleSaveScannedGarment = async (itemData: {
    name: string;
    category: GarmentCategory;
    fileBlob: Blob;
    primaryColor: string;
    secondaryColor?: string | null;
    colorPalette: ColorSwatch[];
    isNeutral: boolean;
    patternType: PatternType;
    styleVibe: StyleVibe;
  }) => {
    let imageUrl = '';
    try {
      imageUrl = await uploadToStorage(itemData.fileBlob, 'garments', userId);
    } catch (storageErr) {
      console.warn('Storage upload failed, using local object URL for session:', storageErr);
      imageUrl = URL.createObjectURL(itemData.fileBlob);
    }

    const initialFit = avatar
      ? calculateAutoFitTransform(avatar.landmarks, itemData.category)
      : { scale: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0 };

    let savedRecord: WardrobeItemRecord;
    try {
      savedRecord = await saveWardrobeItem({
        userId,
        name: itemData.name,
        category: itemData.category,
        imageUrl,
        primaryColor: itemData.primaryColor,
        secondaryColor: itemData.secondaryColor,
        colorPalette: itemData.colorPalette,
        isNeutral: itemData.isNeutral,
        patternType: itemData.patternType,
        styleVibe: itemData.styleVibe,
        fitTransform: initialFit,
      });
    } catch (dbErr) {
      console.warn('DB insert failed, storing in local state:', dbErr);
      savedRecord = {
        id: `garment_${Date.now()}`,
        user_id: userId,
        name: itemData.name,
        category: itemData.category,
        image_url: imageUrl,
        primary_color: itemData.primaryColor,
        secondary_color: itemData.secondaryColor,
        color_palette: itemData.colorPalette,
        is_neutral: itemData.isNeutral,
        pattern_type: itemData.patternType,
        style_vibe: itemData.styleVibe,
        fit_transform: initialFit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    setWardrobe((prev) => [savedRecord, ...prev]);
    handleEquipItem(savedRecord);
    showNotification(`${savedRecord.name} scanned and saved to Vault!`);
  };

  /**
   * Handle Avatar Upload and Save
   */
  const handleSaveAvatar = async (
    fileBlob: Blob,
    landmarks: BodyLandmarks,
    width: number,
    height: number
  ) => {
    let imageUrl = '';
    try {
      imageUrl = await uploadToStorage(fileBlob, 'avatars', userId);
    } catch (storageErr) {
      console.warn('Avatar storage upload failed, using local object URL:', storageErr);
      imageUrl = URL.createObjectURL(fileBlob);
    }

    let savedAvatar: AvatarRecord;
    try {
      savedAvatar = await saveAvatar({
        userId,
        imageUrl,
        landmarks,
        width,
        height,
      });
    } catch (dbErr) {
      console.warn('Avatar insert failed, storing in local state:', dbErr);
      savedAvatar = {
        id: `avatar_${Date.now()}`,
        user_id: userId,
        image_url: imageUrl,
        landmarks,
        width,
        height,
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }

    setAvatar(savedAvatar);
    showNotification('New avatar calibrated and saved!');
  };

  /**
   * Use Default Studio Mannequin
   */
  const handleUseMannequin = () => {
    const mannequinAvatar = getDefaultMannequinAvatar(userId);
    setAvatar(mannequinAvatar);
    showNotification('Studio Mannequin loaded with calibrated pose anchors!');
  };

  /**
   * Delete Wardrobe Item
   */
  const handleDeleteGarment = async (itemId: string) => {
    setEquippedItems((prev) => prev.filter((i) => i.id !== itemId));
    setWardrobe((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await deleteWardrobeItem(itemId);
      showNotification('Garment removed from Vault.');
    } catch (e) {
      console.warn('Could not delete:', e);
    }
  };

  /**
   * Save Outfit Loadout
   */
  const handleSaveLoadout = async (outfit: {
    name: string;
    itemIds: string[];
    score: number;
    styleReason: string;
    styleVibe: string;
  }) => {
    try {
      const saved = await saveOutfit({
        userId,
        name: outfit.name,
        itemIds: outfit.itemIds,
        score: outfit.score,
        styleReason: outfit.styleReason,
        styleVibe: outfit.styleVibe,
      });
      setSavedOutfits((prev) => [saved, ...prev]);
      showNotification('Outfit loadout saved!');
    } catch (err) {
      console.warn('Could not save outfit to DB, storing locally:', err);
      const fallbackOutfit: OutfitRecord = {
        id: `outfit_${Date.now()}`,
        user_id: userId,
        name: outfit.name,
        item_ids: outfit.itemIds,
        score: outfit.score,
        style_reason: outfit.styleReason,
        style_vibe: outfit.styleVibe,
        created_at: new Date().toISOString(),
      };
      setSavedOutfits((prev) => [fallbackOutfit, ...prev]);
      showNotification('Outfit loadout saved!');
    }
  };

  /**
   * Delete Outfit Loadout
   */
  const handleDeleteOutfit = async (outfitId: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== outfitId));
    try {
      await deleteOutfit(outfitId);
      showNotification('Outfit loadout deleted.');
    } catch (e) {
      console.warn('Could not delete outfit:', e);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-zinc-400">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-300">
          Synchronizing Vault...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#09090B] text-zinc-100 flex flex-col relative overflow-hidden select-none">
      {/* Single Active Session Guard */}
      <SessionGuard userId={userId} />

      {/* Top Navigation */}
      <Navbar
        userEmail={userEmail}
        onOpenScanner={() => setScannerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* MOBILE SEGMENTED VIEW SWITCHER (< lg screens) */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-[#09090b] border-b border-white/10 z-20 flex-shrink-0">
        <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setMobileView('vault')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              mobileView === 'vault'
                ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Vault ({wardrobe.length})</span>
          </button>

          <button
            onClick={() => setMobileView('character')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              mobileView === 'character'
                ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Character</span>
            {equippedItems.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setMobileView('split')}
            className={`hidden sm:flex px-2.5 py-1.5 rounded-lg items-center gap-1 transition-all ${
              mobileView === 'split'
                ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
        </div>

        {/* Quick Equipped Badge */}
        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">{equippedItems.length}</span>
          <span className="text-zinc-500">Equipped</span>
        </div>
      </div>

      {/* ============================================================
          VAULT LAYOUT ENGINE:
          DESKTOP (lg:flex): Free Fire 3-Panel Side-by-Side:
            LEFT   = Character/Avatar Stage (~35%, max 480px)
            CENTER = Item Grid (WardrobeVault component, ~50%)
            RIGHT  = Vertical Category Tabs (inside WardrobeVault, ~15%)
          
          MOBILE (< lg):
            Responsive mode switcher:
              'vault'     = Full-height Free Fire grid + floating Avatar PIP
              'character' = Full-height Avatar stage + floating 'Open Vault' pill
              'split'     = Top avatar stage (38vh) + bottom grid (flex-1)
          ============================================================ */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP LEFT: Character Stage */}
        <div className="w-[35%] min-w-[300px] max-w-[480px] border-r border-white/5 flex-shrink-0 hidden lg:flex">
          <AvatarStage
            avatar={avatar}
            equippedItems={equippedItems}
            onUnequip={handleUnequipItem}
            onClearAll={handleClearAllEquipped}
            onOpenAvatarUpload={() => setInitialAvatarOpen(true)}
            onUpdateItemFit={handleUpdateItemFit}
            onUseMannequin={handleUseMannequin}
          />
        </div>

        {/* DESKTOP CENTER+RIGHT / MOBILE DYNAMIC VIEW */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0d12] relative overflow-hidden">
          {/* MOBILE: Split View Mode */}
          {mobileView === 'split' && (
            <div className="lg:hidden h-[38vh] min-h-[260px] border-b border-white/5 flex-shrink-0">
              <AvatarStage
                avatar={avatar}
                equippedItems={equippedItems}
                onUnequip={handleUnequipItem}
                onClearAll={handleClearAllEquipped}
                onOpenAvatarUpload={() => setInitialAvatarOpen(true)}
                onUpdateItemFit={handleUpdateItemFit}
                onUseMannequin={handleUseMannequin}
              />
            </div>
          )}

          {/* MOBILE: Character Stage Mode (Full Screen) */}
          {mobileView === 'character' && (
            <div className="lg:hidden flex-1 flex flex-col min-h-0 relative">
              <AvatarStage
                avatar={avatar}
                equippedItems={equippedItems}
                onUnequip={handleUnequipItem}
                onClearAll={handleClearAllEquipped}
                onOpenAvatarUpload={() => setInitialAvatarOpen(true)}
                onUpdateItemFit={handleUpdateItemFit}
                onUseMannequin={handleUseMannequin}
              />

              {/* Floating Action: Open Vault Items */}
              <button
                onClick={() => setMobileView('vault')}
                className="absolute bottom-16 right-4 z-30 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl shadow-amber-400/30 active:scale-95 transition-all"
              >
                <Shirt className="w-4 h-4" />
                <span>Browse Vault Grid</span>
              </button>
            </div>
          )}

          {/* VAULT GRID VIEW (Desktop always visible, mobile visible when 'vault' or 'split') */}
          <div
            className={`flex-1 flex min-h-0 ${
              mobileView === 'character' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <WardrobeVault
              wardrobe={wardrobe}
              savedOutfits={savedOutfits}
              equippedItems={equippedItems}
              onEquipItem={handleEquipItem}
              onUnequipItem={handleUnequipItem}
              onDeleteItem={handleDeleteGarment}
              onEquipOutfit={handleEquipOutfit}
              onDeleteOutfit={handleDeleteOutfit}
              onSaveLoadout={handleSaveLoadout}
              onOpenScanner={() => setScannerOpen(true)}
            />
          </div>

          {/* MOBILE: Floating Avatar Quick-Preview PIP on 'vault' view */}
          {mobileView === 'vault' && (
            <button
              onClick={() => setMobileView('character')}
              title="Tap to view full Character Stage"
              className="lg:hidden fixed bottom-4 left-4 z-40 p-2 pr-3 rounded-2xl bg-zinc-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-mono text-white active:scale-95 transition-all hover:border-amber-400 ring-1 ring-amber-400/20"
            >
              <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar.image_url}
                    alt="Avatar"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <User className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>View Stage</span>
                  <Eye className="w-3 h-3" />
                </div>
                <div className="text-[9px] text-zinc-400">{equippedItems.length} active</div>
              </div>
            </button>
          )}
        </div>
      </main>

      {/* Modals */}
      <InitialAvatarDialog
        isOpen={initialAvatarOpen && !avatar}
        onOpenUpload={() => {
          setInitialAvatarOpen(false);
          setAvatarModalOpen(true);
        }}
        onSelectMannequin={() => {
          setInitialAvatarOpen(false);
          handleUseMannequin();
        }}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        avatar={avatar}
        userEmail={userEmail}
        onOpenAvatarUpload={() => setAvatarModalOpen(true)}
        onUseMannequin={handleUseMannequin}
        onClearEquipped={handleClearAllEquipped}
      />

      <AvatarUploadModal
        userId={userId}
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSaveAvatar={handleSaveAvatar}
      />

      <GarmentScannerModal
        userId={userId}
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSaveGarment={handleSaveScannedGarment}
      />
    </div>
  );
}
