/**
 * Deterministic Outfit Stylist Engine
 * Pure TypeScript Color-Theory & Fashion Scoring Algorithm
 * Strictly limited to garments in the user's Supabase wardrobe.
 */

import { WardrobeItemRecord, GeneratedOutfit, ColorSwatch, StyleVibe } from '@/types/database';

export type OutfitFilter =
  | 'any'
  | 'casual'
  | 'formal'
  | 'streetwear'
  | 'monochrome'
  | 'high_contrast';

interface ScoredCandidate {
  top: WardrobeItemRecord;
  bottom: WardrobeItemRecord;
  outerwear?: WardrobeItemRecord;
  footwear?: WardrobeItemRecord;
  accessory?: WardrobeItemRecord;
  score: number;
  reason: string;
  styleVibe: StyleVibe;
}

/**
 * Calculate the angular distance between two HSL hues (0 to 180 degrees)
 */
function getHueDifference(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Get primary HSL representation for a wardrobe item
 */
function getItemHsl(item: WardrobeItemRecord): [number, number, number] {
  if (item.color_palette && item.color_palette.length > 0) {
    return item.color_palette[0].hsl;
  }
  return [0, 0, 20]; // default dark neutral
}

/**
 * Evaluate color harmony between two wardrobe items
 */
function evaluateColorPairHarmony(
  itemA: WardrobeItemRecord,
  itemB: WardrobeItemRecord
): { score: number; descriptor: string } {
  const hslA = getItemHsl(itemA);
  const hslB = getItemHsl(itemB);

  const isNeutralA = itemA.is_neutral;
  const isNeutralB = itemB.is_neutral;

  // 1. Both Neutral (Minimalist, versatile)
  if (isNeutralA && isNeutralB) {
    const lightnessDiff = Math.abs(hslA[2] - hslB[2]);
    if (lightnessDiff > 40) {
      return { score: 95, descriptor: 'high-contrast monochrome monochrome' };
    }
    return { score: 90, descriptor: 'minimalist tonal neutral palette' };
  }

  // 2. Neutral Anchor + Accent Color (Classic styling rule)
  if (isNeutralA || isNeutralB) {
    return { score: 92, descriptor: 'solid neutral anchor with vibrant accent' };
  }

  // Both are chromatic (non-neutral) colors
  const hueDiff = getHueDifference(hslA[0], hslB[0]);
  const avgSat = (hslA[1] + hslB[1]) / 2;

  // 3. Monochromatic (Same hue family, different lightness/saturation)
  if (hueDiff <= 20) {
    return { score: 94, descriptor: 'harmonious monochromatic tone' };
  }

  // 4. Analogous (Adjacent on color wheel, 20° - 45°)
  if (hueDiff > 20 && hueDiff <= 45) {
    return { score: 88, descriptor: 'flowing analogous color harmony' };
  }

  // 5. Complementary (Opposite on color wheel, 160° - 200°)
  if (hueDiff >= 160 && hueDiff <= 200) {
    return { score: 91, descriptor: 'striking complementary color pairing' };
  }

  // 6. Triadic or earthy tones
  if (hueDiff >= 110 && hueDiff <= 130) {
    return { score: 82, descriptor: 'dynamic balanced triad' };
  }

  // 7. Clashing mid-saturation hues
  if (avgSat > 40 && hueDiff > 45 && hueDiff < 150) {
    return { score: 60, descriptor: 'contrasting experimental palette' };
  }

  return { score: 75, descriptor: 'contemporary eclectic color mix' };
}

/**
 * Generate and rank valid outfits from user's current wardrobe
 */
export function generateOutfitsFromWardrobe(
  wardrobe: WardrobeItemRecord[],
  filter: OutfitFilter = 'any',
  maxOutfits = 5
): GeneratedOutfit[] {
  // 1. Partition wardrobe items strictly by category
  const tops = wardrobe.filter((i) => i.category === 'shirt' || i.category === 'tshirt');
  const bottoms = wardrobe.filter((i) => i.category === 'bottom');
  const outerwears = wardrobe.filter((i) => i.category === 'outerwear');
  const footwears = wardrobe.filter((i) => i.category === 'footwear');
  const accessories = wardrobe.filter((i) => i.category === 'accessory');

  // Need at least 1 top and 1 bottom to build an outfit
  if (tops.length === 0 || bottoms.length === 0) {
    return [];
  }

  const candidates: ScoredCandidate[] = [];

  // 2. Generate combinations
  for (const top of tops) {
    for (const bottom of bottoms) {
      // Base Top + Bottom color harmony
      const topBottomHarmony = evaluateColorPairHarmony(top, bottom);
      let baseScore = topBottomHarmony.score;
      const reasons: string[] = [topBottomHarmony.descriptor];

      // Pattern balance rule:
      // Patterned + Solid = High reward
      // Patterned + Patterned = Heavy penalty
      if (top.pattern_type === 'patterned' && bottom.pattern_type === 'patterned') {
        baseScore -= 22;
        reasons.push('busy competing pattern clash');
      } else if (
        (top.pattern_type === 'patterned' && bottom.pattern_type === 'solid') ||
        (top.pattern_type === 'solid' && bottom.pattern_type === 'patterned')
      ) {
        baseScore += 6;
        reasons.push('balanced solid-over-pattern contrast');
      }

      // Style coherence
      let dominantStyle: StyleVibe = top.style_vibe || 'casual';
      if (top.style_vibe === bottom.style_vibe) {
        baseScore += 8;
        dominantStyle = top.style_vibe;
        reasons.push(`unified ${dominantStyle} profile`);
      } else if (
        (top.style_vibe === 'formal' && bottom.style_vibe === 'casual') ||
        (top.style_vibe === 'casual' && bottom.style_vibe === 'formal')
      ) {
        baseScore += 4;
        dominantStyle = 'casual';
        reasons.push('smart-casual crossover');
      }

      // Optional Outerwear pairing (Pick best fitting outerwear if available)
      let bestOuterwear: WardrobeItemRecord | undefined;
      if (outerwears.length > 0) {
        let bestOutScore = -Infinity;
        for (const out of outerwears) {
          const outTopHarmony = evaluateColorPairHarmony(out, top);
          const outBottomHarmony = evaluateColorPairHarmony(out, bottom);
          const outCombined = (outTopHarmony.score + outBottomHarmony.score) / 2;
          if (outCombined > bestOutScore) {
            bestOutScore = outCombined;
            bestOuterwear = out;
          }
        }
      }

      // Optional Footwear
      let bestFootwear: WardrobeItemRecord | undefined;
      if (footwears.length > 0) {
        let bestFootScore = -Infinity;
        for (const foot of footwears) {
          const footBottomHarmony = evaluateColorPairHarmony(foot, bottom);
          if (footBottomHarmony.score > bestFootScore) {
            bestFootScore = footBottomHarmony.score;
            bestFootwear = foot;
          }
        }
      }

      // Optional Accessory
      let bestAccessory: WardrobeItemRecord | undefined;
      if (accessories.length > 0 && Math.random() > 0.4) {
        bestAccessory = accessories[Math.floor(Math.random() * accessories.length)];
      }

      // Filter verification
      if (filter === 'casual' && dominantStyle !== 'casual') continue;
      if (filter === 'formal' && top.style_vibe !== 'formal' && bottom.style_vibe !== 'formal') continue;
      if (filter === 'streetwear' && dominantStyle !== 'streetwear' && top.style_vibe !== 'streetwear') continue;
      if (filter === 'monochrome' && (!top.is_neutral || !bottom.is_neutral)) {
        const hDiff = getHueDifference(getItemHsl(top)[0], getItemHsl(bottom)[0]);
        if (hDiff > 25) continue;
      }
      if (filter === 'high_contrast') {
        const lTop = getItemHsl(top)[2];
        const lBot = getItemHsl(bottom)[2];
        if (Math.abs(lTop - lBot) < 35) continue;
      }

      const finalScore = Math.min(99, Math.max(50, Math.round(baseScore)));
      const conciseReason = `${finalScore}% Match — ${reasons.slice(0, 2).join(' with ')}`;

      candidates.push({
        top,
        bottom,
        outerwear: bestOuterwear,
        footwear: bestFootwear,
        accessory: bestAccessory,
        score: finalScore,
        reason: conciseReason,
        styleVibe: dominantStyle,
      });
    }
  }

  // 3. Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  // 4. Return top unique outfits
  const uniqueOutfits: GeneratedOutfit[] = [];
  const seenPairSignatures = new Set<string>();

  for (const cand of candidates) {
    const sig = `${cand.top.id}_${cand.bottom.id}_${cand.outerwear?.id || 'none'}`;
    if (!seenPairSignatures.has(sig)) {
      seenPairSignatures.add(sig);

      const items: WardrobeItemRecord[] = [cand.top, cand.bottom];
      if (cand.outerwear) items.push(cand.outerwear);
      if (cand.footwear) items.push(cand.footwear);
      if (cand.accessory) items.push(cand.accessory);

      uniqueOutfits.push({
        id: `outfit_${uniqueOutfits.length + 1}_${Date.now()}`,
        name: `${cand.styleVibe.toUpperCase()} LOADOUT #${uniqueOutfits.length + 1}`,
        score: cand.score,
        reason: cand.reason,
        styleVibe: cand.styleVibe,
        items,
      });

      if (uniqueOutfits.length >= maxOutfits) {
        break;
      }
    }
  }

  return uniqueOutfits;
}
