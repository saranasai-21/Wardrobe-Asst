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
import { OnboardingGuide } from '@/components/OnboardingGuide';
import { SessionGuard } from '@/components/SessionGuard';
import { RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

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

  // Modals
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  /**
   * Load User & Wardrobe Data on Mount
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
          // If no session, set guest/demo user ID
          if (isMounted) {
            setUserId(uid);
            setUserEmail('designer@vaultstyle.io');
          }
        }

        // Fetch User's Data from Supabase
        const [activeAv, items, outfits] = await Promise.all([
          getActiveAvatar(uid).catch(() => null),
          getWardrobeItems(uid).catch(() => []),
          getSavedOutfits(uid).catch(() => []),
        ]);

        if (isMounted) {
          setAvatar(activeAv);
          setWardrobe(items);
          setSavedOutfits(outfits);
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
   * Strict Rule: Only 1 top, 1 bottom, 1 outerwear, 1 footwear, 1 accessory equipped at once.
   */
  const handleEquipItem = useCallback(
    (item: WardrobeItemRecord) => {
      setEquippedItems((prev) => {
        // Remove existing item of same category
        let isSameCategory = (cat: GarmentCategory) => {
          if (item.category === 'shirt' || item.category === 'tshirt') {
            return cat === 'shirt' || cat === 'tshirt';
          }
          return cat === item.category;
        };

        const filtered = prev.filter((i) => !isSameCategory(i.category));

        // If the item doesn't have custom transforms yet, calculate default fit
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
    showNotification('Outfit loadout equipped on avatar stage!');
  }, []);

  /**
   * Update Fit Transform for Item & Persist to Supabase
   */
  const handleUpdateItemFit = async (item: WardrobeItemRecord, newFit: FitTransform) => {
    // 1. Update in local equipped state
    setEquippedItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, fit_transform: newFit } : i))
    );

    // 2. Update in wardrobe list
    setWardrobe((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, fit_transform: newFit } : i))
    );

    // 3. Persist to Supabase
    try {
      await updateWardrobeItemFit(item.id, newFit);
      showNotification('Calibrated fit synced to Supabase Cloud!');
    } catch (e) {
      console.warn('Could not persist fit to cloud:', e);
    }
  };

  /**
   * Handle Scanned Garment Save (Upload to Supabase Storage & DB)
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
      // 1. Upload to Supabase Storage
      imageUrl = await uploadToStorage(itemData.fileBlob, 'garments', userId);
    } catch (storageErr) {
      console.warn('Storage upload failed, using local object URL for session:', storageErr);
      imageUrl = URL.createObjectURL(itemData.fileBlob);
    }

    // Compute initial auto-fit based on avatar landmarks
    const initialFit = avatar
      ? calculateAutoFitTransform(avatar.landmarks, itemData.category)
      : { scale: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0 };

    let savedRecord: WardrobeItemRecord;
    try {
      // 2. Insert into Supabase wardrobe_items table
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
      console.warn('Supabase DB insert failed, storing in local state:', dbErr);
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
    // Auto equip newly scanned item
    handleEquipItem(savedRecord);
    showNotification(`${savedRecord.name} scanned & saved to Vault!`);
  };

  /**
   * Handle Avatar Upload & Save (Upload to Supabase Storage & DB)
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
      console.warn('Supabase avatar insert failed, storing in local state:', dbErr);
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
    showNotification('New avatar calibrated & saved to Supabase!');
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
      console.warn('Could not delete from Supabase:', e);
    }
  };

  /**
   * Save Outfit Loadout to Supabase
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
      showNotification('Outfit loadout saved to Supabase!');
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
      console.warn('Could not delete outfit from Supabase:', e);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-zinc-400">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-300">
          Synchronizing Tactical Vault...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col relative overflow-x-hidden">
      {/* Single Active Session Guard (Auto log out previous device if logged into another) */}
      <SessionGuard userId={userId} />

      {/* Top Navigation */}
      <Navbar
        userEmail={userEmail}
        onOpenScanner={() => setScannerOpen(true)}
        onOpenAvatarUpload={() => setAvatarModalOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-3 sm:p-5 flex flex-col">
        {/* Onboarding Guide (Displays for new users) */}
        <OnboardingGuide
          hasAvatar={!!avatar}
          garmentCount={wardrobe.length}
          onOpenAvatarUpload={() => setAvatarModalOpen(true)}
          onOpenScanner={() => setScannerOpen(true)}
        />

        {/* Free Fire Vault Split-Screen Paradigm */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Stage (45% on Desktop): Interactive Avatar Studio */}
          <div className="lg:col-span-5 xl:col-span-5 h-[620px] lg:h-full min-h-[620px]">
            <AvatarStage
              avatar={avatar}
              equippedItems={equippedItems}
              onUnequip={handleUnequipItem}
              onClearAll={handleClearAllEquipped}
              onOpenAvatarUpload={() => setAvatarModalOpen(true)}
              onUpdateItemFit={handleUpdateItemFit}
              onUseMannequin={handleUseMannequin}
            />
          </div>

          {/* Right Panel (55% on Desktop): Categorized Wardrobe Vault */}
          <div className="lg:col-span-7 xl:col-span-7 h-full flex flex-col">
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
        </div>
      </main>

      {/* Modals */}
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
