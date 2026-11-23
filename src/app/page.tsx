import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Cpu,
  Layers,
  Palette,
  Crosshair,
  Sliders,
  Download,
  Smartphone,
  Eye,
  CheckCircle2,
  Lock,
  Workflow,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between z-20 border-b border-white/5 sticky top-0 bg-[#09090B]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 font-black text-lg shadow-lg shadow-amber-500/20">
            V
          </div>
          <span className="text-xl font-black font-mono tracking-wider text-white">
            VAULT<span className="text-amber-400">STYLE</span>
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/vault"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold font-mono tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <span>Enter Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center z-10 flex flex-col items-center">
        {/* Architecture Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-amber-400 font-mono mb-6 backdrop-blur-md">
          <Crosshair className="w-3.5 h-3.5" />
          <span>Zero-API Browser AI &bull; Strict Texture Lock &bull; Private Cloud Sync</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-mono leading-[1.1]">
          THE TACTICAL <br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            WARDROBE STUDIO
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Inspired by the Free Fire character customization Vault. Isolate real clothes with
          pixel-exact fidelity, auto-fit on your full-body avatar via MediaPipe pose anchors, and
          curate deterministic color-harmonic outfits with zero paid API keys.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/vault"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm tracking-wide font-mono transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group"
          >
            <span>Launch Interactive Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 text-sm font-semibold font-mono transition-all"
          >
            Account &amp; Cloud Sync
          </Link>
        </div>

        {/* Interactive Studio Mockup / Live Preview Visual */}
        <div className="mt-14 w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-950/80 p-3 sm:p-5 backdrop-blur-xl shadow-2xl shadow-black/90 text-left">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-500">
                vaultstyle.studio // split-screen viewport
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time 60FPS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-80 sm:h-96">
            {/* Left Preview: Avatar Studio */}
            <div className="md:col-span-5 bg-gradient-to-b from-[#141418] to-[#09090b] rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-between p-4">
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Pedestal Stage
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Pose Anchored</span>
              </div>

              {/* Pedestal Radial & Silhouette Illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
                <div className="absolute bottom-6 w-36 h-6 bg-white/10 rounded-full blur-[2px]" />
                <div className="relative text-center z-10">
                  <Crosshair className="w-16 h-16 text-amber-400/60 mx-auto animate-pulse" />
                  <p className="text-[11px] font-mono text-zinc-400 mt-2">
                    MediaPipe 8-Point Skeleton
                  </p>
                </div>
              </div>

              <div className="z-10 flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                <span>Layers: Top &bull; Bottom &bull; Shoes</span>
                <span className="text-emerald-400">Equipped</span>
              </div>
            </div>

            {/* Right Preview: Categorized Vault & Stylist AI */}
            <div className="md:col-span-7 bg-zinc-900/60 rounded-xl border border-white/10 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-mono font-bold text-xs">
                    Shirts
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 font-mono text-xs">
                    Bottoms
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 font-mono text-xs">
                    Outerwear
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs ml-auto">
                    Stylist AI
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="h-20 rounded-lg bg-black/40 border border-amber-500/60 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-amber-400">EQUIPPED</span>
                    <span className="text-[10px] font-mono text-zinc-300 truncate">
                      Oxford Navy Shirt
                    </span>
                  </div>
                  <div className="h-20 rounded-lg bg-black/40 border border-white/5 p-2 flex flex-col justify-between hover:border-white/20">
                    <span className="text-[9px] font-mono text-zinc-500">SOLID</span>
                    <span className="text-[10px] font-mono text-zinc-300 truncate">
                      Slim Chinos
                    </span>
                  </div>
                  <div className="h-20 rounded-lg bg-black/40 border border-white/5 p-2 flex flex-col justify-between hover:border-white/20">
                    <span className="text-[9px] font-mono text-zinc-500">GRAPHIC</span>
                    <span className="text-[10px] font-mono text-zinc-300 truncate">
                      Oversized Tee
                    </span>
                  </div>
                </div>
              </div>

              {/* Outfit Harmony Banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold text-white">94% HSL Harmony Match</p>
                  <p className="text-[10px] font-mono text-zinc-400">
                    Crisp neutral anchor with complementary earth tones
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold font-mono text-xs">
                  Equip
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED INNER FEATURE ARCHITECTURE BREAKDOWN */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 z-10 w-full">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest font-mono text-amber-400 mb-2 font-bold">
            Zero Smoke &bull; Zero Hallucination
          </p>
          <h2 className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
            DEEP FEATURE ARCHITECTURE
          </h2>
          <p className="text-sm text-zinc-400 mt-3 max-w-xl mx-auto">
            Explore the exact client-side neural vision pipelines, mathematical color harmony algorithms,
            and single-device cloud security powering VaultStyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: The Interactive Avatar Studio */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
              <Crosshair className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              1. Free Fire Customization Studio
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              A full-body studio viewport with pedestal floor reflection. Clothes are layered in strict
              z-index order: <code>Avatar Base (10)</code> &rarr; <code>Bottoms (20)</code> &rarr;{' '}
              <code>T-Shirt / Shirt (30)</code> &rarr; <code>Outerwear (40)</code> &rarr;{' '}
              <code>Footwear (50)</code> &rarr; <code>Accessories (60)</code>.
            </p>
            <ul className="space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>MediaPipe 8-point landmark detection (shoulders, hips, ankles).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Interactive calibration toolbar: Scale, Stretch, X/Y Offset &amp; Rotation.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>1-Click Look Exporter: Composites canvas snapshot to 1200x1600 PNG.</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Zero-Distortion Fabric Scanner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              2. Strict Texture &amp; Color Lock Scanner
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Real garment textures, fabrics, prints, logos, and weaves remain 100% pixel-exact.
              Never redrawn, stylised, or hallucinated by generative models.
            </p>
            <ul className="space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Client-Side WASM background removal with auto-trimmed transparent borders.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Canvas K-Means clustering (K=4) for primary &amp; secondary hex/HSL swatches.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Web Worker Zero-Shot CLIP classification running at 60fps in the background.</span>
              </li>
            </ul>
          </div>

          {/* Feature 3: Deterministic Outfit Stylist */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              3. Deterministic HSL Outfit Engine
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Strict ownership guarantee: The engine ONLY pairs clothes stored in your authenticated
              Supabase wardrobe. Mathematical scoring from 0 to 100 based on color-theory principles.
            </p>
            <ul className="space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Color harmony: Neutral anchors, Monochromatic, Analogous &amp; Complementary.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Pattern balance: Solid + Patterned rewards; heavily penalizes pattern clashes.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Human-readable style reasons &amp; 1-click &quot;Equip Outfit&quot; / &quot;Save Loadout&quot;.</span>
              </li>
            </ul>
          </div>

          {/* Feature 4: Cloud Sync & Single Active Device Security */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              4. Private Cloud Sync &amp; Multi-Device Protection
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Encrypted cloud synchronization isolating your private wardrobe.
              Stay logged in seamlessly with automatic protection against unauthorized simultaneous logins.
            </p>
            <ul className="space-y-2 text-xs font-mono text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>Persistent authentication keeps your session ready across browser restarts.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>Device protection: Logging in on another device securely protects your account.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>End-to-end user isolation ensures complete privacy for your clothing collection.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* STEP-BY-STEP WORKFLOW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 z-10 w-full border-t border-white/5">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest font-mono text-amber-400 font-bold">
            Execution Flow
          </p>
          <h2 className="text-2xl sm:text-4xl font-black font-mono text-white mt-1">
            HOW VAULTSTYLE WORKS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-bold font-mono text-xs flex items-center justify-center mb-3">
              1
            </span>
            <h4 className="text-xs font-bold font-mono text-white uppercase mb-1">Calibrate Avatar</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Upload full-body photo or use the built-in mannequin silhouette. MediaPipe detects shoulder, hip, and ankle anchors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-bold font-mono text-xs flex items-center justify-center mb-3">
              2
            </span>
            <h4 className="text-xs font-bold font-mono text-white uppercase mb-1">Scan Real Clothes</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Take photos of your clothing. Background is stripped via WASM; colors, pattern density, and CLIP categories are tagged.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-bold font-mono text-xs flex items-center justify-center mb-3">
              3
            </span>
            <h4 className="text-xs font-bold font-mono text-white uppercase mb-1">Equip &amp; Fine-Tune</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click any item to dress the avatar instantly. Fine-tune scale and offset coordinates, synced directly to Supabase.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 font-bold font-mono text-xs flex items-center justify-center mb-3">
              4
            </span>
            <h4 className="text-xs font-bold font-mono text-white uppercase mb-1">Curate &amp; Export</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Generate color-harmonic outfits with deterministic scoring. Equip in 1 click and download a high-res look snapshot.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono z-10">
        <div>VaultStyle &copy; 2026 &bull; Production Personal Fashion Architecture</div>
        <div className="mt-3 sm:mt-0 flex items-center gap-4">
          <Link href="/vault" className="text-zinc-400 hover:text-white transition-colors">
            Vault Studio
          </Link>
          <span>&bull;</span>
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <span>&bull;</span>
          <span>100% Free Client AI</span>
        </div>
      </footer>
    </main>
  );
}
