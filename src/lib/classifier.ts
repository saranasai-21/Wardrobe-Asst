/**
 * Client-Side Zero-Shot Classifier Interface
 * Communicates with classifier.worker.ts
 */

import { GarmentCategory, StyleVibe } from '@/types/database';

export interface ClassificationOutput {
  category: GarmentCategory;
  confidence: number;
  styleVibe: StyleVibe;
  allCategories: { category: string; score: number }[];
  fallback?: boolean;
}

let workerInstance: Worker | null = null;
const pendingCallbacks = new Map<
  string,
  {
    resolve: (val: ClassificationOutput) => void;
    reject: (err: any) => void;
    onProgress?: (pct: number, file?: string) => void;
  }
>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;

  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/classifier.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (event: MessageEvent) => {
        const { type, id, progress, file, category, confidence, styleVibe, allCategories, fallback, error } =
          event.data;

        const callbacks = pendingCallbacks.get(id);

        if (type === 'progress') {
          callbacks?.onProgress?.(progress, file);
        } else if (type === 'classification_result') {
          callbacks?.resolve({
            category,
            confidence,
            styleVibe,
            allCategories: allCategories || [],
            fallback,
          });
          pendingCallbacks.delete(id);
        } else if (type === 'error') {
          console.warn('Worker reported error:', error);
          // Graceful fallback response
          callbacks?.resolve({
            category: 'tshirt',
            confidence: 0.7,
            styleVibe: 'casual',
            allCategories: [],
            fallback: true,
          });
          pendingCallbacks.delete(id);
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('Classifier worker error:', err);
      };
    } catch (e) {
      console.warn('Could not spawn Web Worker:', e);
      return null;
    }
  }

  return workerInstance;
}

/**
 * Classify a garment image using client-side zero-shot CLIP inside a Web Worker
 */
export async function classifyGarment(
  imageUrl: string,
  onProgress?: (progressPercent: number, file?: string) => void
): Promise<ClassificationOutput> {
  const worker = getWorker();
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!worker) {
    // Immediate fallback if workers aren't supported
    return {
      category: 'tshirt',
      confidence: 0.75,
      styleVibe: 'casual',
      allCategories: [],
      fallback: true,
    };
  }

  return new Promise((resolve, reject) => {
    pendingCallbacks.set(id, { resolve, reject, onProgress });
    worker.postMessage({
      type: 'classify',
      id,
      imageUrl,
    });
  });
}
