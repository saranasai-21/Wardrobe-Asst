'use client';

import React, { useState } from 'react';
import { User, Sparkles, Shirt, X, ArrowRight } from 'lucide-react';

interface OnboardingGuideProps {
  hasAvatar: boolean;
  garmentCount: number;
  onOpenAvatarUpload: () => void;
  onOpenScanner: () => void;
}

export function OnboardingGuide({
  hasAvatar,
  garmentCount,
  onOpenAvatarUpload,
  onOpenScanner,
}: OnboardingGuideProps) {
  const [dismissed, setDismissed] = useState(false);

  // If user has calibrated avatar and at least 2 garments, they know what they are doing
  if (dismissed || (hasAvatar && garmentCount >= 3)) return null;

  return (
    <div className="w-full bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl relative overflow-hidden mb-4">
      <div className="absolute top-0 left-1/4 w-96 h-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Vault Quickstart Protocol</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold font-mono text-white">
            Get Ready In 3 Simple Steps
          </h3>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-zinc-500 hover:text-zinc-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* Step 1 */}
        <div
          onClick={onOpenAvatarUpload}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            hasAvatar
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/10 hover:border-amber-400/50 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                hasAvatar ? 'bg-emerald-500 text-zinc-950' : 'bg-white/10 text-white'
              }`}
            >
              1
            </span>
            <span className="text-xs font-bold font-mono text-white">Upload Avatar</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            {hasAvatar
              ? 'Full-body pose landmarks mapped.'
              : 'Add photo to calibrate shoulder, hip & ankle anchors.'}
          </p>
        </div>

        {/* Step 2 */}
        <div
          onClick={onOpenScanner}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            garmentCount > 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/10 hover:border-amber-400/50 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                garmentCount > 0 ? 'bg-emerald-500 text-zinc-950' : 'bg-white/10 text-white'
              }`}
            >
              2
            </span>
            <span className="text-xs font-bold font-mono text-white">Scan Clothes</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            {garmentCount > 0
              ? `${garmentCount} items stored in Supabase Vault.`
              : 'Run zero-distortion background removal & CLIP tagging.'}
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-3 rounded-xl border bg-white/[0.02] border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center bg-white/10 text-white">
              3
            </span>
            <span className="text-xs font-bold font-mono text-white">Equip &amp; Style</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Click any garment to equip with zero latency, or run the Stylist AI for outfits.
          </p>
        </div>
      </div>
    </div>
  );
}
