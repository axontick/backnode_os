# BACKNODE OS — SYSTEM DESIGN SYSTEM SPECIFICATION (`design.md`)

> **Status:** Canonical Design Standard  
> **Target Platform:** Backnode OS Web & Desktop Platform (`@backnode/frontend`)  
> **Key Paradigms:** Full Dark Theme (Obsidian Black & Electric Orange), Uniform 6px Geometry (`rounded-[6px]`), Bento Grid Dashboards, Two-Tier Dual Sidebar Navigation.

---

## 1. Executive Summary & Design Vision

Backnode OS is an enterprise-grade execution platform combining local-first task triage, kinetic kanban workflows, multi-pipeline CRM, and real-time database telemetry.

The visual signature is an **Obsidian Black & Electric Orange Full Dark Theme**: an ultra-modern, high-density, developer-console aesthetic pairing pitch-black backdrops with precision obsidian surfaces, razor-sharp stone borders, and vibrant electric orange accents.

### Foundational Pillars

1. **Obsidian & Electric Orange Palette:** Pure jet black canvas (`#09090b`), deep obsidian card surfaces (`#121214`), dark charcoal panels (`#18181b`), and tactile stone borders (`#27272a`), energized by high-visibility electric brand orange (`#ea580c` / `#f97316`).
2. **Strict 6px Border Radius Geometry:** Every interactive element, container, card, modal, button, and input uniformly uses a **6px radius** (`rounded-[6px]`). Rounded pills (`rounded-full`) and oversized radii (`rounded-2xl`, `rounded-xl`, `rounded-lg`) are strictly forbidden, with exceptions only for circular user avatars and linear progress bar tracks.
3. **Two-Tier Dual Sidebar Navigation:** Navigation is partitioned into two clear planes:
   - **Primary Sidebar (Major Items Rail — 220px):** Fast global hub switching (Overview, Task Spaces, CRM, Contacts, Team, Replication, Settings, Workspace Switcher) set against deep jet black.
   - **Inner Sidebar (Sub-Navigation Rail — 240px):** Automatically activates when a major hub has an inner list hierarchy (such as Folders and Spaces in Task Spaces, or Pipelines and Views in CRM), eliminating nested accordion clumping and dropdown fatigue.
4. **Bento Grid Dashboard Architecture:** All dashboard views arrange metrics, KPIs, triage lists, charts, and activity feeds into responsive Bento Grids with disciplined column/row spans and consistent 16px/20px gutters.

---

## 2. Color Palette & Design Tokens

### 2.1 Electric Brand Orange Tokens
The core brand signature is a high-visibility, electric orange engineered for high contrast against obsidian and jet-black surfaces:

| Token Name | Hex Code | Tailwind Utility | Primary Usage |
|---|---|---|---|
| `orange-primary` | `#ea580c` | `bg-orange-600` / `text-orange-600` | Primary action buttons, major active markers, key brand touches |
| `orange-hover` | `#c2410c` | `bg-orange-700` / `hover:bg-orange-700` | Hover state for primary buttons and critical interactive triggers |
| `orange-active` | `#9a3412` | `bg-orange-800` / `active:bg-orange-800` | Pressed/active state for primary actions |
| `orange-vibrant` | `#f97316` | `bg-orange-500` / `text-orange-500` | Vibrant badges, active state pulses, notification pings, hover icons |
| `orange-light` | `#fb923c` | `text-orange-400` | Text accents in dark mode, highlight headings, focus indicators |
| `orange-border` | `rgba(249, 115, 22, 0.4)` | `border-orange-500/40` | Active card borders, highlighted container borders, active tab underlines |
| `orange-focus` | `#f97316` | `ring-orange-500` | Focus-visible rings and active item outlines |
| `orange-subtle` | `rgba(234, 88, 12, 0.15)` | `bg-orange-950/40` | Active navigation selection, selected table row background, soft chip bg |
| `orange-surface` | `rgba(249, 115, 22, 0.08)` | `bg-orange-500/10` | Subtle hover highlights on rows, soft pill backgrounds |

> [!IMPORTANT]
> **Zero Legacy Colors:**  
> All instances of legacy purple tokens (`#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, `#330043`) are completely prohibited. All UI elements must use the Obsidian Black and Electric Orange palette.

---

### 2.2 Obsidian Black & Slate-Stone Dark Neutral Palette

| Token Name | Hex Code | Tailwind Equivalent | Purpose |
|---|---|---|---|
| `canvas-bg` | `#09090b` | `bg-[#09090b]` / `bg-zinc-950` | Global application canvas background (pure obsidian pitch black) |
| `surface-primary` | `#121214` | `bg-[#121214]` | Primary card bodies, modal containers, popovers, inner sidebar |
| `surface-secondary`| `#18181b` | `bg-[#18181b]` / `bg-zinc-900` | Elevated cards, search inputs, inactive pill backgrounds, header bars |
| `surface-muted` | `#222226` | `bg-[#222226]` | Hover backgrounds, table alternate row shading, secondary action wells |
| `surface-rail` | `#0c0a09` | `bg-[#0c0a09]` | Primary Major Sidebar rail (ultra-dark framing) |
| `text-primary` | `#f4f4f5` | `text-zinc-100` | High-contrast headings, card titles, key metric numbers |
| `text-secondary` | `#a1a1aa` | `text-zinc-400` | Body copy, descriptions, secondary navigation labels |
| `text-muted` | `#71717a` | `text-zinc-500` | Input placeholders, timestamps, auxiliary labels, mono captions |
| `border-default` | `#27272a` | `border-[#27272a]` / `border-zinc-800` | Standard container borders, card dividers, navbar separators |
| `border-subtle` | `#1f1f23` | `border-[#1f1f23]` | Internal row dividers, micro borders |
| `border-hover` | `#3f3f46` | `border-zinc-700` | Hovered container borders, focused card outlines |
| `inverse-bg` | `#f4f4f5` | `bg-zinc-100` | Rare high-contrast inverse tooltips or badges |
| `inverse-text` | `#09090b` | `text-zinc-950` | Text on inverted badges |

---

### 2.3 Semantic Status & Telemetry Colors (Dark Mode Calibrated)

| Status | Text Color | Surface Tint | Border Color | Icon / Dot |
|---|---|---|---|---|
| **Success / Connected** | `#34d399` (emerald-400) | `rgba(16, 185, 129, 0.12)` | `rgba(16, 185, 129, 0.3)` | `#10b981` (emerald-500) |
| **In Progress / Active** | `#fb923c` (orange-400) | `rgba(249, 115, 22, 0.15)` | `rgba(249, 115, 22, 0.35)` | `#f97316` (orange-500) |
| **Review / Quality Gate** | `#fbbf24` (amber-400) | `rgba(245, 158, 11, 0.12)` | `rgba(245, 158, 11, 0.3)` | `#f59e0b` (amber-500) |
| **Blocked / Critical** | `#f87171` (red-400) | `rgba(239, 68, 68, 0.12)` | `rgba(239, 68, 68, 0.3)` | `#ef4444` (red-500) |
| **Syncing / Telemetry** | `#38bdf8` (sky-400) | `rgba(14, 165, 233, 0.12)` | `rgba(14, 165, 233, 0.3)` | `#0ea5e9` (sky-500) |
| **Neutral / Backlog** | `#a1a1aa` (zinc-400) | `rgba(161, 161, 170, 0.10)` | `rgba(161, 161, 170, 0.2)` | `#71717a` (zinc-500) |

---

## 3. Strict 6px Geometry Standard (`rounded-[6px]`)

A non-negotiable rule of Backnode OS is **uniform 6px corner radii**. This yields a crisp, high-density, precision-machined aesthetic.

```css
/* Canonical Item Radius Token */
--radius-item: 6px;
```

### 3.1 Scope of the 6px Rule
The following elements **MUST** use `rounded-[6px]` (or `6px` inline):
- **Cards & Widgets:** All Bento grid cards, kanban task cards, CRM deal cards, overview tiles.
- **Buttons & Action Controls:** Primary CTAs, secondary buttons, ghost buttons, icon buttons, segmented tabs.
- **Form Controls:** Text inputs, select menus, textareas, search bars, checkbox boxes, date pickers.
- **Navigation Items:** Sidebar navigation links, inner sidebar tree items, breadcrumb pills.
- **Tabs & Filter Bars:** Filter pills, view switcher buttons, group-by pills, column visibility toggles.
- **Overlays & Dialogs:** Modal windows, action context menus, dropdown popovers, task/deal inspectors, toast containers.
- **Badges & Chips:** Status chips, priority badges, member count tags, telemetry pills.
- **Table Elements:** Outer table wrapper, selected table row outlines, table cell highlight badges.

### 3.2 Explicit Exceptions
Only three elements are permitted to diverge from `6px`:
1. **User Avatars:** `rounded-full` (circular display for user profile images and letter avatars).
2. **Linear Progress Fill Tracks:** `rounded-full` (for tiny 4px–6px height horizontal progress bars to avoid jagged inner ends).
3. **Status Pulse Indicators:** `rounded-full` (tiny 6px status indicator dots).

> [!CAUTION]
> **Prohibited Radii:**  
> Never use `rounded-xl`, `rounded-2xl`, `rounded-3xl`, or `rounded-lg` on items, containers, or inputs. Always apply `rounded-[6px]`.

---

## 4. Typography Scale & System Hierarchy

The typography system pairs **Plus Jakarta Sans** for expressive headings with **Geist** for crisp UI reading and **JetBrains Mono** for numerical telemetry, IDs, and statuses.

### 4.1 Font Family Declarations
```css
--font-headline: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: "Geist", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

### 4.2 Standard Typographic Scale (Dark Mode)

| Level | Size | Weight | Line Height | Tracking | Applied Element | Tailwind Classes |
|---|---|---|---|---|---|---|
| **Display Hero** | 24px (1.5rem) | 700 Bold | 32px | -0.025em | Main dashboard hero headers, auth banner | `text-2xl font-bold tracking-tight font-headline text-zinc-100` |
| **Page Title** | 20px (1.25rem) | 700 Bold | 28px | -0.02em | ViewsBar title, page top headers | `text-xl font-bold tracking-tight font-headline text-zinc-100` |
| **Section Header** | 15px (0.9375rem) | 600 Semi | 22px | -0.01em | Bento widget titles, modal titles, sidebar sections | `text-[15px] font-semibold text-zinc-100` |
| **Body / Primary UI** | 13px (0.8125rem) | 500 Medium | 18px | Normal | List titles, form inputs, primary nav labels, buttons | `text-[13px] font-medium text-zinc-200` |
| **Secondary / Subtitle** | 12px (0.75rem) | 400 Regular | 16px | Normal | Descriptions, table values, metadata, tooltips | `text-xs text-zinc-400` |
| **Caption / Micro** | 11px (0.6875rem) | 500 Medium | 14px | +0.01em | Timestamps, assignee tags, column headers | `text-[11px] text-zinc-500` |
| **Telemetry / Code** | 10px / 11px | 600 Semi | 14px | +0.05em | Task IDs (`TSK-104`), sync statuses, system telemetry | `font-mono text-[10px] uppercase font-bold tracking-wider text-orange-400` |
| **KPI Big Numbers** | 28px / 32px | 700 Bold | 36px | -0.03em | Bento metric card main values (e.g. `94%`, `18`, `$142K`) | `font-mono text-3xl font-bold tracking-tight text-zinc-100` |

---

## 5. Spacing System & Layout Baseline Grid

Backnode OS is built on a **4px geometric baseline grid**. All paddings, margins, gaps, and heights must be clean multiples of 4px (with 6px allowed for compact button/input internal paddings).

### 5.1 Spacing Scale

| Value | Tailwind Class | Semantic Usage |
|---|---|---|
| `2px` | `p-0.5` / `gap-0.5` | Hairline separators, tight badge padding |
| `4px` | `p-1` / `gap-1` | Micro gap between icon and text, tag internal padding |
| `6px` | `p-1.5` / `gap-1.5` | Standard compact button padding, item row padding |
| `8px` | `p-2` / `gap-2` | Nav link padding, small card gap, input padding |
| `12px` | `p-3` / `gap-3` | Compact widget interior padding, filter cluster spacing |
| `16px` | `p-4` / `gap-4` | Standard Bento card padding, view section gap |
| `20px` | `p-5` / `gap-5` | Large Bento card interior padding, dashboard grid gap |
| `24px` | `p-6` / `gap-6` | Main viewport canvas padding, modal interior padding |
| `32px` | `p-8` / `gap-8` | Outer page container margin, empty state container padding |

### 5.2 Key Fixed Component Heights & Widths

| Component | Dimension | Value | Notes |
|---|---|---|---|
| **Top Navigation Bar** | Height | `52px` | Fixed at top of viewport (`bg-[#0c0a09] border-b border-[#27272a]`) |
| **Views / Filter Bar** | Height | `44px` | Sub-header for views and filtering (`bg-[#121214] border-b border-[#27272a]`) |
| **Primary Sidebar** | Width | `220px` | Major hub items and workspace switcher (`bg-[#0c0a09] border-r border-[#27272a]`) |
| **Inner Sidebar** | Width | `240px` | Folders, Spaces, Pipelines, child views (`bg-[#121214] border-r border-[#27272a]`) |
| **Combined Nav Width** | Width | `460px` | When both sidebars are visible |
| **Standard Button** | Height | `32px` | `px-3 py-1.5 rounded-[6px]` |
| **Compact Button** | Height | `26px` | `px-2 py-1 rounded-[6px] text-xs` |
| **Form Input** | Height | `34px` | `px-2.5 py-1.5 rounded-[6px] text-[13px]` |
| **Table Row** | Height | `40px` | Single-line compact row with `px-3` |

---

## 6. Two-Tier Dual Sidebar Navigation Architecture

### 6.1 Architectural Rationale
Legacy single-sidebar systems attempt to cram workspaces, global apps, multi-level folders, lists, and context menus into one column using collapsing accordions. This causes cognitive overload, scroll jumps, and layout jitter.

Backnode OS resolves this with a **Dual Sidebar Architecture**:

```
+---------------------------------------------------------------------------------------------------------+
|                                  TopNavBar (h-52px, bg-[#0c0a09])                                       |
+-------------------+--------------------+----------------------------------------------------------------+
| Primary Sidebar   | Inner Sidebar      | Main Canvas Viewport (bg-[#09090b])                            |
| (220px fixed)     | (240px fixed)      | (calc(100vw - 460px))                                          |
| bg-[#0c0a09]      | bg-[#121214]       |                                                                |
|                   |                    | +------------------------------------------------------------+ |
| - Workspace Switch| - Hub Header + Add | | TaskSpaceViewsBar / FilterBar (h-44px, bg-[#121214])        | |
| - Major Hubs:     | - Search / Filter  | +------------------------------------------------------------+ |
|   * Overview      | - Folder 1         | |                                                            | |
|   * Task Spaces   |   > Space A        | | Dark Bento Grid Dashboard / Kanban Board / Deliverables    | |
|   * CRM Pipelines |   > Space B        | |                                                            | |
|   * Contacts      | - Folder 2         | | [Bento Cards: bg-[#121214], border-[#27272a], rounded-6px] | |
|   * Team          |   > Space C        | |                                                            | |
|   * Replication   | - Quick Dashboards | |                                                            | |
| - Settings        | - Collapse Toggle  | |                                                            | |
| - Operator Card   |                    | |                                                            | |
+-------------------+--------------------+----------------------------------------------------------------+
```

---

### 6.2 Primary Sidebar (Major Items Rail — `220px`)
- **Role:** Fast switching between high-level operational hubs and global identity.
- **Styling:**
  - Width: `w-[220px]`, fixed `h-screen`, `border-r border-[#27272a]`, `bg-[#0c0a09]`, `p-3.5 flex flex-col justify-between`.
- **Anatomy & Item Hierarchy:**
  1. **Workspace Switcher:** Compact header featuring workspace color badge (`rounded-[6px]`), organization name (`text-[13px] font-semibold text-zinc-100`), and role badge (`text-[11px] text-zinc-500 font-mono`). Clicking opens a `rounded-[6px] bg-[#121214] border border-[#27272a]` dropdown menu.
  2. **Primary Quick Action Button:** Full-width orange CTA button (`bg-orange-600 hover:bg-orange-700 text-white font-semibold text-[13px] py-1.5 px-3 rounded-[6px] shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]`).
  3. **Major Hub Navigation List:**
     - **Overview:** `dashboard` icon
     - **Task Spaces:** `folder_open` icon (triggers Inner Sidebar)
     - **CRM Pipelines:** `leaderboard` icon (triggers Inner Sidebar)
     - **Contacts Directory:** `contacts` icon
     - **Team & Access:** `group` icon
     - **Replication Telemetry:** `sync_saved_locally` icon
  4. **Active State Styling:**
     - Background: `bg-orange-950/40 border border-orange-500/30`
     - Text: `text-orange-400 font-semibold`
     - Icon: `text-orange-400`
     - Radius: `rounded-[6px]`
  5. **Inactive State Styling:**
     - Text: `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60`
     - Radius: `rounded-[6px]`
  6. **Bottom Rail Area:**
     - Global Settings item (`settings` icon).
     - System Sync status pill with emerald pulsing dot.
     - Operator Profile card (`rounded-[6px] hover:bg-zinc-900/60`).

---

### 6.3 Inner Sidebar (Sub-Navigation Rail — `240px`)
- **Trigger Condition:** Rendered automatically when `currentHub === 'task-spaces'` or `currentHub === 'crm'` (or any hub requiring sub-entity management).
- **Styling:**
  - Width: `w-[240px]`, fixed `h-screen`, `border-r border-[#27272a]`, `bg-[#121214]`, `p-3 flex flex-col justify-between`.
- **Task Spaces Inner Sidebar Contents:**
  1. **Header:** Title "Task Spaces" (`text-xs font-bold font-mono uppercase tracking-wider text-zinc-400`), folder count badge, and a `+ Folder` icon button (`rounded-[6px] hover:bg-orange-950/50 text-orange-400`).
  2. **Hub Quick-Link:** "All Spaces Dashboard" button (`rounded-[6px] text-xs text-zinc-300 hover:bg-zinc-900/80`).
  3. **Folder & Space Tree:**
     - Folder Header: Clean item with folder color tag, folder name (`text-[12px] font-semibold text-zinc-200`), child count, and `...` Action Context Menu trigger (`rounded-[6px]`).
     - Spaces inside folder: Cleanly indented sub-list. Active space receives `bg-orange-950/40 shadow-xs border border-orange-500/30 text-orange-400 font-semibold rounded-[6px]`.
  4. **CRM Pipelines Inner Sidebar Contents:**
     - Header: "Pipelines" (`text-xs font-bold font-mono uppercase text-zinc-400`) + `+ Pipeline` button.
     - Pipeline Items: Each pipeline with stages count, total deal value, and direct sub-views (Board, Table, Analytics, Settings) cleanly styled with `rounded-[6px]`.
  5. **Collapse Control:** A discreet collapse/expand button (`rounded-[6px] text-zinc-500 hover:text-zinc-200`) allowing operators to toggle the inner sidebar into a compact view to maximize canvas workspace.

---

## 7. Bento Grid Architecture for Dashboards

All dashboard surfaces (Workspace Overview, Task Space Dashboard, CRM Dashboard, Executive Cockpit, Replication HUD) **MUST** be structured using a **Bento Grid layout** on the dark canvas.

```
+---------------------------------------------------------------------------------------------------+
|  BENTO GRID CONTAINER (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#09090b])       |
+---------------------------------------------------------------------------------------------------+
| [1x1 KPI Tile: bg-[#121214]] | [1x1 KPI Tile: bg-[#121214]] | [2x1 Velocity Banner: bg-[#121214]] |
| Total Deliverables: 42      | Pending Review: 5            | SPRINT PROGRESS: 68%               |
| +12% vs last week           | 2 blockers flagged           | [==================-------] 18/26  |
+-----------------------------+------------------------------+------------------------------------+
| [2x2 Major Widget: Deliverables Triage Stream]             | [2x2 Major Widget: Stage Velocity] |
| - Header: Active Deliverables (Filter, Add)                | - Pipeline distribution breakdown  |
| - Item Row 1 (Priority, Assignee, Status)                  | - Win / Loss ratio KPI             |
| - Item Row 2 (Priority, Assignee, Status)                  | - Conversion telemetry             |
+------------------------------------------------------------+------------------------------------+
| [4x1 System Health & Database Telemetry Strip: bg-[#121214], border-[#27272a]]                    |
| PostgreSQL: Synced (4ms) | SQLite Local: Active | Tenant Isolation: 100% | Replicas: Nominal    |
+---------------------------------------------------------------------------------------------------+
```

### 7.1 Bento Tile Modular Sizing Specifications

| Tile Type | Col Span | Row Span | Typical Content |
|---|---|---|---|
| **Compact KPI Metric** | `col-span-1` | `row-span-1` | Single metric number (`text-2xl font-bold font-mono text-zinc-100`), label, trend badge, icon |
| **Progress / Dual KPI** | `col-span-2` | `row-span-1` | Sprint progress bar, stage velocity dual metric, comparative percentage |
| **Major Content Widget** | `col-span-2` | `row-span-2` | Active deliverables triage stream, recent activity, win/loss chart |
| **Wide Analysis Tile** | `col-span-3` | `row-span-2` | Interactive kanban mini-board, multi-stage pipeline flow, gantt snippet |
| **System HUD Banner** | `col-span-4` | `row-span-1` | Global health status, sync telemetry, quick workspace actions |

### 7.2 Anatomy of a Bento Card
Every Bento card must follow this precise structural anatomy:
1. **Container:** `bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/50 transition-all`.
2. **Card Header:**
   - Top label: `font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold`.
   - Card title: `text-[13px] font-semibold text-zinc-100`.
   - Auxiliary action / icon: Icon button (`w-6 h-6 rounded-[6px] text-zinc-400 hover:text-orange-400 hover:bg-orange-950/30`).
3. **Card Body:**
   - Primary metric: `font-mono text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight`.
   - Secondary comparison: `text-xs text-zinc-400 flex items-center gap-1`.
   - Interactive content: Clean dark lists, progress tracks, or kinetic rows.
4. **Card Footer (Optional):**
   - Micro action or status chip: `text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-orange-950/50 text-orange-400 font-semibold border border-orange-500/20`.

---

## 8. Component Specifications (Dark Theme)

### 8.1 Top Navigation Bar (`TopNavBar`)
- **Dimensions:** Height `h-[52px]`, `px-6`, `bg-[#0c0a09]`, `border-b border-[#27272a]`.
- **Search Bar:**
  - `bg-[#18181b] border border-[#27272a] focus:border-orange-500 focus:bg-[#121214] text-[13px] text-zinc-100 rounded-[6px] px-3 py-1.5 w-64 md:w-80 transition-all`.
  - Placeholder: `text-zinc-500 text-xs`.
  - Shortcut badge: `font-mono text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-[6px]`.
- **Primary CTA:** "+ New Item" button in brand orange (`bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[6px] shadow-sm`).
- **Telemetry Indicators:** Local sync badge with emerald pulse dot (`bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-[6px]`).
- **Action Icons:** Notification bell, help icon, command palette launcher (`rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800`).
- **Profile Popover:** Operator avatar (`rounded-full`) with dropdown menu (`rounded-[6px] bg-[#121214] border border-[#27272a] shadow-2xl`).

---

### 8.2 Views & Filter Bar (`TaskSpaceViewsBar`)
- **Dimensions:** Height `h-[44px]`, `px-6`, `bg-[#121214]`, `border-b border-[#27272a]`.
- **View Switcher Tabs:**
  - Icons + Labels for `List`, `Board`, `Table`, `Timeline`, `Calendar`, `Dashboard`.
  - Active Tab: `text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20 rounded-t-[6px]`.
  - Inactive Tab: `text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40`.
- **Filter Pills Cluster:**
  - Priority filter, Status filter, Assignee filter.
  - Active filter pill: `bg-orange-950/50 text-orange-400 border border-orange-500/40 font-semibold text-xs px-2.5 py-1 rounded-[6px]`.
  - Inactive filter pill: `bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-xs px-2.5 py-1 rounded-[6px]`.
- **Count Badges:** `font-mono text-[10px] px-1.5 py-0.5 rounded-[6px] bg-zinc-800 text-zinc-300 font-bold`.

---

### 8.3 Buttons & Interactive Triggers

| Variant | Tailwind Classes | Usage |
|---|---|---|
| **Primary Orange** | `bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[6px] shadow-sm transition-all active:scale-[0.98]` | Main actions: Save, Create, Submit, Confirm |
| **Secondary Dark** | `bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 font-semibold text-xs px-3 py-1.5 rounded-[6px] transition-all` | Cancel, Filter toggles, View switches |
| **Ghost Button** | `bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs px-2.5 py-1.5 rounded-[6px] transition-all` | Auxiliary actions, table actions, row buttons |
| **Destructive Button**| `bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[6px] shadow-sm transition-all` | Delete, Disconnect, Remove, Terminate |
| **Icon Button** | `w-7 h-7 flex items-center justify-center rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all` | Toolbar controls, pagination, menu triggers |

---

### 8.4 Form Inputs & Dropdowns
- **Text Inputs / Textareas:**
  - `bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-500`.
- **Selects:**
  - Same border and radius as text inputs, with orange hover border `hover:border-orange-500/50`.
- **Context Menus & Popovers:**
  - `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-1.5 min-w-[160px] z-50 animate-in fade-in zoom-in-95 duration-100`.
  - Item row: `px-2.5 py-1.5 text-xs text-zinc-300 hover:text-orange-400 hover:bg-orange-950/30 rounded-[6px] cursor-pointer flex items-center gap-2`.

---

### 8.5 Modal Windows & Overlays
- **Backdrop:** `fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4`.
- **Modal Window Container:**
  - `bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150`.
- **Modal Header:** Title in `text-lg font-bold text-zinc-100 font-headline`, subtitle in `text-xs text-zinc-400`.
- **Modal Footer:** Action cluster with `rounded-[6px]` buttons aligned right.

---

### 8.6 Tables & Lists (`DeliverablesTableView`, `ListView`)
- **Table Container:** `border border-[#27272a] rounded-[6px] overflow-hidden bg-[#121214] shadow-sm`.
- **Header Row:** `bg-[#18181b] border-b border-[#27272a] text-[11px] font-mono uppercase text-zinc-400 font-semibold px-3 py-2`.
- **Data Rows:**
  - Height: `40px` (or `48px` comfortable).
  - Hover: `hover:bg-zinc-800/40 transition-colors`.
  - Selected state: `bg-orange-950/30 border-l-2 border-orange-500`.
  - Cells: `px-3 py-2 text-xs text-zinc-200`.

---

## 9. Animation, Kinetic Motion & Micro-Interactions

1. **Active Feedback:** All interactive clickable buttons and pills use `active:scale-[0.98]` for tactile physical response.
2. **Durations & Easings:**
   - Quick UI transitions (hover, color change): `duration-150 ease-out`.
   - Drawer / Modal reveal: `duration-200 ease-out`.
   - Layout reflow: `transition-all duration-200 ease-in-out`.
3. **Scrollbars:**
   - All scrollable panes must use the `.custom-scrollbar` class:
     - Track: transparent
     - Thumb: `rgba(255, 255, 255, 0.12)` with hover to `rgba(249, 115, 22, 0.4)`
     - Thumb border radius: `rounded-[6px]`

---

## 10. Design Token Cheat Sheet for Quick Reference

```
/* ---------------------------------------------------- */
/* BACKNODE OS FULL DARK DESIGN TOKEN CHEAT SHEET       */
/* ---------------------------------------------------- */

-- Primary Brand:          #ea580c (orange-600)
-- Brand Accent:           #f97316 (orange-500)
-- Brand Hover:            #c2410c (orange-700)
-- Brand Surface Subtle:   rgba(234, 88, 12, 0.15) (bg-orange-950/40)
-- Brand Border Subtle:    rgba(249, 115, 22, 0.35)

-- Global Canvas Bg:       #09090b (pure obsidian pitch black)
-- Primary Surface:        #121214 (card bodies, popovers, modals)
-- Secondary Surface:      #18181b (header bars, search inputs)
-- Rail Surface:           #0c0a09 (major sidebar rail)

-- Text Primary:           #f4f4f5 (zinc-100)
-- Text Secondary:         #a1a1aa (zinc-400)
-- Text Muted:             #71717a (zinc-500)
-- Border Default:         #27272a (zinc-800)
-- Border Hover:           #3f3f46 (zinc-700)

-- Border Radius (STRICT): 6px (rounded-[6px])
-- Primary Sidebar Width:  220px
-- Inner Sidebar Width:    240px
-- TopNavBar Height:       52px
-- ViewsBar Height:        44px
-- Dashboard Grid:         Bento Grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4)
```
