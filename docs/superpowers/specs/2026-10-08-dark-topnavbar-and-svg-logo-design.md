# Technical Design Specification: Dark Theme TopNavBar & SVG Logo

- **Date:** 2026-10-08
- **Topic:** Top Navigation Bar Dark Theme & Geometric Hex SVG Logo
- **Status:** Approved
- **Reference Standard:** [`design.md`](file:///D:/Work/Personal/backnode-os/design.md) & [`AGENTS.md`](file:///D:/Work/Personal/backnode-os/AGENTS.md)

---

## 1. Executive Summary

This specification defines:
1. Creation of a dedicated vector **SVG Logo** component: [`BacknodeLogo.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/components/BacknodeLogo.tsx), featuring a geometric hexagonal node, electric orange gradient core, and precision typographic lockup.
2. Complete visual modernization of [`TopNavBar.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/components/TopNavBar.tsx) to the canonical Obsidian Black & Electric Orange Design System (`bg-[#0c0a09]`, surfaces `#121214`, borders `#27272a`, `rounded-[6px]`), removing all legacy white surfaces and purple tokens.

---

## 2. Geometric Hex Node SVG Logo (`BacknodeLogo.tsx`)

### 2.1 Vector Icon Specifications
* **Geometry:** Hexagonal node perimeter with precision 120-degree symmetry, filled with an electric gradient from `#ea580c` (Tailwind `orange-600`) to `#f97316` (`orange-500`).
* **Core Symbol:** An electric lightning bolt / kinetic nexus silhouette cut through the center with subtle ambient orange glow:
  ```svg
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="backnodeGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#ea580c" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
    </defs>
    <!-- Hexagonal shield node -->
    <path d="M16 2L28 8.5V23.5L16 30L4 23.5V8.5L16 2Z" fill="url(#backnodeGradient)" stroke="#fb923c" stroke-width="1.5" />
    <!-- Electric circuit bolt nexus -->
    <path d="M17.5 7L10 16.5H16L14.5 25L22 15.5H16L17.5 7Z" fill="#ffffff" />
  </svg>
  ```
* **Typography Lockup:**
  * "Backnode" in Plus Jakarta Sans (`font-headline font-bold text-zinc-100 tracking-tight`).
  * "OS" in JetBrains Mono (`font-mono font-bold text-orange-500 tracking-wider`).
  * Optional mono version tag (`v1.0.0`) in `bg-[#18181b] border border-[#27272a] text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-[6px]`.

---

## 3. Dark Theme Top Navigation Bar Specifications

### 3.1 Dimensions & Backdrop
* **Container:** `h-14 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between px-6 w-full shrink-0 select-none z-20 sticky top-0 text-zinc-100`

### 3.2 Navigation Elements
* **Brand Lockup:** Renders `BacknodeLogo` mark at `sm` or `md` scale on the left.
* **Breadcrumbs:**
  * Path segments: `text-xs text-zinc-400 font-medium`.
  * Slashes: `text-zinc-600 font-mono`.
  * Active leaf: `text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30`.
* **Search Input:**
  * Container: `bg-[#18181b] border border-[#27272a] rounded-[6px] pl-9 pr-14 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans w-80 max-w-sm`.
  * Search icon: `text-zinc-400 text-[18px]`.
  * Shortcut pill: `font-mono text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-[6px]`.
  * Live Suggest Dropdown: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-2 text-zinc-100`.
    * Matched task rows: `hover:bg-zinc-800/50 rounded-[6px] text-zinc-200 hover:text-orange-400`.
* **Filter Button & Popover:**
  * Filter button:
    * Inactive: `px-3 py-1.5 rounded-[6px] border border-[#27272a] text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 bg-[#18181b]`.
    * Active: `border-orange-500/50 bg-orange-950/40 text-orange-400 font-semibold rounded-[6px]`.
  * Popover body: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-3.5 text-zinc-100 text-xs`.
  * Filter options: `hover:bg-zinc-800/50 rounded-[6px]`, selected option in `bg-orange-600 text-white font-semibold rounded-[6px]`.
* **Notifications & Help Popovers:**
  * Trigger icons: `w-8 h-8 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors`.
  * Notification badge: `w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[#0c0a09]`.
  * Popover body: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-3 text-zinc-100`.
* **Telemetry Sync Badge:**
  * Connected: `bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-[6px] flex items-center gap-1.5` with pulse dot.
* **Primary CTA:**
  * "+ New Task" / "+ New Item": `bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[6px] shadow-sm flex items-center gap-1.5 cursor-pointer`.

---

## 4. Verification Criteria

1. **Visual Token Audit:**
   * Zero references to `#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, or `#fafafc` in `TopNavBar.tsx`.
   * Zero banned radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`). All buttons, popovers, and inputs use `rounded-[6px]`.
2. **Build & Type Check:**
   * `npm run lint` (`tsc --noEmit`) passes with 0 errors.
   * `npm run build` succeeds cleanly.
3. **SVG Rendering:**
   * Verify crisp rendering of `BacknodeLogo` in TopNavBar at all viewport sizes.
