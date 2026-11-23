'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { clearLocalSessionId } from '@/lib/supabase/session';
import { Logo } from './Logo';
import {
  LogOut,
  Settings,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  userEmail?: string | null;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
}

export function Navbar({
  userEmail,
  onOpenScanner,
  onOpenSettings,
}: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    clearLocalSessionId();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout error:', e);
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl z-40 sticky top-0 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="group">
          <Logo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Online</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onOpenScanner}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scan Garment</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Studio Settings & Avatar"
          className="p-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {userEmail && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
            <span className="text-xs font-mono text-zinc-400 truncate max-w-[150px]">
              {userEmail}
            </span>
          </div>
        )}

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border border-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

