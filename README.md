# WardrobeLab: Production-Grade Personal Fashion Designer Web App

A high-craft, dark-mode web application inspired by the **Free Fire character customization Vault** paradigm. Features a full-body interactive avatar studio, zero-distortion client-side garment scanner, real-time pose anchor calibration, and a deterministic color-theory outfit curation engine.

---

## 1. Zero-Cost & Privacy-First Architecture

- **$0 AI API Costs (Zero External AI Keys):** All computer vision, background isolation, body pose calibration, garment classification, and color extraction run **100% inside the user's web browser** via WebAssembly (WASM), WebGPU, HTML5 Canvas, and Web Workers.
- **No Local Storage Persisting User Data:** Uses **Supabase (Free Tier)** for Email/Password Authentication, PostgreSQL Database with strict Row-Level Security (RLS), and Storage Buckets for avatar silhouettes and transparent garment cutouts.
- **Strict Texture & Color Lock:** Garment pixels are never redrawn, stylized, or hallucinated by generative models. Original fabric textures, weave, prints, logos, and exact colors remain 100% untouched.
- **Single Active Device Enforcement:** Logging in on a new device immediately terminates prior sessions across devices using Supabase Realtime WebSockets and cross-tab BroadcastChannels.
- **Persistent Always-Logged-In Sessions:** 1-year persistent cookie authentication keeps the user logged into their vault without unexpected session expirations.

---

## 2. Core Modules & Features Walkthrough

### Module 1: Auth & Full-Body Avatar Studio
- **Supabase SSR Auth:** Secure cookie-based authentication with Next.js App Router middleware protecting `/vault`.
- **Client-Side Background Removal:** In-browser WASM isolates the user's full-body silhouette for the dark obsidian studio pedestal.
- **MediaPipe Pose Landmarker:** Maps 8 normalized body landmarks (`left_shoulder`, `right_shoulder`, `left_hip`, `right_hip`, `left_knee`, `right_knee`, `left_ankle`, `right_ankle`) with proportional fallback anchors.
- **Studio Mannequin Mode:** Instant dark silhouette fallback mannequin with pre-calibrated pose anchors, allowing users to start styling immediately before uploading a personal photo.

### Module 2: Zero-Distortion Garment Scanner
- **Step 1 — Pixel-Exact Cutout:** In-browser WASM background removal isolates the garment and auto-trims transparent empty margins to keep fabric textures crisp while minimizing storage.
- **Step 2 — Exact Color & Pattern Extraction (Canvas):** Offscreen HTML5 Canvas samples non-transparent pixels using K-Means clustering (K=4) to extract primary and secondary hex/HSL colors, classifies neutral vs. chromatic tones, and computes Laplacian edge variance to tag `Solid` vs. `Patterned`.
- **Step 3 — Zero-Shot Web Worker Classifier:** Quantized CLIP model (`Xenova/clip-vit-base-patch32`) runs inside a dedicated Web Worker to classify garments (`shirt`, `tshirt`, `outerwear`, `bottom`, `footwear`, `accessory`) and style vibe (`casual`, `formal`, `streetwear`, `athletic`) at 60fps without blocking the UI thread.

### Module 3: Instant Avatar Fitting Stage
- **Layered Rendering Pipeline:** Strict z-index stack: `Avatar Base (10)` &rarr; `Bottoms (20)` &rarr; `T-Shirt / Shirt (30)` &rarr; `Outerwear (40)` &rarr; `Footwear (50)` &rarr; `Accessories (60)`.
- **Auto-Fit via Pose Anchors:** Clicking any item in the Vault instantly scales and positions it on the avatar using shoulder-to-hip or hip-to-ankle proportions.
- **Viewport Zoom Controls:** Smooth zoom-in, zoom-out, and 100% reset controls on the studio stage for inspecting fine garment details and accessory placement.
- **Fine-Tuning Controls (Synced to Cloud):** Collapsible controls for `Scale`, `Width/Stretch`, `Offset X/Y`, and `Rotation`. Custom `fit_transform` coordinates persist directly to the Supabase database.
- **Snapshot Export:** "Export Look" composites the avatar and layered clothes onto an HTML5 Canvas and downloads a crisp high-res PNG with studio spotlight and pedestal reflection.

### Module 4: Categorized Wardrobe Vault & Live Search
- **Free Fire Vault Navigation:** Quick category tabs for Shirts, T-Shirts, Outerwear, Bottoms, Footwear, Accessories, Saved Outfits, and Stylist AI.
- **Instant Search & Filter:** Real-time search bar that filters garments by name, pattern, or style vibe.
- **Equip / Unequip Toggle:** One-click equipping with active visual glow badges and badge counters per category.

### Module 5: Strict-Wardrobe Deterministic Outfit Generator
- **Strict Ownership Guarantee:** Only generates outfits using items fetched from the authenticated user's Supabase `wardrobe_items` table. Never invents clothes the user doesn't own.
- **HSL Harmony & Fashion Scoring Algorithm (Pure TypeScript):**
  - **Color Harmony:** Rewards Neutral Anchors, Monochromatic (within 20&deg;), Analogous (20&deg;–45&deg;), Complementary (160&deg;–200&deg;), and Earth-tone palettes; penalizes clashing mid-saturation hues.
  - **Pattern Balance:** Rewards `Solid + Patterned`; heavily penalizes clashing two heavily patterned items.
  - **Style Coherence:** Rewards unified vibes (`Formal` shirt + `Formal` trousers) or curated smart-casual crossovers.
- **Top 5 Outfits:** Displays match percentage, style reason, real clothing thumbnails, instant "Equip Outfit" button, and "Save Loadout" button to store in Supabase `outfits` table.

---

## 3. Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript, React 18)
- **Styling:** Tailwind CSS, Hairline Obsidian Theme (`#09090B`), Custom Radial Spotlights
- **Icons & Polish:** Lucide React, Canvas Confetti
- **Cloud Backend:** Supabase Free Tier (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL RLS, Storage Buckets)
- **Client Vision:** `@imgly/background-removal`, `@mediapipe/tasks-vision`, `@huggingface/transformers` (Transformers.js) in Web Worker

---

## 4. Setup & Deployment Guide

### Step 1: Set Up Supabase Project (100% Free)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Open `supabase/schema.sql` from this repository, paste the entire SQL script, and click **Run**.
   - Creates the `avatars`, `wardrobe_items`, `outfits`, and `user_sessions` tables.
   - Configures strict Row-Level Security (RLS) so each user can only read/write/delete their own clothes and avatars.
   - Creates the `avatars` and `garments` storage buckets with per-user folder isolation (`{user_id}/{file_id}.png`).
   - Enables Realtime publication on `user_sessions` for instant multi-device logout coordination.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials from your Supabase Dashboard (**Settings > API**):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
```

### Step 3: Run Locally
```bash
# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Deploy to Vercel (1-Click)
1. Push this project to your GitHub repository.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New > Project** and import the repository.
3. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and host your production app with zero configuration required.

---

## 5. Security & Privacy Highlights

- **Zero API Keys in Repository:** No proprietary API keys or secrets are stored in the codebase.
- **Strict Client-Side Processing:** All photos, garments, and vision algorithms are processed locally in the user's browser before being uploaded to Supabase storage.
- **Isolated User Storage:** Storage buckets enforce user folder prefixes (`{user_id}/*`), preventing users from accessing or modifying another user's wardrobe files.
- **Concurrent Session Guard:** Users can only have one active session at a time, protecting personal wardrobe data from unauthorized simultaneous access.
