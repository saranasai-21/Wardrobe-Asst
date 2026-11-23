'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Custom Vector Mark for WardrobeLab:
 * Geometric luxury coat-hanger silhouette integrated with precision styling crosshair diamond.
 */
export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="wlGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="wlDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#09090B" />
        </linearGradient>
      </defs>

      {/* Rounded Hexagonal / Shield Base Container */}
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="10"
        fill="url(#wlDarkGrad)"
        stroke="url(#wlGoldGrad)"
        strokeWidth="1.5"
      />

      {/* Stylized Luxury Hanger Loop / Neck Hook */}
      <path
        d="M20 9C21.6569 9 23 10.3431 23 12C23 13.3 22.15 14.4 20.9 14.8L20 15.1V18"
        stroke="url(#wlGoldGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Modern Shoulders / Hanger Wings */}
      <path
        d="M8 25L20 18L32 25"
        stroke="url(#wlGoldGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Base Bar */}
      <path
        d="M10 27.5H30"
        stroke="url(#wlGoldGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Center Precision Diamond Core */}
      <path
        d="M20 20.5L22.5 24L20 27.5L17.5 24L20 20.5Z"
        fill="url(#wlGoldGrad)"
      />

      {/* Subtle Corner Dots */}
      <circle cx="9" cy="9" r="1" fill="#F59E0B" fillOpacity="0.4" />
      <circle cx="31" cy="9" r="1" fill="#F59E0B" fillOpacity="0.4" />
      <circle cx="9" cy="31" r="1" fill="#F59E0B" fillOpacity="0.4" />
      <circle cx="31" cy="31" r="1" fill="#F59E0B" fillOpacity="0.4" />
    </svg>
  );
}

export function Logo({ className = '', iconOnly = false, size = 'md' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <LogoIcon className={iconSizes[size]} />
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={`font-mono font-black tracking-wider text-white ${textSizes[size]}`}>
            WARDROBE<span className="text-amber-400">LAB</span>
          </span>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">
            STUDIO
          </span>
        </div>
      )}
    </div>
  );
}
