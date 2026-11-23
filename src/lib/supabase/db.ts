import { createClient } from './client';
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

/**
 * Upload an image Blob/File to Supabase Storage in user's isolated folder
 */
export async function uploadToStorage(
  file: Blob | File,
  bucket: 'avatars' | 'garments',
  userId: string,
  fileName?: string
): Promise<string> {
  const supabase = createClient();
  const fileExt = file.type === 'image/webp' ? 'webp' : 'png';
  const name = fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const path = `${userId}/${name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || 'image/png',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/**
 * Fetch the active user's avatar
 */
export async function getActiveAvatar(userId: string): Promise<AvatarRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('avatars')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active avatar:', error);
    return null;
  }
  return data as AvatarRecord | null;
}

/**
 * Save or replace user's avatar
 */
export async function saveAvatar(avatar: {
  userId: string;
  imageUrl: string;
  landmarks: BodyLandmarks;
  width: number;
  height: number;
}): Promise<AvatarRecord> {
  const supabase = createClient();

  // Deactivate prior avatars
  await supabase
    .from('avatars')
    .update({ is_active: false })
    .eq('user_id', avatar.userId);

  const { data, error } = await supabase
    .from('avatars')
    .insert({
      user_id: avatar.userId,
      image_url: avatar.imageUrl,
      landmarks: avatar.landmarks,
      width: avatar.width,
      height: avatar.height,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save avatar: ${error.message}`);
  }
  return data as AvatarRecord;
}

/**
 * Fetch all wardrobe items for the authenticated user
 */
export async function getWardrobeItems(userId: string): Promise<WardrobeItemRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wardrobe items:', error);
    return [];
  }
  return (data || []) as WardrobeItemRecord[];
}

/**
 * Save a newly scanned wardrobe item
 */
export async function saveWardrobeItem(item: {
  userId: string;
  name: string;
  category: GarmentCategory;
  imageUrl: string;
  primaryColor: string;
  secondaryColor?: string | null;
  colorPalette: ColorSwatch[];
  isNeutral: boolean;
  patternType: PatternType;
  styleVibe: StyleVibe;
  fitTransform?: FitTransform;
}): Promise<WardrobeItemRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert({
      user_id: item.userId,
      name: item.name,
      category: item.category,
      image_url: item.imageUrl,
      primary_color: item.primaryColor,
      secondary_color: item.secondaryColor || null,
      color_palette: item.colorPalette,
      is_neutral: item.isNeutral,
      pattern_type: item.patternType,
      style_vibe: item.styleVibe,
      fit_transform: item.fitTransform || {
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        rotation: 0,
      },
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save wardrobe item: ${error.message}`);
  }
  return data as WardrobeItemRecord;
}

/**
 * Update the calibrated fit transform for a specific garment
 */
export async function updateWardrobeItemFit(
  itemId: string,
  fitTransform: FitTransform
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      fit_transform: fitTransform,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error('Failed to update garment fit:', error);
    throw new Error(`Failed to update garment fit: ${error.message}`);
  }
}

/**
 * Delete a wardrobe item
 */
export async function deleteWardrobeItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to delete wardrobe item: ${error.message}`);
  }
}

/**
 * Fetch all saved outfits for user
 */
export async function getSavedOutfits(userId: string): Promise<OutfitRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching outfits:', error);
    return [];
  }
  return (data || []) as OutfitRecord[];
}

/**
 * Save an outfit loadout
 */
export async function saveOutfit(outfit: {
  userId: string;
  name: string;
  itemIds: string[];
  score: number;
  styleReason: string;
  styleVibe: StyleVibe | string;
}): Promise<OutfitRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('outfits')
    .insert({
      user_id: outfit.userId,
      name: outfit.name,
      item_ids: outfit.itemIds,
      score: outfit.score,
      style_reason: outfit.styleReason,
      style_vibe: outfit.styleVibe,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save outfit: ${error.message}`);
  }
  return data as OutfitRecord;
}

/**
 * Delete a saved outfit
 */
export async function deleteOutfit(outfitId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('outfits').delete().eq('id', outfitId);

  if (error) {
    throw new Error(`Failed to delete outfit: ${error.message}`);
  }
}
