'use client';

import React, { useState, useRef } from 'react';
import { BodyLandmarks } from '@/types/database';
import { removeBackgroundClient } from '@/lib/segment';
import { detectPoseLandmarks, getFallbackLandmarks } from '@/lib/pose';
import {
  Upload,
  Camera,
  X,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  Crosshair,
} from 'lucide-react';

interface AvatarUploadModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (
    fileBlob: Blob,
    landmarks: BodyLandmarks,
    width: number,
    height: number
  ) => Promise<void>;
}

export function AvatarUploadModal({
  userId,
  isOpen,
  onClose,
  onSaveAvatar,
}: AvatarUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [detectedLandmarks, setDetectedLandmarks] = useState<BodyLandmarks | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setDetectedLandmarks(null);
      setErrorMsg(null);
    }
  };

  const handleProcessAndSave = async () => {
    if (!file && !previewUrl) return;

    setProcessing(true);
    setErrorMsg(null);
    setProgressPct(10);

    try {
      let finalBlob: Blob = file!;
      let processedUrl = previewUrl!;

      // 1. Client-Side Background Removal (Optional toggle)
      if (removeBg) {
        setProcessingStep('Isolating full-body avatar (WASM AI)...');
        const segResult = await removeBackgroundClient(file!, (pct) => {
          setProgressPct(Math.round(pct * 0.7)); // 0-70%
        });
        finalBlob = segResult.blob;
        processedUrl = segResult.dataUrl;
      }

      // 2. Client-Side MediaPipe Pose Landmark Detection
      setProcessingStep('Calibrating body landmarks & pose anchors...');
      setProgressPct(75);

      const img = new Image();
      img.src = processedUrl;
      await new Promise((res, rej) => {
        img.onload = () => res(true);
        img.onerror = rej;
      });

      const landmarks = await detectPoseLandmarks(img);
      setDetectedLandmarks(landmarks);
      setProgressPct(90);

      // 3. Upload & Save to Supabase
      setProcessingStep('Uploading avatar & pose anchors to Supabase...');
      await onSaveAvatar(
        finalBlob,
        landmarks,
        img.naturalWidth || 1024,
        img.naturalHeight || 1024
      );

      setProgressPct(100);
      onClose();
    } catch (err: any) {
      console.error('Avatar processing error:', err);
      setErrorMsg(err.message || 'Failed to process avatar. Please try again.');
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/90 text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Avatar Studio Calibration
              </h2>
              <p className="text-[11px] text-zinc-400">
                100% Client-side pose anchor mapping & background isolation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload or Drop Area */}
        <div className="mt-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.03]"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-white">
                Click to upload full-body photo or snapshot
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                PNG, JPG, or WEBP. Stand straight facing forward for optimal pose landmarks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full h-64 bg-zinc-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="max-h-full max-w-full object-contain"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-xs font-mono text-zinc-300 flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Choose Another</span>
                </button>
              </div>

              {/* Options */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Remove Photo Background</p>
                  <p className="text-[11px] text-zinc-400">
                    Isolate full-body silhouette for the dark studio stage
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeBg}
                    onChange={(e) => setRemoveBg(e.target.checked)}
                    disabled={processing}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Processing Progress Bar */}
        {processing && (
          <div className="mt-5 space-y-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-amber-300 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {processingStep}
              </span>
              <span className="text-amber-400 font-bold">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessAndSave}
            disabled={!previewUrl || processing}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono tracking-wider transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Calibrating...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Calibrate & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
