/**
 * Client-Side Body Calibration with MediaPipe Pose Landmarker
 * 100% free, runs in-browser via WebAssembly / WebGPU
 */

import { BodyLandmarks, FitTransform, GarmentCategory } from '@/types/database';

let poseLandmarkerInstance: any = null;

/**
 * Initialize MediaPipe PoseLandmarker
 */
export async function getPoseLandmarker() {
  if (poseLandmarkerInstance) return poseLandmarkerInstance;

  const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
  });

  return poseLandmarkerInstance;
}

/**
 * Detect normalized body landmarks from an image
 */
export async function detectPoseLandmarks(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<BodyLandmarks> {
  try {
    const landmarker = await getPoseLandmarker();
    const result = landmarker.detect(imageSource);

    if (result && result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];

      // MediaPipe Pose Landmark Indices:
      // 11: left_shoulder, 12: right_shoulder
      // 23: left_hip, 24: right_hip
      // 25: left_knee, 26: right_knee
      // 27: left_ankle, 28: right_ankle
      return {
        left_shoulder: { x: lm[11].x, y: lm[11].y, visibility: lm[11].visibility },
        right_shoulder: { x: lm[12].x, y: lm[12].y, visibility: lm[12].visibility },
        left_hip: { x: lm[23].x, y: lm[23].y, visibility: lm[23].visibility },
        right_hip: { x: lm[24].x, y: lm[24].y, visibility: lm[24].visibility },
        left_knee: { x: lm[25].x, y: lm[25].y, visibility: lm[25].visibility },
        right_knee: { x: lm[26].x, y: lm[26].y, visibility: lm[26].visibility },
        left_ankle: { x: lm[27].x, y: lm[27].y, visibility: lm[27].visibility },
        right_ankle: { x: lm[28].x, y: lm[28].y, visibility: lm[28].visibility },
        detected: true,
      };
    }
  } catch (err) {
    console.warn('Pose landmark detection failed or timed out. Falling back to anatomical defaults.', err);
  }

  // Graceful fallback default normalized proportions
  return getFallbackLandmarks();
}

/**
 * Robust proportional fallback landmarks based on golden human anatomy ratios
 */
export function getFallbackLandmarks(): BodyLandmarks {
  return {
    left_shoulder: { x: 0.62, y: 0.22, visibility: 0.8 },
    right_shoulder: { x: 0.38, y: 0.22, visibility: 0.8 },
    left_hip: { x: 0.58, y: 0.50, visibility: 0.8 },
    right_hip: { x: 0.42, y: 0.50, visibility: 0.8 },
    left_knee: { x: 0.57, y: 0.70, visibility: 0.8 },
    right_knee: { x: 0.43, y: 0.70, visibility: 0.8 },
    left_ankle: { x: 0.56, y: 0.90, visibility: 0.8 },
    right_ankle: { x: 0.44, y: 0.90, visibility: 0.8 },
    detected: false,
  };
}

/**
 * Calculates initial auto-fit transform percentage and offset based on landmarks and category
 */
export function calculateAutoFitTransform(
  landmarks: BodyLandmarks,
  category: GarmentCategory
): FitTransform {
  const lm = landmarks.detected ? landmarks : getFallbackLandmarks();

  const ls = lm.left_shoulder || { x: 0.62, y: 0.22 };
  const rs = lm.right_shoulder || { x: 0.38, y: 0.22 };
  const lh = lm.left_hip || { x: 0.58, y: 0.50 };
  const rh = lm.right_hip || { x: 0.42, y: 0.50 };
  const la = lm.left_ankle || { x: 0.56, y: 0.90 };
  const ra = lm.right_ankle || { x: 0.44, y: 0.90 };

  const shoulderCenterX = (ls.x + rs.x) / 2;
  const shoulderCenterY = (ls.y + rs.y) / 2;
  const hipCenterX = (lh.x + rh.x) / 2;
  const hipCenterY = (lh.y + rh.y) / 2;
  const ankleCenterX = (la.x + ra.x) / 2;
  const ankleCenterY = (la.y + ra.y) / 2;

  const shoulderWidth = Math.abs(ls.x - rs.x);
  const torsoHeight = Math.abs(hipCenterY - shoulderCenterY);
  const legHeight = Math.abs(ankleCenterY - hipCenterY);

  switch (category) {
    case 'shirt':
    case 'tshirt': {
      // Anchored at torso center, width slightly larger than shoulder width
      const targetScale = Math.max(0.7, shoulderWidth * 2.1);
      return {
        scale: Number(targetScale.toFixed(2)),
        scaleX: 1.0,
        scaleY: 1.0,
        x: Math.round((shoulderCenterX - 0.5) * 100),
        y: Math.round(((shoulderCenterY + torsoHeight * 0.45) - 0.5) * 100),
        rotation: 0,
      };
    }
    case 'outerwear': {
      // Slightly larger and broader than shirts
      const targetScale = Math.max(0.75, shoulderWidth * 2.3);
      return {
        scale: Number(targetScale.toFixed(2)),
        scaleX: 1.05,
        scaleY: 1.05,
        x: Math.round((shoulderCenterX - 0.5) * 100),
        y: Math.round(((shoulderCenterY + torsoHeight * 0.5) - 0.5) * 100),
        rotation: 0,
      };
    }
    case 'bottom': {
      // Anchored from hips down through legs
      const targetScale = Math.max(0.8, legHeight * 1.5);
      return {
        scale: Number(targetScale.toFixed(2)),
        scaleX: 1.0,
        scaleY: 1.0,
        x: Math.round((hipCenterX - 0.5) * 100),
        y: Math.round(((hipCenterY + legHeight * 0.45) - 0.5) * 100),
        rotation: 0,
      };
    }
    case 'footwear': {
      return {
        scale: 0.65,
        scaleX: 1.0,
        scaleY: 1.0,
        x: Math.round((ankleCenterX - 0.5) * 100),
        y: Math.round((ankleCenterY - 0.48) * 100),
        rotation: 0,
      };
    }
    case 'accessory': {
      return {
        scale: 0.5,
        scaleX: 1.0,
        scaleY: 1.0,
        x: Math.round((shoulderCenterX - 0.5) * 100),
        y: Math.round((shoulderCenterY - 0.58) * 100),
        rotation: 0,
      };
    }
  }
}
