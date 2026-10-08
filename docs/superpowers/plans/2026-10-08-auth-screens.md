# Auth Screens Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Backnode OS authentication screens (`AuthPage` and `AuthModal`) to adhere strictly to `design.md` (Obsidian Black `#09090b` & `#121214`, Electric Orange `#ea580c`, uniform `rounded-[6px]`) and update action buttons and tabs to explicitly use the words "Login" and "Register".

**Architecture:** Modernize `AuthPage.tsx` and `AuthModal.tsx` to share a consistent High-Density Obsidian Terminal Card aesthetic with standard 6px corner radii, 34px form inputs, and Electric Orange CTAs. Mount `AuthModal` in `App.tsx` for seamless in-app account switching, and clean up the `App.tsx` splash screen to eliminate legacy violet tokens.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Lucide / Material Symbols.

---

### Task 1: Redesign `AuthPage.tsx`

**Files:**
- Modify: `packages/frontend/src/pages/AuthPage.tsx`

- [ ] **Step 1: Replace legacy purple tokens, oversized radii, and outdated text in `AuthPage.tsx`**

Update `packages/frontend/src/pages/AuthPage.tsx` with:
- Global canvas: `min-h-screen w-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden select-none`
- Background accents: remove purple blurs `#9900c2`, use subtle electric orange ambient glow (`bg-orange-600/5 rounded-full blur-3xl`) and dot grid
- Container: `w-full max-w-md bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10`
- Brand header: 36x36px icon in `bg-orange-600 text-white rounded-[6px]`, version tag `v1.0.0` in `font-mono text-[10px] bg-[#18181b] text-zinc-400 border border-[#27272a] rounded-[6px]`, and status pill "Online" with emerald dot in `rounded-[6px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono`
- Tabs: "Login" and "Register". Active tab has `text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]`, inactive has `text-zinc-400 hover:text-zinc-200`
- Form inputs: `bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-500 font-mono`
- Action buttons: full-width electric orange button `bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs py-2.5 rounded-[6px] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50`
  - Login tab button text: `{isSubmitting ? 'Logging in...' : 'Login'}`
  - Register tab button text: `{isSubmitting ? 'Registering...' : 'Register'}`
- Switch helper links:
  - Login form switch link: "Need an account? Register"
  - Register form switch link: "Already have an account? Login"
- Error callout: `bg-red-950/60 border border-red-800/60 text-red-200 text-xs rounded-[6px] p-3 flex items-start gap-2`
- Security footer: `bg-[#0c0a09] border-t border-[#27272a] px-6 py-2.5 flex items-center justify-between text-[11px] text-zinc-500 font-mono`

- [ ] **Step 2: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add packages/frontend/src/pages/AuthPage.tsx
git commit -m "feat(auth): redesign AuthPage to obsidian & electric orange system with Login/Register buttons"
```

---

### Task 2: Redesign `AuthModal.tsx` and Mount in `App.tsx`

**Files:**
- Modify: `packages/frontend/src/components/AuthModal.tsx`
- Modify: `packages/frontend/src/App.tsx`

- [ ] **Step 1: Update `AuthModal.tsx` to match design tokens and "Login" / "Register" buttons**

Update `packages/frontend/src/components/AuthModal.tsx`:
- Backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150`
- Modal body: `w-full max-w-md bg-[#121214] text-zinc-100 border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150`
- Header: Backnode OS logo mark (orange `rounded-[6px]`), "Backnode OS", "Operator Access & Identity Matrix", and close button (`w-7 h-7 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800`)
- Tabs: "Login" and "Register" with identical styling to `AuthPage`
- Form inputs: styled identically with `#18181b`, `border-[#27272a]`, `rounded-[6px]`, `focus:border-orange-500`
- Action buttons:
  - Login tab button text: `{isSubmitting ? 'Logging in...' : 'Login'}`
  - Register tab button text: `{isSubmitting ? 'Registering...' : 'Register'}`
- Footer: `px-6 py-2.5 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between text-[10px] text-zinc-500 font-mono`

- [ ] **Step 2: Mount `AuthModal` in `App.tsx`**

Ensure `AuthModal` is rendered in `App.tsx` so that when `isAuthModalOpen` is toggled (e.g. from the TopNavBar profile menu), the modal renders over the active dashboard.

- [ ] **Step 3: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add packages/frontend/src/components/AuthModal.tsx packages/frontend/src/App.tsx
git commit -m "feat(auth): redesign AuthModal with Login/Register buttons and mount in App"
```

---

### Task 3: Modernize `App.tsx` Loading Screen and TopNavBar Profile Popover Tokens

**Files:**
- Modify: `packages/frontend/src/App.tsx`
- Modify: `packages/frontend/src/components/TopNavBar.tsx` (clean up purple auth triggers/popover)

- [ ] **Step 1: Replace legacy purple styles in `App.tsx` loading state**

Update the loading screen in `packages/frontend/src/App.tsx`:
- Canvas: `bg-[#09090b] text-zinc-100`
- Icon container: `w-12 h-12 rounded-[6px] bg-orange-600 flex items-center justify-center shadow-[0_0_25px_rgba(234,88,12,0.35)] animate-pulse`
- Monospace subtitle: `text-xs text-zinc-500 font-mono` ("Restoring secure operator environment...")

- [ ] **Step 2: Clean up legacy purple classes in `TopNavBar.tsx` auth buttons & profile popover**

In `packages/frontend/src/components/TopNavBar.tsx`:
- "Sign In" button (when unauthenticated): `px-2.5 py-1 rounded-[6px] bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[11px] font-semibold transition-all`
- Profile popover: `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl`
- Popover role badge: `bg-orange-950/40 text-orange-400 border border-orange-500/30 rounded-[6px]`
- Switch Account button: `hover:bg-orange-950/30 text-zinc-200 hover:text-orange-400 rounded-[6px]`

- [ ] **Step 3: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/components/TopNavBar.tsx
git commit -m "style(app): modernize loading splash and navbar profile popover to dark orange theme"
```

---

### Task 4: Complete Verification & Build Quality Gate

**Files:**
- Audit: `packages/frontend/src/pages/AuthPage.tsx`
- Audit: `packages/frontend/src/components/AuthModal.tsx`
- Audit: `packages/frontend/src/App.tsx`
- Audit: `packages/frontend/src/components/TopNavBar.tsx`

- [ ] **Step 1: Scan for prohibited tokens & banned radii**

Verify that none of the modified files contain `#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, or non-compliant border radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`).

- [ ] **Step 2: Verify production build**

Run: `npm run build` in `packages/frontend`
Expected: Vite build succeeds with zero errors.

- [ ] **Step 3: Commit any final refinements**

```bash
git commit -m "chore(auth): finalize auth screens redesign verification" --allow-empty
```
