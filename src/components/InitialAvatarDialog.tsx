'use client';

import React from 'react';
import { Camera, Layers, ArrowRight, UserCheck } from 'lucide-react';
import { LogoIcon } from './Logo';

interface InitialAvatarDialogProps {
  isOpen: boolean;
  onOpenUpload: () => void;
  onSelectMannequin: () => void;
}

export function InitialAvatarDialog({
  isOpen,
  onOpenUpload,
  onSelectMannequin,
}: InitialAvatarDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-100 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-4">
          <LogoIcon className="w-9 h-9" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white uppercase">
          Welcome to <span className="text-amber-400">WardrobeLab</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
          To auto-fit and preview real clothes on your body proportions, select your studio avatar setup:
        </p>

        {/* Two Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
          {/* Option A: Upload Photo */}
          <button
            onClick={onOpenUpload}
            className="group p-5 rounded-2xl bg-zinc-950/70 border border-white/10 hover:border-amber-400/60 hover:bg-zinc-950 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white group-hover:text-amber-400 transition-colors">
                Upload Full-Body Photo
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Client-side MediaPipe mapping detects shoulders, hips, and ankles for custom tailored fitting.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
              <span>Upload Photo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Option B: Studio Mannequin */}
          <button
            onClick={onSelectMannequin}
            className="group p-5 rounded-2xl bg-zinc-950/70 border border-white/10 hover:border-blue-400/60 hover:bg-zinc-950 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white group-hover:text-blue-300 transition-colors">
                Use Studio Mannequin
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Jump straight in with our calibrated dark silhouette. You can switch to a photo anytime in Settings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1 text-[11px] font-mono text-blue-400 font-bold">
              <span>Start Instantly</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        <p className="mt-5 text-[11px] font-mono text-zinc-500">
          Tip: You can re-calibrate or change your avatar anytime from <span className="text-zinc-300">Settings</span>.
        </p>
      </div>
    </div>
  );
}
