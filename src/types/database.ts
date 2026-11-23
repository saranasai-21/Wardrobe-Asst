export type GarmentCategory =
  | 'shirt'
  | 'tshirt'
  | 'outerwear'
  | 'bottom'
  | 'footwear'
  | 'accessory';

export type PatternType = 'solid' | 'patterned';

export type StyleVibe = 'casual' | 'formal' | 'streetwear' | 'athletic';

export interface FitTransform {
  scale: number;
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
  rotation: number;
}

export interface LandmarkPoint {
  x: number; // normalized [0, 1]
  y: number; // normalized [0, 1]
  z?: number;
  visibility?: number;
}

export interface BodyLandmarks {
  left_shoulder?: LandmarkPoint;
  right_shoulder?: LandmarkPoint;
  left_hip?: LandmarkPoint;
  right_hip?: LandmarkPoint;
  left_knee?: LandmarkPoint;
  right_knee?: LandmarkPoint;
  left_ankle?: LandmarkPoint;
  right_ankle?: LandmarkPoint;
  detected?: boolean;
}

export interface ColorSwatch {
  hex: string;
  hsl: [number, number, number]; // [h 0-360, s 0-100, l 0-100]
  percentage: number;
  isNeutral: boolean;
}

export interface AvatarRecord {
  id: string;
  user_id: string;
  image_url: string;
  landmarks: BodyLandmarks;
  width: number;
  height: number;
  is_active: boolean;
  created_at: string;
}

export interface WardrobeItemRecord {
  id: string;
  user_id: string;
  name: string;
  category: GarmentCategory;
  image_url: string;
  primary_color: string;
  secondary_color?: string | null;
  color_palette: ColorSwatch[];
  is_neutral: boolean;
  pattern_type: PatternType;
  style_vibe: StyleVibe;
  fit_transform: FitTransform;
  created_at: string;
  updated_at: string;
}

export interface OutfitRecord {
  id: string;
  user_id: string;
  name: string;
  item_ids: string[];
  score: number;
  style_reason: string;
  style_vibe: StyleVibe | string;
  created_at: string;
}

export interface GeneratedOutfit {
  id: string;
  name: string;
  score: number;
  reason: string;
  styleVibe: StyleVibe | string;
  items: WardrobeItemRecord[];
}

export interface UserSessionRecord {
  user_id: string;
  session_id: string;
  device_info: string;
  updated_at: string;
}
