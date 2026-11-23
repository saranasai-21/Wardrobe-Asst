/**
 * Client-Side Background Removal & Pixel-Exact Trimming
 * Uses @imgly/background-removal (100% free, runs in browser via WebAssembly)
 */

export interface SegmentationResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Remove background from an image file/blob and return transparent cropped PNG
 */
export async function removeBackgroundClient(
  imageSource: Blob | File | string,
  onProgress?: (progress: number) => void
): Promise<SegmentationResult> {
  try {
    // Runtime dynamic ESM import to bypass Next.js build-time Webpack onnxruntime bundler issues
    const loadModule = new Function('url', 'return import(url)');
    const imglyModule = await loadModule(
      'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm'
    );
    const removeBackground =
      imglyModule.removeBackground ||
      imglyModule.default?.removeBackground ||
      imglyModule.default;

    if (typeof removeBackground === 'function') {
      const segmentedBlob = await removeBackground(imageSource, {
        progress: (key: string, current: number, total: number) => {
          if (onProgress && total > 0) {
            onProgress(Math.round((current / total) * 100));
          }
        },
        output: {
          format: 'image/png',
          quality: 0.95,
        },
      });

      return await trimTransparentBorders(segmentedBlob, 1024);
    }
  } catch (err) {
    console.warn('WASM background removal error, falling back to direct canvas auto-trim:', err);
  }

  // Fallback: If network or WASM is blocked, return trimmed original image as transparent PNG
  let blob: Blob;
  if (imageSource instanceof Blob) {
    blob = imageSource;
  } else if (typeof imageSource === 'string') {
    const res = await fetch(imageSource);
    blob = await res.blob();
  } else {
    blob = new Blob([imageSource as any], { type: 'image/png' });
  }

  return await trimTransparentBorders(blob, 1024);
}

/**
 * Auto-trims transparent empty margins from a canvas/blob to keep fabric pixels centered
 * and resizes to maxDimension to conserve Supabase free tier storage while preserving texture.
 */
export async function trimTransparentBorders(
  sourceBlob: Blob,
  maxDimension = 1024
): Promise<SegmentationResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(sourceBlob);

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        resolve({
          blob: sourceBlob,
          dataUrl: URL.createObjectURL(sourceBlob),
          width: img.width,
          height: img.height,
        });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imgData;

      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let hasPixels = false;

      // Scan for non-transparent pixels (alpha > 15)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 15) {
            hasPixels = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!hasPixels) {
        // Fallback to original if completely transparent
        minX = 0;
        minY = 0;
        maxX = width;
        maxY = height;
      }

      // Add a small safety padding (12px)
      const padding = 12;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width, maxX + padding);
      maxY = Math.min(height, maxY + padding);

      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;

      // Calculate scaled dimensions to respect maxDimension
      let targetW = cropWidth;
      let targetH = cropHeight;
      if (targetW > maxDimension || targetH > maxDimension) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDimension) / targetW);
          targetW = maxDimension;
        } else {
          targetW = Math.round((targetW * maxDimension) / targetH);
          targetH = maxDimension;
        }
      }

      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = targetW;
      trimmedCanvas.height = targetH;
      const trimmedCtx = trimmedCanvas.getContext('2d');

      if (!trimmedCtx) {
        resolve({
          blob: sourceBlob,
          dataUrl: URL.createObjectURL(sourceBlob),
          width: img.width,
          height: img.height,
        });
        return;
      }

      // Draw cropped and scaled image
      trimmedCtx.drawImage(
        canvas,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetW,
        targetH
      );

      trimmedCanvas.toBlob(
        (finalBlob) => {
          if (!finalBlob) {
            resolve({
              blob: sourceBlob,
              dataUrl: URL.createObjectURL(sourceBlob),
              width: targetW,
              height: targetH,
            });
            return;
          }
          const finalUrl = URL.createObjectURL(finalBlob);
          resolve({
            blob: finalBlob,
            dataUrl: finalUrl,
            width: targetW,
            height: targetH,
          });
        },
        'image/png',
        0.95
      );
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = tempUrl;
  });
}
