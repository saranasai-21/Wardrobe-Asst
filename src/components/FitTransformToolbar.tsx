'use client';

import React from 'react';
import { FitTransform, WardrobeItemRecord } from '@/types/database';
import { Sliders, RotateCcw, Save, X, Move, Maximize2, Compass } from 'lucide-react';

interface FitTransformToolbarProps {
  item: WardrobeItemRecord;
  transform: FitTransform;
  onChange: (newTransform: FitTransform) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
  saving?: boolean;
}

export function FitTransformToolbar({
  item,
  transform,
  onChange,
  onSave,
  onReset,
  onClose,
  saving = false,
}: FitTransformToolbarProps) {
  const updateProp = (prop: keyof FitTransform, val: number) => {
    onChange({
      ...transform,
      [prop]: val,
    });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md bg-zinc-900/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl shadow-black/80 text-xs">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono font-bold text-white uppercase tracking-wider truncate max-w-[180px]">
            Calibrate {item.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            title="Reset to default fit"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            title="Close fine-tune"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Scale Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-zinc-500" /> Scale Size
            </span>
            <span className="font-mono text-amber-400">{Math.round(transform.scale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.02}
            value={transform.scale}
            onChange={(e) => updateProp('scale', parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-amber-500"
          />
        </div>

        {/* Stretch Width Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-zinc-500 rotate-90" /> Width Ratio
            </span>
            <span className="font-mono text-zinc-300">{Math.round(transform.scaleX * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.02}
            value={transform.scaleX}
            onChange={(e) => updateProp('scaleX', parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-amber-500"
          />
        </div>

        {/* X / Y Position Offsets */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-zinc-500" /> Offset X
              </span>
              <span className="font-mono text-zinc-300">{transform.x}px</span>
            </div>
            <input
              type="range"
              min={-120}
              max={120}
              step={1}
              value={transform.x}
              onChange={(e) => updateProp('x', parseInt(e.target.value))}
              className="w-full cursor-pointer accent-amber-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-zinc-500 rotate-90" /> Offset Y
              </span>
              <span className="font-mono text-zinc-300">{transform.y}px</span>
            </div>
            <input
              type="range"
              min={-140}
              max={140}
              step={1}
              value={transform.y}
              onChange={(e) => updateProp('y', parseInt(e.target.value))}
              className="w-full cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-zinc-500" /> Rotation
            </span>
            <span className="font-mono text-zinc-300">{transform.rotation}&deg;</span>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={1}
            value={transform.rotation}
            onChange={(e) => updateProp('rotation', parseInt(e.target.value))}
            className="w-full cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full mt-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saving ? 'Saving...' : 'Sync Cloud Fit'}</span>
      </button>
    </div>
  );
}
