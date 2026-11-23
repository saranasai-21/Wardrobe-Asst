/**
 * Web Worker for Zero-Shot Garment & Style Classification
 * Dynamically loads @huggingface/transformers in the browser background thread at runtime.
 * Model: Xenova/clip-vit-base-patch32 (quantized ONNX, cached in browser CacheStorage)
 */

let classifierPipeline: any = null;

const CATEGORY_CANDIDATES = [
  'a button-down collared shirt',
  'a casual t-shirt or polo tee',
  'a jacket, hoodie, blazer, or coat',
  'jeans, trousers, chinos, or shorts',
  'sneakers, boots, loafers, or shoes',
  'a watch, cap, sunglasses, belt, or bag',
];

const CATEGORY_MAP: Record<string, 'shirt' | 'tshirt' | 'outerwear' | 'bottom' | 'footwear' | 'accessory'> = {
  'a button-down collared shirt': 'shirt',
  'a casual t-shirt or polo tee': 'tshirt',
  'a jacket, hoodie, blazer, or coat': 'outerwear',
  'jeans, trousers, chinos, or shorts': 'bottom',
  'sneakers, boots, loafers, or shoes': 'footwear',
  'a watch, cap, sunglasses, belt, or bag': 'accessory',
};

const STYLE_CANDIDATES = [
  'casual everyday relaxed clothing',
  'formal business professional office attire',
  'urban streetwear hypebeast modern clothing',
  'sportswear gym athletic workout clothes',
];

const STYLE_MAP: Record<string, 'casual' | 'formal' | 'streetwear' | 'athletic'> = {
  'casual everyday relaxed clothing': 'casual',
  'formal business professional office attire': 'formal',
  'urban streetwear hypebeast modern clothing': 'streetwear',
  'sportswear gym athletic workout clothes': 'athletic',
};

async function getClassifier(onProgress?: (progressData: any) => void) {
  if (classifierPipeline) return classifierPipeline;

  // Runtime dynamic import bypassing webpack AST crawler
  const cdnUrl = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';
  const loadModule = new Function('url', 'return import(url)');
  const { pipeline, env } = await loadModule(cdnUrl);

  if (env) {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
  }

  classifierPipeline = await pipeline(
    'zero-shot-image-classification',
    'Xenova/clip-vit-base-patch32',
    {
      progress_callback: onProgress,
    }
  );

  return classifierPipeline;
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, id, imageUrl } = event.data;

  if (type === 'init') {
    try {
      await getClassifier((progress: any) => {
        if (progress.status === 'progress') {
          self.postMessage({
            type: 'progress',
            id,
            progress: Math.round(progress.progress || 0),
            file: progress.file,
          });
        }
      });
      self.postMessage({ type: 'ready', id });
    } catch (err: any) {
      console.warn('Worker init warning:', err);
      self.postMessage({ type: 'error', id, error: err.message });
    }
    return;
  }

  if (type === 'classify') {
    try {
      const classifier = await getClassifier((progress: any) => {
        if (progress.status === 'progress') {
          self.postMessage({
            type: 'progress',
            id,
            progress: Math.round(progress.progress || 0),
            file: progress.file,
          });
        }
      });

      // 1. Primary Category Classification
      const catResults = await classifier(imageUrl, CATEGORY_CANDIDATES);
      const topCategoryResult = catResults[0];
      const detectedCategory = CATEGORY_MAP[topCategoryResult.label] || 'tshirt';
      const categoryScore = topCategoryResult.score;

      // 2. Secondary Style Classification
      const styleResults = await classifier(imageUrl, STYLE_CANDIDATES);
      const topStyleResult = styleResults[0];
      const detectedStyle = STYLE_MAP[topStyleResult.label] || 'casual';

      self.postMessage({
        type: 'classification_result',
        id,
        category: detectedCategory,
        confidence: categoryScore,
        styleVibe: detectedStyle,
        allCategories: catResults.map((r: any) => ({
          category: CATEGORY_MAP[r.label] || 'other',
          score: r.score,
        })),
      });
    } catch (err: any) {
      console.warn('Zero-shot worker fallback:', err);
      // Fallback classification if model download fails or times out
      self.postMessage({
        type: 'classification_result',
        id,
        category: 'tshirt',
        confidence: 0.8,
        styleVibe: 'casual',
        allCategories: [],
        fallback: true,
      });
    }
  }
});
