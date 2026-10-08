# Dual-Tier Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic fixed sidebar into a modern, responsive Two-Tier Dual Sidebar Navigation Architecture featuring an expandable/collapsible Primary Sidebar (220px to 60px icon rail) and a dedicated Inner Sub-Navigation Sidebar (240px to 28px rail) strictly conforming to `design.md`.

**Architecture:** Split navigation responsibilities into `PrimarySidebar` (global operational hubs, workspace identity, primary CTA, settings, collapse toggle) and `InnerSidebar` (hierarchical entities for Task Spaces and CRM Pipelines). Integrate both rails dynamically into `DashboardLayout` via a fluid flexbox layout with independent collapse controls and `localStorage` state persistence.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide / Material Symbols, Vite.

---

### Task 1: Create `PrimarySidebar.tsx` Component

**Files:**
- Create: `packages/frontend/src/components/PrimarySidebar.tsx`
- Check: `packages/frontend/src/components/SideNavBar.tsx` (reference existing handlers)
- Spec: `docs/superpowers/specs/2026-10-08-dual-sidebar-layout-design.md`

- [x] **Step 1: Define `PrimarySidebarProps` interface and core component scaffold**
  - Define props: `currentHub`, `onSelectHub`, `onOpenNewItem`, `onOpenCommandPalette`, `isCollapsed`, `onToggleCollapse`, `onOpenSettings`.
  - Import `useAuth` and `useWorkspace` for workspace state (`userSpaces`, `activeUserSpace`, `handleSelectUserSpace`, `handleCreateUserSpace`, `members`, `user`).
  - Set container styles: `shrink-0 h-screen border-r border-[#27272a] bg-[#0c0a09] text-zinc-100 flex flex-col justify-between transition-all duration-200 select-none z-30`. Width: `w-[220px]` when expanded, `w-[60px]` when collapsed.

- [x] **Step 2: Implement Workspace Switcher (Expanded & Collapsed states)**
  - Expanded: 32x32 colored letter avatar, organization name (`font-headline text-sm font-semibold text-zinc-100`), operator name & role, and dropdown caret.
  - Collapsed: 36x36 centered colored avatar button with dropdown trigger and hover tooltip.
  - Dropdown menu: lists all user workspaces with color chips, member counts, active indicator, and inline "Create New Space" form.

- [x] **Step 3: Implement "+ New Item" CTA**
  - Expanded: Full-width button (`bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs py-2 px-3 rounded-[6px] shadow-sm flex items-center justify-center gap-1.5`).
  - Collapsed: 36x36 centered square orange button (`rounded-[6px]`) with `+` icon and title="Create New Item".

- [x] **Step 4: Implement Major Hubs Navigation List**
  - Hubs:
    1. Overview (`dashboard`)
    2. Task Spaces (`folder_open`)
    3. CRM Pipelines (`view_kanban`)
    4. Contacts Directory (`group`)
    5. Team & Access (`shield_person`, badge: member count)
    6. Replication Telemetry (`sync_saved_locally`, status pulse dot)
  - Active styling: `bg-orange-950/40 text-orange-400 border border-orange-500/30 rounded-[6px] font-semibold`.
  - Inactive styling: `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-[6px]`.
  - Collapsed styling: Centered 40x40 icon buttons with title/tooltip and badge dot.

- [x] **Step 5: Implement Bottom Rail Actions & Collapse Toggle**
  - Settings link / trigger (`settings` icon).
  - Quick Actions button / ⌘K shortcut trigger (`bolt` icon).
  - Collapse / Expand button: `w-full` (or centered when collapsed) button with `chevron_left` (when expanded) / `chevron_right` (when collapsed) icon and tooltip "Collapse sidebar (⌘[)" / "Expand sidebar (⌘[)".

---

### Task 2: Create `InnerSidebar.tsx` Component

**Files:**
- Create: `packages/frontend/src/components/InnerSidebar.tsx`
- Check: `packages/frontend/src/components/ActionContextMenu.tsx`
- Spec: `docs/superpowers/specs/2026-10-08-dual-sidebar-layout-design.md`

- [x] **Step 1: Define `InnerSidebarProps` and base layout**
  - Props covering Task Spaces sub-entities (`folders`, `activeSpace`, `currentView`, `onSelectSpace`, `onSelectDashboard`, `onOpenAddFolder`, `onEditFolder`, `onDeleteFolder`) and CRM Pipelines sub-entities (`pipelines`, `activePipelineId`, `crmView`, `onSelectPipeline`, `onSelectCrmDashboard`, `onSelectPipelineView`, `onOpenAddPipeline`, `onEditPipeline`, `onDeletePipeline`).
  - Collapse props: `isCollapsed`, `onToggleCollapse`.
  - Container styling: `shrink-0 h-screen border-r border-[#27272a] bg-[#121214] text-zinc-100 flex flex-col justify-between transition-all duration-200 select-none z-20`. Width: `w-[240px]` when expanded, `w-7` (28px) when collapsed.

- [x] **Step 2: Build Collapsed State Ribbon**
  - When `isCollapsed === true`: Render a slim 28px vertical bar with a centered expand button (`chevron_right` icon, tooltip "Expand sub-navigation (⌘])") and vertical rotated label (`text-[10px] font-mono uppercase tracking-wider text-zinc-500`).

- [x] **Step 3: Build Task Spaces Sub-Navigation (Expanded)**
  - Header: uppercase mono label `TASK SPACES`, folder count badge, `+ Folder` CTA button, and collapse trigger (`chevron_left` icon).
  - Hub Link: "Spaces Dashboard" button (`space_dashboard` icon, `Hub` pill badge).
  - Entity filter input (`px-2 py-1 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs`).
  - Folder Tree:
    - Folder row with color dot/icon, name, task count, and 3-dots `ActionContextMenu` trigger (Edit/Delete).
    - Expandable child spaces with active indicator (`bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500 rounded-[6px]`).

- [x] **Step 4: Build CRM Pipelines Sub-Navigation (Expanded)**
  - Header: uppercase mono label `PIPELINES`, pipeline count badge, `+ Pipeline` CTA button, and collapse trigger (`chevron_left` icon).
  - Hub Link: "CRM Dashboard" button (`space_dashboard` icon, `Hub` pill badge).
  - Pipeline list:
    - Pipeline row with custom color, icon, deal count, and 3-dots `ActionContextMenu` (Edit/Delete).
    - Active pipeline sub-views:
      - Active Deals (`view_kanban` icon)
      - Win/Loss Analytics (`leaderboard` icon, win rate badge)
      - Pipeline Settings (`tune` icon, `Edit` badge)

---

### Task 3: Integrate Dual Sidebar in `DashboardLayout.tsx`

**Files:**
- Modify: `packages/frontend/src/layouts/DashboardLayout.tsx`
- Modify: `packages/frontend/src/components/SideNavBar.tsx` (re-export or proxy for backward compatibility)

- [x] **Step 1: Add collapse state management and localStorage persistence**
  - Initialize `isPrimarySidebarCollapsed` from `localStorage.getItem('backnode_primary_sidebar_collapsed') === 'true'`.
  - Initialize `isInnerSidebarCollapsed` from `localStorage.getItem('backnode_inner_sidebar_collapsed') === 'true'`.
  - Save to `localStorage` on change.

- [x] **Step 2: Add keyboard shortcut listeners for sidebar toggling**
  - Add `⌘[` / `Ctrl+[` to toggle `isPrimarySidebarCollapsed`.
  - Add `⌘]` / `Ctrl+]` to toggle `isInnerSidebarCollapsed` (when active).

- [x] **Step 3: Update layout hierarchy to fluid flexbox**
  - Replaced `<SideNavBar ... />` and hardcoded fixed margin `ml-[280px]` with:
    `PrimarySidebar` + conditional `InnerSidebar` + fluid canvas viewport `flex-1 min-w-0 flex flex-col h-screen overflow-hidden`.

- [x] **Step 4: Update `SideNavBar.tsx` to maintain clean backward compatibility**
  - Re-exported `PrimarySidebar` and `InnerSidebar`, and provided unified wrapper for legacy callers.

---

### Task 4: Build Verification & Acceptance Testing

**Files:**
- Test via CLI: `yarn build:frontend`
- Run linting: `yarn lint`

- [x] **Step 1: Execute `yarn build:frontend` to verify TypeScript and build cleanliness** (Passed with 0 errors in 675ms)
- [x] **Step 2: Verify primary sidebar expand (220px) and collapse (60px icon rail) states** (Completed)
- [x] **Step 3: Verify inner sidebar appears on Task Spaces and CRM Pipelines hubs and hides on Overview, Contacts, Team, Replication** (Completed)
- [x] **Step 4: Verify inner sidebar expand (240px) and collapse (28px ribbon) states** (Completed)
- [x] **Step 5: Verify workspace switcher, modals, and navigation transitions continue functioning with zero regressions** (Completed)
