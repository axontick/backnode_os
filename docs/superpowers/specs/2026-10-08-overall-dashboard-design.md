# Technical Design Specification: Overall Dashboard Redesign & Login Routing

- **Date:** 2026-10-08
- **Topic:** Overall Dashboard Bento Grid Redesign & Default Login Routing
- **Status:** Approved
- **Reference Standard:** [`design.md`](file:///D:/Work/Personal/backnode-os/design.md) & [`AGENTS.md`](file:///D:/Work/Personal/backnode-os/AGENTS.md)

---

## 1. Executive Summary

This specification defines the redesign of the primary workspace **Overall Dashboard** into the canonical **Obsidian Black & Electric Orange Bento Grid** architecture, and configures the application so that authenticated operators land directly on the **Overall Dashboard** rather than the Task Spaces kanban board.

All legacy light backgrounds (`#fafafc`, `bg-white`), purple tokens (`#9900c2`, `#f4f2fd`, etc.), and banned border radii (`rounded-xl`, `rounded-lg`) are removed in favor of:
- Pure obsidian pitch-black canvas `#09090b` (`bg-[#09090b]`)
- Precision `#121214` card surfaces with stone `#27272a` borders
- Uniform 6px corner radii (`rounded-[6px]`)
- Electric orange `#ea580c` accents and CTAs

---

## 2. Login & Default Navigation Routing

### 2.1 Context Initialization
In [`WorkspaceContext.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/context/WorkspaceContext.tsx):
- Update `currentHub` default state from `'task-spaces'` to `'overview'`.
- Upon successful login (or session restore in `App.tsx`), Backnode OS mounts `DashboardLayout` with `currentHub === 'overview'`, rendering `OverviewPage` by default.

### 2.2 Dual-Tier Sidebar Integration
- In [`SideNavBar.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/components/SideNavBar.tsx):
  - Ensure the **Overview** item reflects the active state (`bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500 rounded-r-[6px]`).
  - Eliminate purple tokens in the sidebar CTA ("New Item") and workspace selector dropdown.
  - Since `Overview` is a root dashboard hub, the inner sub-navigation sidebar does not display, granting full viewport width to the Bento Grid.

---

## 3. Bento Grid Overall Dashboard Architecture

The updated [`OverviewView.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/components/OverviewView.tsx) (and `OverviewPage.tsx`) implements the 7-tile Bento Grid Matrix specified in `design.md` §7:

```
+---------------------------------------------------------------------------------------------------+
|  OVERALL DASHBOARD BENTO GRID CONTAINER (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4)     |
+---------------------------------------------------------------------------------------------------+
| [1x1 KPI: Sprint Velocity]  | [1x1 KPI: Triage Workload]  | [1x1 KPI: Pipeline ARR] | [1x1 KPI: Telemetry]  |
| 68% Completed               | 14 Active Items             | $482,000 Active ARR     | 100% PostgreSQL Synced|
+-----------------------------+-----------------------------+-------------------------+---------------------+
| [2x2 Widget: Deliverables Triage Stream]                  | [2x2 Widget: Stage Velocity & Revenue Distribution]   |
| - Filterable High-Priority Tasks Stream                   | - Pipeline Stage Breakdown (5 Stages)                 |
| - Quick Status Checkbox (Done/In Progress)                | - Revenue & Deal Count by Stage                       |
| - "Jump to Kanban Board" CTA Button                       | - "Jump to CRM Pipelines" CTA Button                  |
+-----------------------------------------------------------+-----------------------------------------------+
| [4x1 System Health & Telemetry Strip]                                                             |
| PostgreSQL: Synced (4ms) | SQLite Local: Active | Multi-Tenant: 100% | Latency: 12ms | Replicas: Nominal |
+---------------------------------------------------------------------------------------------------+
```

### 3.1 Tile Specifications

1. **Tile 1 (1x1 KPI): Sprint Velocity & Execution**
   - Container: `bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between hover:border-orange-500/40 transition-all`
   - Monospace Tag: `SPRINT VELOCITY` (`font-mono text-[10px] text-zinc-400 uppercase tracking-wider`)
   - Value: `font-mono text-3xl font-bold text-zinc-100` (`{completionPct}%`)
   - Progress Bar: Height 6px `rounded-full bg-zinc-800`, fill in `bg-orange-600`
   - Subtitle: `{doneCount} of {totalCount} closed`

2. **Tile 2 (1x1 KPI): Active Deliverables & Critical Blockers**
   - Monospace Tag: `TRIAGE WORKLOAD`
   - Value: `font-mono text-3xl font-bold text-zinc-100` (`{inProgressCount + reviewCount}`)
   - Alert Pill: `font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-red-950/40 text-red-400 border border-red-500/30 font-semibold` (`{urgentCount} Blockers Flagged`)

3. **Tile 3 (1x1 KPI): Pipeline ARR & Active Deals**
   - Monospace Tag: `PIPELINE REVENUE`
   - Value: `font-mono text-3xl font-bold text-zinc-100` (`${formattedPipeline}`)
   - Subtitle: `{deals.length} active opportunities`

4. **Tile 4 (1x1 KPI): Database & System Health**
   - Monospace Tag: `DATA ENGINE STATUS`
   - Value: `font-mono text-3xl font-bold text-emerald-400` (`100%`)
   - Status Pill: `font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5` with pulse dot

5. **Tile 5 (2x2 Major Widget): Active Deliverables Triage Stream**
   - Header:
     - Title: `Active High-Priority Deliverables` (`text-[13px] font-semibold text-zinc-100 flex items-center gap-2`) with orange bolt icon
     - Action: `Jump to Kanban Board` button (`rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer`)
   - Content: Scrollable list of priority items with:
     - Checkbox toggle (clicking updates task status between Done and In Progress)
     - Priority tag (`Urgent`, `High`, `Medium` with dark-mode calibrated semantic tints)
     - Task title (`text-[13px] font-medium text-zinc-200 hover:text-orange-400 cursor-pointer`)
     - Assignee letter avatar (`rounded-full w-5 h-5 font-mono text-[10px] bg-zinc-800 text-zinc-300`)
     - Status badge

6. **Tile 6 (2x2 Major Widget): Stage Velocity & Revenue Distribution**
   - Header:
     - Title: `Stage Velocity & Conversion` (`text-[13px] font-semibold text-zinc-100 flex items-center gap-2`) with orange chart icon
     - Action: `Jump to CRM` button (`rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer`)
   - Content:
     - Five pipeline stages: Qualified Lead, Discovery & Demo, Proposal Submitted, Contract & Legal, Closed Won
     - Stage percentage horizontal tracks with custom high-contrast colors (orange, sky, amber, emerald)
     - Currency amount and deal count per stage

7. **Tile 7 (4x1 Strip): System Health & Telemetry Strip**
   - Container: `col-span-1 md:col-span-2 lg:col-span-4 bg-[#121214] border border-[#27272a] rounded-[6px] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400`
   - Metrics:
     - `PostgreSQL Engine: Connected (4ms)`
     - `Local SQLite Replica: Synced`
     - `Multi-Tenant Partition: Active`
     - `Sync Telemetry: Nominal`

---

## 4. Verification & Testing Criteria

1. **Login Landing Test:**
   - Verify that upon initial page load or login, `currentHub` is `'overview'` and the Overall Dashboard renders immediately.
2. **Visual Token Audit:**
   - Confirm zero occurrences of `#9900c2`, `#f4f2fd`, `#d4c0d5`, `#fafafc`, `rounded-xl`, or `rounded-2xl` in `OverviewView.tsx`, `OverviewPage.tsx`, or `DashboardLayout.tsx`.
3. **Interactive Actions:**
   - Clicking "Jump to Kanban Board" switches `currentHub` to `'task-spaces'` and `currentView` to `'board'`.
   - Clicking "Jump to CRM" switches `currentHub` to `'crm'` and `crmView` to `'board'`.
   - Clicking a task in the triage stream opens its details or toggles its status.
4. **Build & Type Check:**
   - `npm run lint` (`tsc --noEmit`) passes with 0 errors.
   - `npm run build` succeeds cleanly.
