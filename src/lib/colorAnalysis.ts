/**
 * Client-Side Color & Pattern Analyzer
 * Pure TypeScript + HTML5 Canvas (K-Means Clustering + Edge Variance)
 */

import { ColorSwatch, PatternType } from '@/types/database';

export interface GarmentAnalysis {
  primaryColor: string;
  secondaryColor: string | null;
  colorPalette: ColorSwatch[];
  isNeutral: boolean;
  patternType: PatternType;
}

/**
 * Convert RGB to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL [0-360, 0-100, 0-100]
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Determine whether an HSL color represents a neutral tone
 * (black, white, gray, beige, khaki, navy, denim)
 */
export function isNeutralColor(hsl: [number, number, number]): boolean {
  const [h, s, l] = hsl;

  // Black or near-black
  if (l <= 14) return true;

  // White or near-white
  if (l >= 88 && s <= 25) return true;

  // Grays (low saturation across any lightness)
  if (s <= 12) return true;

  // Navy (deep blue, low lightness)
  if (h >= 200 && h <= 250 && s >= 15 && s <= 70 && l <= 30) return true;

  // Denim blue
  if (h >= 195 && h <= 235 && s >= 15 && s <= 65 && l >= 20 && l <= 60) return true;

  // Beige / Cream / Khaki / Tan / Camel
  if (h >= 25 && h <= 55 && s >= 10 && s <= 50 && l >= 45 && l <= 85) return true;

  // Brown / Earth tones
  if (h >= 15 && h <= 40 && s >= 15 && s <= 60 && l >= 15 && l <= 45) return true;

  return false;
}

/**
 * Extract primary & secondary colors and detect patterns from an image using Canvas
 */
export async function analyzeGarmentImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | Blob | string
): Promise<GarmentAnalysis> {
  return new Promise((resolve, reject) => {
    let img: HTMLImageElement;
    let cleanupUrl: string | null = null;

    if (imageSource instanceof HTMLImageElement) {
      img = imageSource;
    } else if (imageSource instanceof HTMLCanvasElement) {
      const dataUrl = imageSource.toDataURL();
      img = new Image();
      img.src = dataUrl;
    } else if (imageSource instanceof Blob) {
      cleanupUrl = URL.createObjectURL(imageSource);
      img = new Image();
      img.src = cleanupUrl;
    } else {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSource;
    }

    const process = () => {
      if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(getFallbackAnalysis());
        return;
      }

      // Downsample for fast, accurate K-Means clustering (max 150px)
      const maxDim = 150;
      let w = img.naturalWidth || img.width || 300;
      let h = img.naturalHeight || img.height || 300;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Collect opaque pixels
      const pixels: [number, number, number][] = [];
      const grayPixels: number[][] = Array(h)
        .fill(0)
        .map(() => Array(w).fill(0));

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const a = data[idx + 3];
          if (a > 60) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            pixels.push([r, g, b]);
            grayPixels[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
          } else {
            grayPixels[y][x] = -1; // transparent
          }
        }
      }

      if (pixels.length === 0) {
        resolve(getFallbackAnalysis());
        return;
      }

      // 1. Run K-Means Clustering for K=4
      const clusters = runKMeans(pixels, 4, 8);
      const palette: ColorSwatch[] = clusters.map((c) => {
        const hex = rgbToHex(c.r, c.g, c.b);
        const hsl = rgbToHsl(c.r, c.g, c.b);
        return {
          hex,
          hsl,
          percentage: Math.round((c.count / pixels.length) * 100),
          isNeutral: isNeutralColor(hsl),
        };
      });

      // Sort by prominence
      palette.sort((a, b) => b.percentage - a.percentage);

      const primary = palette[0] || {
        hex: '#000000',
        hsl: [0, 0, 0] as [number, number, number],
        percentage: 100,
        isNeutral: true,
      };

      const secondary = palette.length > 1 && palette[1].percentage >= 15 ? palette[1] : null;

      // 2. Pattern detection via local Laplacian edge variance
      let edgeEnergy = 0;
      let validEdgeCount = 0;

      for (let y = 1; y < h - 1; y += 2) {
        for (let x = 1; x < w - 1; x += 2) {
          const center = grayPixels[y][x];
          if (center === -1) continue;

          const top = grayPixels[y - 1][x];
          const bottom = grayPixels[y + 1][x];
          const left = grayPixels[y][x - 1];
          const right = grayPixels[y][x + 1];

          if (top !== -1 && bottom !== -1 && left !== -1 && right !== -1) {
            const laplacian = Math.abs(4 * center - top - bottom - left - right);
            edgeEnergy += laplacian;
            validEdgeCount++;
          }
        }
      }

      const avgEdge = validEdgeCount > 0 ? edgeEnergy / validEdgeCount : 0;
      // High edge energy or significant multi-color split indicates graphic / pattern
      const isPatterned =
        avgEdge > 18 || (palette.length >= 2 && palette[1].percentage > 35 && !palette[1].isNeutral);

      resolve({
        primaryColor: primary.hex,
        secondaryColor: secondary ? secondary.hex : null,
        colorPalette: palette,
        isNeutral: primary.isNeutral,
        patternType: isPatterned ? 'patterned' : 'solid',
      });
    };

    if (img.complete && img.naturalWidth > 0) {
      process();
    } else {
      img.onload = () => process();
      img.onerror = () => resolve(getFallbackAnalysis());
    }
  });
}

function getFallbackAnalysis(): GarmentAnalysis {
  return {
    primaryColor: '#18181b',
    secondaryColor: null,
    colorPalette: [
      {
        hex: '#18181b',
        hsl: [240, 6, 10],
        percentage: 100,
        isNeutral: true,
      },
    ],
    isNeutral: true,
    patternType: 'solid',
  };
}

/**
 * Simple, fast K-Means clustering algorithm
 */
function runKMeans(
  pixels: [number, number, number][],
  k: number,
  iterations = 6
): { r: number; g: number; b: number; count: number }[] {
  const centroids: [number, number, number][] = [];
  const step = Math.floor(pixels.length / k);

  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[Math.min(pixels.length - 1, i * step + Math.floor(step / 2))]]);
  }

  let assignments = new Int32Array(pixels.length);

  for (let iter = 0; iter < iterations; iter++) {
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Int32Array(k);

    // Assign pixels to closest centroid
    for (let i = 0; i < pixels.length; i++) {
      const [r, g, b] = pixels[i];
      let bestDist = Infinity;
      let bestIdx = 0;

      for (let c = 0; c < k; c++) {
        const [cr, cg, cb] = centroids[c];
        const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
        }
      }

      assignments[i] = bestIdx;
      sums[bestIdx][0] += r;
      sums[bestIdx][1] += g;
      sums[bestIdx][2] += b;
      counts[bestIdx]++;
    }

    // Update centroids
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [
          Math.round(sums[c][0] / counts[c]),
          Math.round(sums[c][1] / counts[c]),
          Math.round(sums[c][2] / counts[c]),
        ];
      }
    }
  }

  // Count cluster sizes
  const finalCounts = new Int32Array(k);
  for (let i = 0; i < assignments.length; i++) {
    finalCounts[assignments[i]]++;
  }

  return centroids
    .map((c, i) => ({
      r: c[0],
      g: c[1],
      b: c[2],
      count: finalCounts[i],
    }))
    .filter((c) => c.count > 0);
}
