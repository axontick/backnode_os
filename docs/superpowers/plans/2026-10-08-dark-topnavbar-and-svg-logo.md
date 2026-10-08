# Dark TopNavBar & SVG Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a vector SVG logo component (`BacknodeLogo.tsx`) and modernize the top navigation bar (`TopNavBar.tsx`) into the canonical Obsidian Black & Electric Orange Design System (`bg-[#0c0a09]`, surfaces `#121214`, borders `#27272a`, `rounded-[6px]`), completely eliminating legacy light backgrounds and purple tokens.

**Architecture:** Implement `BacknodeLogo.tsx` with a geometric hexagonal shield node and electric lightning bolt vector graphic. Update `TopNavBar.tsx` to mount `BacknodeLogo` on the left, style the container with `bg-[#0c0a09]` and `border-[#27272a]`, and modernize search, filters, notifications, help, and CTAs to precision dark theme tokens. Also integrate `BacknodeLogo` into `AuthPage.tsx` and `AuthModal.tsx`.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Lucide / Material Symbols.

---

### Task 1: Create the Vector SVG Logo Component (`BacknodeLogo.tsx`)

**Files:**
- Create: `packages/frontend/src/components/BacknodeLogo.tsx`

- [ ] **Step 1: Write `BacknodeLogo.tsx`**

Implement a crisp, scalable SVG logo with:
- Hexagonal shield perimeter filled with linear gradient (`#ea580c` to `#f97316`) and sharp outline `#fb923c`
- Central lightning bolt / kinetic nexus symbol in pure white with soft orange ambient shadow
- Typography lockup: "Backnode" in Plus Jakarta Sans (`font-headline font-bold text-zinc-100`) and "OS" in JetBrains Mono (`font-mono font-bold text-orange-500`)
- Props: `size?: 'xs' | 'sm' | 'md' | 'lg'`, `showWordmark?: boolean`, `showVersion?: boolean`, `className?: string`

- [ ] **Step 2: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add packages/frontend/src/components/BacknodeLogo.tsx
git commit -m "feat(brand): add BacknodeLogo vector SVG component"
```

---

### Task 2: Modernize `TopNavBar.tsx` to Full Dark Theme & Mount SVG Logo

**Files:**
- Modify: `packages/frontend/src/components/TopNavBar.tsx`

- [ ] **Step 1: Mount `BacknodeLogo` and modernize container, search, breadcrumbs, and popovers**

In `packages/frontend/src/components/TopNavBar.tsx`:
- Import `BacknodeLogo` from `./BacknodeLogo`
- Header container: `h-14 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between px-6 w-full shrink-0 select-none z-20 sticky top-0 text-zinc-100`
- Left section: Mount `<BacknodeLogo size="sm" showWordmark={true} />`
- Breadcrumbs:
  - Text: `text-xs text-zinc-400 font-medium`
  - Slash: `text-zinc-600 font-mono`
  - Active leaf: `text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30`
- Search:
  - Input: `w-full bg-[#18181b] border border-[#27272a] rounded-[6px] pl-9 pr-14 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans`
  - Shortcut badge: `font-mono text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-[6px]`
  - Auto-suggest dropdown: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-2 text-zinc-100`
- Filter button & popover:
  - Inactive button: `bg-[#18181b] border border-[#27272a] text-zinc-300 hover:bg-zinc-800 rounded-[6px]`
  - Active button: `border-orange-500/50 bg-orange-950/40 text-orange-400 font-semibold rounded-[6px]`
  - Popover body: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-3.5 text-zinc-100`
  - Filter item selection: `bg-orange-600 text-white font-semibold rounded-[6px]`
- Notifications & Help:
  - Trigger icons: `w-8 h-8 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800`
  - Popovers: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl text-zinc-100`
- Telemetry badge:
  - Connected: `bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-[6px]`
- Primary CTA:
  - `bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[6px] shadow-sm`

- [ ] **Step 2: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add packages/frontend/src/components/TopNavBar.tsx
git commit -m "feat(navigation): modernize TopNavBar to dark theme with SVG logo and precision popovers"
```

---

### Task 3: Integrate `BacknodeLogo` into `AuthPage.tsx` and `AuthModal.tsx`

**Files:**
- Modify: `packages/frontend/src/pages/AuthPage.tsx`
- Modify: `packages/frontend/src/components/AuthModal.tsx`

- [ ] **Step 1: Replace emoji icon with `BacknodeLogo` in auth headers**

In `AuthPage.tsx` and `AuthModal.tsx`, replace the previous generic div with:
```tsx
<BacknodeLogo size="md" showWordmark={false} />
```

- [ ] **Step 2: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add packages/frontend/src/pages/AuthPage.tsx packages/frontend/src/components/AuthModal.tsx
git commit -m "style(auth): embed BacknodeLogo SVG into AuthPage and AuthModal"
```

---

### Task 4: Complete Verification & Build Quality Gate

**Files:**
- Audit: `packages/frontend/src/components/TopNavBar.tsx`
- Audit: `packages/frontend/src/components/BacknodeLogo.tsx`
- Audit: `packages/frontend/src/pages/AuthPage.tsx`
- Audit: `packages/frontend/src/components/AuthModal.tsx`

- [ ] **Step 1: Scan for prohibited tokens & banned radii**

Verify zero occurrences of `#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, or non-compliant border radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`).

- [ ] **Step 2: Verify production build**

Run: `npm run build` in `packages/frontend`
Expected: Vite build succeeds with zero errors.

- [ ] **Step 3: Commit any final refinements**

```bash
git commit -m "chore(navigation): finalize dark topnavbar and svg logo verification" --allow-empty
```
