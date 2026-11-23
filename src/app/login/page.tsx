'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registerNewActiveSession } from '@/lib/supabase/session';
import {
  ShieldCheck,
  Crosshair,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/vault';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const reason = searchParams.get('reason');

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirectedFrom
            )}`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.session && data.user) {
          // Register single active session
          await registerNewActiveSession(data.user.id);
          router.push(redirectedFrom);
          router.refresh();
        } else {
          setSuccessMsg('Account created! Please check your email inbox to confirm your account.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.session && data.user) {
          // Register single active session: this invalidates any previous device!
          await registerNewActiveSession(data.user.id);
          router.push(redirectedFrom);
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (
        err.message?.includes('FetchError') ||
        err.message?.includes('Failed to fetch') ||
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      ) {
        setErrorMsg(
          'Supabase connection not yet configured or unreachable. Add your NEXT_PUBLIC_SUPABASE_URL & ANON_KEY to .env.local to persist cloud data!'
        );
      } else {
        setErrorMsg(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Brand */}
      <div className="z-10 mb-8 text-center flex flex-col items-center">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
          <Crosshair className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">
            Zero-API Web Vault
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 font-black text-xl">
            V
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-mono">
            VAULT<span className="text-amber-400">STYLE</span>
          </h1>
        </div>
        <p className="text-sm text-zinc-400 mt-2 max-w-sm">
          Interactive full-body fashion studio & deterministic outfit curation.
        </p>
      </div>

      {/* Auth Card */}
      <div className="z-10 w-full max-w-md bg-zinc-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/80">
        {/* Concurrent Device Logout Alert */}
        {reason === 'concurrent_session' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 animate-in fade-in">
            <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-mono uppercase tracking-wider text-amber-200">
                Single Active Session Rule
              </p>
              <p className="mt-1 text-zinc-300 leading-relaxed">
                You were automatically signed out because your account was logged into from another
                device or browser window.
              </p>
            </div>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="grid grid-cols-2 bg-black/40 p-1 rounded-xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="designer@vaultstyle.io"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-400/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-400/80 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Enter The Vault' : 'Create Vault Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature badges */}
        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <p className="text-[10px] text-zinc-500 font-mono">Session</p>
            <p className="text-xs font-semibold text-zinc-300 mt-0.5">Always On</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <p className="text-[10px] text-zinc-500 font-mono">Active Device</p>
            <p className="text-xs font-semibold text-zinc-300 mt-0.5">Single Active</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <p className="text-[10px] text-zinc-500 font-mono">Cloud Sync</p>
            <p className="text-xs font-semibold text-zinc-300 mt-0.5">Postgres RLS</p>
          </div>
        </div>
      </div>

      <div className="z-10 mt-6 text-center text-xs text-zinc-500">
        Protected with PostgreSQL Row-Level Security &amp; Encrypted Persistent Cookies.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B]" />}>
      <LoginForm />
    </Suspense>
  );
}
