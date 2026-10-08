# Technical Design Specification: Auth Screens Redesign (Login & Register)

- **Date:** 2026-10-08
- **Topic:** Auth Screens Redesign (`AuthPage` & `AuthModal`)
- **Status:** Approved
- **Reference Standard:** [`design.md`](file:///D:/Work/Personal/backnode-os/design.md) & [`AGENTS.md`](file:///D:/Work/Personal/backnode-os/AGENTS.md)

---

## 1. Executive Summary

This specification outlines the visual, structural, and behavioral update to Backnode OS authentication surfaces:
1. Full-page authentication route: [`AuthPage.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/pages/AuthPage.tsx)
2. Modal authentication overlay: [`AuthModal.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/components/AuthModal.tsx)
3. App loading / restore splash screen: [`App.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/App.tsx)

All legacy purple tokens (`#9900c2`, `#b731e0`, `#f4f2fd`, etc.) and non-compliant corner radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`) are removed in favor of the canonical **Obsidian Black & Electric Orange Design System** with uniform **6px border radii** (`rounded-[6px]`). All action buttons and tab headers are unified to the explicit labels **"Login"** and **"Register"**.

---

## 2. Core Design & UI Invariants

### 2.1 Color & Surface Hierarchy
* **Global Canvas:** Pure obsidian pitch black `#09090b` (`bg-[#09090b]`) with subtle radial dot grid and soft ambient orange gradient glow (`rgba(234, 88, 12, 0.05)`).
* **Card & Modal Surface:** Deep obsidian `#121214` (`bg-[#121214]`) with stone border `#27272a` (`border-[#27272a]`).
* **Form Inputs & Wells:** Elevated surface `#18181b` (`bg-[#18181b]`), stone border `#27272a`, placeholder `#71717a` (`text-zinc-500`), and orange focus state (`focus:border-orange-500 focus:ring-1 focus:ring-orange-500`).
* **Primary CTA Buttons:** Brand electric orange `#ea580c` (`bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-[6px] shadow-sm`).
* **Active Tab Highlights:** Brand orange border underline (`border-b-2 border-orange-500 text-orange-400 font-semibold bg-orange-950/20`).
* **Telemetry Badges:**
  * Online Status: Emerald pulse dot (`bg-emerald-500`) with emerald text/border (`text-emerald-400 border-emerald-500/30 bg-emerald-950/30 font-mono text-[10px]`).
  * Version Badge: `v1.0.0` mono badge (`text-zinc-400 border-[#27272a] bg-[#18181b]`).
  * Security Footer: Monospace security chip with emerald lock icon (`JWT-256 Auth • Multi-Tenant Isolation`).

### 2.2 Geometry & Typography Standards
* **Border Radii:** Uniform `rounded-[6px]` across the outer container card, text inputs, action buttons, tab segments, alert callouts, and badges. Circular `rounded-full` is restricted solely to the 6px telemetry indicator dot.
* **Typography Scale:**
  * Header Title: Plus Jakarta Sans (`font-headline text-lg font-bold text-zinc-100`).
  * Subtitle & Instructions: Geist (`font-body text-xs text-zinc-400`).
  * Input Labels & Telemetry: JetBrains Mono (`font-mono text-[11px] text-zinc-400 uppercase tracking-wider`).
  * Button Labels: Geist Semi-Bold (`font-body text-xs font-semibold text-white`).

---

## 3. Component Specifications

### 3.1 `AuthPage.tsx` (Full Page Route)
* **Canvas Backdrop:** `min-h-screen w-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden select-none`.
* **Atmospheric Mesh:** Replace violet blurs with subtle deep orange ambient glow (`bg-orange-600/5 rounded-full blur-3xl`) and crisp white radial dot grid with 3% opacity.
* **Auth Card Container:**
  * `w-full max-w-md bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10`.
* **Card Header:**
  * Backnode OS logo icon: 36x36px `rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20`.
  * Title: "Backnode OS", version badge: `v1.0.0` (`bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-400 font-mono text-[10px] px-1.5 py-0.5`).
  * Subtitle: "Engineering Operations & CRM Mesh".
  * Status Pill: `Online` with emerald pulse dot (`rounded-[6px] px-2 py-0.5 border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-[10px] font-mono`).
* **Navigation Tabs:**
  * Tab 1: **"Login"**
  * Tab 2: **"Register"**
  * Inactive state: `text-zinc-400 hover:text-zinc-200`.
  * Active state: `text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]`.
* **Login Form:**
  * Field 1: Operator Work Email (`input` with `bg-[#18181b] border-[#27272a] text-zinc-100 rounded-[6px] text-[13px] h-[34px] px-3 font-mono`).
  * Field 2: Password (`input type="password"` with identical styling).
  * Action Button: Full-width button with `h-[34px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-[6px] transition-all`.
    * Default text: **"Login"**
    * Submitting text: **"Logging in..."**
  * Bottom Helper Link: "Need an account? Register" (switches to Register tab).
* **Register Form:**
  * Field 1: Your Full Name
  * Field 2: Workspace / Account Name (with `font-mono text-zinc-500` caption)
  * Field 3: Work Email
  * Field 4: Password (min 8 characters)
  * Action Button: Full-width button matching the Login CTA styling.
    * Default text: **"Register"**
    * Submitting text: **"Registering..."**
  * Bottom Helper Link: "Already have an account? Login" (switches to Login tab).
* **Error Banner:**
  * `bg-red-950/50 border border-red-800/60 text-red-200 text-xs rounded-[6px] p-3 flex items-start gap-2`.
* **Card Footer:**
  * `bg-[#0c0a09] border-t border-[#27272a] px-6 py-2.5 flex items-center justify-between text-[11px] text-zinc-500 font-mono`.
  * Left: Emerald lock symbol with `JWT-256 Auth`.
  * Right: `Multi-Tenant Isolation`.

### 3.2 `AuthModal.tsx` (In-App Overlay)
* **Backdrop:** `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150`.
* **Modal Body:** `w-full max-w-md bg-[#121214] text-zinc-100 border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col`.
* **Close Button:** `w-7 h-7 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors`.
* **Tabs & Forms:** Mirrors the exact "Login" and "Register" tab names, inputs, and button copy (**"Login"** / **"Register"**) as `AuthPage.tsx`.
* **Mounting Point:** Mount `<AuthModal />` in `App.tsx` (or `DashboardLayout.tsx`) so that clicking "Switch Account / Log In" or "Sign In" from `TopNavBar` triggers the overlay correctly.

### 3.3 `App.tsx` Splash Screen Alignment
* Replace legacy violet gradients (`from-[#9900c2] to-[#ff007a]`, `rounded-2xl`) with:
  * Brand electric orange icon token (`bg-orange-600 text-white rounded-[6px] shadow-[0_0_25px_rgba(234,88,12,0.4)]`).
  * Obsidian canvas `#09090b`.
  * Clean mono progress label: "Restoring secure operator environment...".

---

## 4. Verification & Testing Criteria

1. **Visual Token Audit:**
   * Run a workspace grep to confirm ZERO references to `#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, or `#330043` remain in `AuthPage.tsx`, `AuthModal.tsx`, or `App.tsx`.
   * Confirm no banned radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`) are used in any containers, buttons, or inputs in these files.
2. **Text Label Verification:**
   * Verify buttons render strictly as **"Login"** (or "Logging in...") and **"Register"** (or "Registering...").
   * Verify tabs render strictly as **"Login"** and **"Register"**.
3. **Build & Type Check:**
   * Run `npm run build` or `npm run typecheck` across `packages/frontend` to verify clean compilation without TypeScript or bundling regressions.
4. **Behavioral Testing:**
   * Test form validation (missing email/password on login, missing fields or password < 8 characters on register).
   * Verify tab switching between Login and Register retains clean state and clears transient error messages.
