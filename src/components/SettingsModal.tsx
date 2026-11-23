'use client';

import React from 'react';
import { AvatarRecord } from '@/types/database';
import {
  X,
  User,
  Settings,
  Camera,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar: AvatarRecord | null;
  userEmail: string | null;
  onOpenAvatarUpload: () => void;
  onUseMannequin: () => void;
  onClearEquipped: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  avatar,
  userEmail,
  onOpenAvatarUpload,
  onUseMannequin,
  onClearEquipped,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const isMannequin = avatar?.id === 'mannequin_default';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Studio Settings
              </h2>
              <p className="text-[11px] text-zinc-400">
                Avatar calibration &amp; studio preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* SECTION 1: Avatar Management */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Avatar Calibration</span>
            </h3>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
              {/* Avatar Thumbnail */}
              <div className="w-16 h-20 rounded-lg bg-zinc-800/80 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar.image_url}
                    alt="Active Avatar"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <User className="w-6 h-6 text-zinc-500" />
                )}
              </div>

              {/* Status Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-white truncate">
                    {isMannequin ? 'Studio Mannequin' : avatar ? 'Custom Full-Body Avatar' : 'No Avatar Selected'}
                  </span>
                  {avatar && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  {isMannequin
                    ? 'Default dark mannequin with 8 pre-mapped pose anchors.'
                    : avatar
                    ? 'Calibrated with client-side MediaPipe landmark detection.'
                    : 'Set up an avatar to auto-fit clothes onto your body.'}
                </p>
              </div>
            </div>

            {/* Avatar Change Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenAvatarUpload();
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Avatar Photo</span>
              </button>

              <button
                onClick={() => {
                  onUseMannequin();
                }}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Use Studio Mannequin</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: Studio Actions */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Studio Quick Actions</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onClearEquipped();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-red-500/15 text-zinc-300 hover:text-red-300 border border-white/5 font-mono text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Unequip All Stage Clothes</span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase">Clear Look</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Account Info */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account Information</span>
            </h3>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Signed In As:</span>
              <span className="text-zinc-200 font-semibold truncate max-w-[200px]">
                {userEmail || 'Active Studio User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
