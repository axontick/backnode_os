# Overall Dashboard Redesign & Login Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Backnode OS overall dashboard into a canonical Bento Grid matrix adhering to `design.md` (Obsidian Black `#09090b` & `#121214`, Electric Orange `#ea580c`, uniform `rounded-[6px]`), and configure the application so operators land on this overall dashboard upon login.

**Architecture:** Set `currentHub` default to `'overview'` in `WorkspaceContext`. Rebuild `OverviewView.tsx` into a high-density 7-tile Bento Grid containing sprint velocity, workload triage, pipeline revenue, database telemetry, interactive deliverables triage stream, CRM stage distribution, and a full-width telemetry strip. Modernize `SideNavBar.tsx` and `ExecutiveCockpitView.tsx` to eliminate legacy purple tokens.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Lucide / Material Symbols.

---

### Task 1: Update Login Default Routing in `WorkspaceContext.tsx` and Modernize `DashboardLayout.tsx` & `SideNavBar.tsx`

**Files:**
- Modify: `packages/frontend/src/context/WorkspaceContext.tsx:205-215`
- Modify: `packages/frontend/src/layouts/DashboardLayout.tsx:105-125`
- Modify: `packages/frontend/src/components/SideNavBar.tsx:280-310`

- [ ] **Step 1: Set `currentHub` default to `'overview'` in `WorkspaceContext.tsx`**

In `packages/frontend/src/context/WorkspaceContext.tsx`, change:
```tsx
const [currentHub, setCurrentHub] = useState<string>('task-spaces');
```
to:
```tsx
const [currentHub, setCurrentHub] = useState<string>('overview');
```

- [ ] **Step 2: Update `DashboardLayout.tsx` root container to dark canvas**

In `packages/frontend/src/layouts/DashboardLayout.tsx`, change:
```tsx
<div className="flex h-screen w-screen overflow-hidden bg-[#fbf8ff] text-[#1a1b22] font-sans antialiased select-none">
```
to:
```tsx
<div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans antialiased select-none">
```

- [ ] **Step 3: Modernize `SideNavBar.tsx` Overview active styling and eliminate purple tokens**

In `packages/frontend/src/components/SideNavBar.tsx`:
- Overview button active state:
  ```tsx
  currentHub === 'overview'
    ? 'text-orange-400 bg-orange-950/40 border-l-2 border-orange-500 font-semibold'
    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
  ```
- Primary CTA "+ New Pipeline Item" -> "+ New Item":
  ```tsx
  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs py-2 px-3.5 rounded-[6px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
  ```
- Task spaces & CRM hub active highlights: use `text-orange-400 bg-orange-950/40 border-l-2 border-orange-500` instead of legacy purple `#9900c2`.
- Workspace dropdown popover: replace white/purple styling with `#121214`, `border-[#27272a]`, `rounded-[6px]`.

- [ ] **Step 4: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add packages/frontend/src/context/WorkspaceContext.tsx packages/frontend/src/layouts/DashboardLayout.tsx packages/frontend/src/components/SideNavBar.tsx
git commit -m "feat(navigation): route to overall dashboard by default on login and modernize sidebar tokens"
```

---

### Task 2: Rebuild `OverviewView.tsx` into Canonical Bento Grid

**Files:**
- Modify: `packages/frontend/src/components/OverviewView.tsx`
- Modify: `packages/frontend/src/pages/OverviewPage.tsx`

- [ ] **Step 1: Rebuild `OverviewView.tsx`**

Implement the 7-tile Bento Grid Matrix matching `design.md` §7:
- Canvas: `flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b] text-zinc-100 select-none`
- Container: `max-w-7xl mx-auto flex flex-col gap-5`
- Header:
  - System status pill: `font-mono text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-[6px] font-semibold flex items-center gap-1.5`
  - Workspace title: `text-xl font-bold text-zinc-100 tracking-tight font-headline`
  - Subtitle: `Active workspace for {user?.name || 'Operator'} • Unified operational intelligence and CRM mesh.`
  - Action buttons: "Jump to Kanban Board" (`rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs px-3 py-1.5`) and "Jump to CRM Pipelines".
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
  - Tile 1 (1x1): `SPRINT VELOCITY` (`font-mono text-3xl font-bold text-zinc-100`), progress bar with `bg-orange-600` fill.
  - Tile 2 (1x1): `TRIAGE WORKLOAD` (`font-mono text-3xl font-bold text-zinc-100`), active deliverable count + urgent blockers alert chip.
  - Tile 3 (1x1): `PIPELINE REVENUE` (`font-mono text-3xl font-bold text-zinc-100`), `${formattedPipeline}` + active deals count.
  - Tile 4 (1x1): `DATA ENGINE STATUS` (`font-mono text-3xl font-bold text-emerald-400`), `100%` + `PostgreSQL Synced (4ms)`.
  - Tile 5 (2x2): `Active High-Priority Deliverables` Triage Stream with status toggle checkboxes, priority badges, assignee avatars, and "+ New Task" trigger.
  - Tile 6 (2x2): `Stage Velocity & Conversion` with multi-stage revenue distribution bars (Qualified Lead, Discovery, Proposal, Contract, Closed Won).
  - Tile 7 (4x1): `Global System Telemetry Strip` (`PostgreSQL: Active (4ms) • SQLite Local Replica: Synced • Multi-Tenant Partition: 100% • Cluster Status: Nominal`).

- [ ] **Step 2: Update `OverviewPage.tsx` to pass deals, navigation, and task handlers**

Wire `deals`, `onSelectDeal`, `onNavigateToDeals`, `onOpenCreateTask`, and `onUpdateTask` to `OverviewView`.

- [ ] **Step 3: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add packages/frontend/src/components/OverviewView.tsx packages/frontend/src/pages/OverviewPage.tsx
git commit -m "feat(dashboard): rebuild OverviewView as obsidian & electric orange Bento Grid"
```

---

### Task 3: Modernize `ExecutiveCockpitView.tsx` to Dark Theme

**Files:**
- Modify: `packages/frontend/src/components/ExecutiveCockpitView.tsx`

- [ ] **Step 1: Replace legacy light & purple classes with obsidian & electric orange tokens**

In `packages/frontend/src/components/ExecutiveCockpitView.tsx`:
- Background: `bg-[#09090b] text-zinc-100`
- Top ribbon & cards: `bg-[#121214] border-[#27272a] rounded-[6px]`
- Stage colors: Replace `#9900c2` with `bg-orange-500`
- Action items list: `bg-[#18181b] border-[#27272a] rounded-[6px] text-zinc-200`
- System health strip: `bg-[#121214] border-[#27272a] text-zinc-400 font-mono`

- [ ] **Step 2: Typecheck frontend**

Run: `npm run lint` in `packages/frontend`
Expected: Output clean with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add packages/frontend/src/components/ExecutiveCockpitView.tsx
git commit -m "style(cockpit): modernize ExecutiveCockpitView to obsidian & electric orange theme"
```

---

### Task 4: Complete Verification & Build Quality Gate

**Files:**
- Audit: `packages/frontend/src/components/OverviewView.tsx`
- Audit: `packages/frontend/src/components/SideNavBar.tsx`
- Audit: `packages/frontend/src/components/ExecutiveCockpitView.tsx`
- Audit: `packages/frontend/src/context/WorkspaceContext.tsx`
- Audit: `packages/frontend/src/layouts/DashboardLayout.tsx`

- [ ] **Step 1: Scan for prohibited tokens & banned radii**

Verify zero occurrences of `#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, or non-compliant border radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`).

- [ ] **Step 2: Verify production build**

Run: `npm run build` in `packages/frontend`
Expected: Vite build succeeds with zero errors.

- [ ] **Step 3: Commit any final refinements**

```bash
git commit -m "chore(dashboard): finalize overall dashboard redesign verification" --allow-empty
```
