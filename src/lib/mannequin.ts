import { AvatarRecord, BodyLandmarks } from '@/types/database';

/**
 * High-craft minimalist dark mannequin SVG representation.
 * Allows instant outfit preview and equipping even before the user uploads a personal photo.
 */
export const DEFAULT_MANNEQUIN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none">
  <!-- Subtle Body Contour / Mannequin Silhouette -->
  <!-- Head -->
  <ellipse cx="200" cy="85" rx="38" ry="48" fill="%2327272a" stroke="%233f3f46" stroke-width="2"/>
  <!-- Neck -->
  <path d="M188 130 L188 160 L212 160 L212 130 Z" fill="%2327272a"/>
  <!-- Torso & Shoulders -->
  <path d="M130 170 Q200 155 270 170 L250 380 Q200 395 150 380 Z" fill="%2327272a" stroke="%233f3f46" stroke-width="2"/>
  <!-- Chest Line Accent -->
  <path d="M150 240 Q200 260 250 240" stroke="%2352525b" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/>
  <!-- Waist Accent -->
  <ellipse cx="200" cy="380" rx="48" ry="8" stroke="%2352525b" stroke-width="1.5" fill="none"/>
  <!-- Left Leg -->
  <path d="M152 385 L144 550 L148 720 L166 720 L176 550 L194 388 Z" fill="%2327272a" stroke="%233f3f46" stroke-width="2"/>
  <!-- Right Leg -->
  <path d="M206 388 L224 550 L234 720 L252 720 L256 550 L248 385 Z" fill="%2327272a" stroke="%233f3f46" stroke-width="2"/>
  <!-- Feet -->
  <ellipse cx="157" cy="730" rx="14" ry="7" fill="%233f3f46"/>
  <ellipse cx="243" cy="730" rx="14" ry="7" fill="%233f3f46"/>
  <!-- Arms Silhouette (Subtle) -->
  <path d="M128 175 L108 340 L102 460" stroke="%2327272a" stroke-width="14" stroke-linecap="round"/>
  <path d="M272 175 L292 340 L298 460" stroke="%2327272a" stroke-width="14" stroke-linecap="round"/>
</svg>`;

export const DEFAULT_MANNEQUIN_LANDMARKS: BodyLandmarks = {
  left_shoulder: { x: 0.675, y: 0.21, visibility: 0.99 },
  right_shoulder: { x: 0.325, y: 0.21, visibility: 0.99 },
  left_hip: { x: 0.62, y: 0.48, visibility: 0.99 },
  right_hip: { x: 0.38, y: 0.48, visibility: 0.99 },
  left_knee: { x: 0.61, y: 0.69, visibility: 0.99 },
  right_knee: { x: 0.39, y: 0.69, visibility: 0.99 },
  left_ankle: { x: 0.605, y: 0.91, visibility: 0.99 },
  right_ankle: { x: 0.395, y: 0.91, visibility: 0.99 },
  detected: true,
};

export function getDefaultMannequinAvatar(userId: string): AvatarRecord {
  return {
    id: 'mannequin_default',
    user_id: userId,
    image_url: DEFAULT_MANNEQUIN_SVG,
    landmarks: DEFAULT_MANNEQUIN_LANDMARKS,
    width: 400,
    height: 800,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}
