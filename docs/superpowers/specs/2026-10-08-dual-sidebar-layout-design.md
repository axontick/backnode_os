# Dual-Tier Sidebar Navigation System Design Specification

## Overview
This specification details the transition of Backnode OS from a single fixed monolithic sidebar to a modern Two-Tier Dual Sidebar Navigation Architecture in accordance with [`design.md`](file:///D:/Work/Personal/backnode-os/design.md) Section 6.

The architecture provides:
1. **Primary Sidebar (Major Items Rail):** Fast switching across top-level organizational hubs (Overview, Task Spaces, CRM Pipelines, Contacts, Team & Access, Replication Telemetry), Workspace Switcher, Primary "+ New Item" CTA, Quick Actions (⌘K), Settings, and Collapse toggle.
   - **Expanded State:** `w-[220px]`, background `#0c0a09`, stone border `#27272a`.
   - **Collapsed State (Icon Rail):** `w-[60px]`, centered icon buttons with tooltip descriptions.
2. **Inner Sidebar (Sub-Navigation Rail):** Automatically activates when a major hub has hierarchical sub-entities (Task Spaces and CRM Pipelines).
   - **Expanded State:** `w-[240px]`, background `#121214`, stone border `#27272a`.
   - **Collapsible Control:** Can be collapsed via a toggle button to an unobtrusive vertical edge rail (28px) or hidden to grant full viewport width to the main canvas.
3. **Fluid Layout Architecture:** Eliminates legacy hardcoded fixed margins (`ml-[280px]`) in [`DashboardLayout.tsx`](file:///D:/Work/Personal/backnode-os/packages/frontend/src/layouts/DashboardLayout.tsx), utilizing a CSS flexbox hierarchy that adapts smoothly to sidebar expand/collapse states.

---

## Visual Design & Design Token Directives

Strictly conforming to [`design.md`](file:///D:/Work/Personal/backnode-os/design.md):
- **Surfaces:**
  - Primary Sidebar: `#0c0a09` (`surface-rail`)
  - Inner Sidebar: `#121214` (`surface-primary`)
  - Canvas: `#09090b` (`canvas-bg`)
  - Borders: `#27272a` (`border-default`)
- **Accents:**
  - Primary Brand Orange: `#ea580c` (`bg-orange-600` / `text-orange-600`)
  - Vibrant Orange: `#f97316` (`orange-500`)
  - Subtle Highlight Tint: `rgba(234, 88, 12, 0.15)` (`bg-orange-950/40`) with border `rgba(249, 115, 22, 0.3)` (`border-orange-500/30`)
- **Geometry:** Strict `rounded-[6px]` on every card, item, button, modal, dropdown, and input. Avatars: `rounded-full`.
- **Zero Legacy Purple:** Completely free of purple/violet tokens.

---

## Component Architecture

```
+---------------------------------------------------------------------------------------------------------------+
| DashboardLayout (h-screen w-screen flex overflow-hidden bg-[#09090b])                                          |
|                                                                                                               |
| +-------------------+--------------------+------------------------------------------------------------------+ |
| | PrimarySidebar    | InnerSidebar       | Main Viewport Column (flex-1 flex flex-col h-screen min-w-0)     | |
| |                   |                    |                                                                  | |
| | [Expanded 220px   | [Expanded 240px    | +--------------------------------------------------------------+ | |
| |  / Collapsed 60px]|  / Collapsed 28px] | | TopNavBar (h-14 bg-[#0c0a09] border-b border-[#27272a])       | | |
| |                   |                    | +--------------------------------------------------------------+ | |
| | - Workspace       | - Hub Header + CTA | | ViewsBar / FilterBar (TaskSpaceViewsBar / Crm views)          | | |
| | - "+ New Item"    | - Hub Quick Link   | +--------------------------------------------------------------+ | |
| | - Major Hubs:     | - Tree Hierarchy   | | Page Content (Bento Dashboard, Kanban, List, Table, etc.)    | | |
| |   * Overview      |   * Folders/Spaces | |                                                              | | |
| |   * Task Spaces   |   * Pipelines/Views| |                                                              | | |
| |   * CRM Pipelines | - Collapse Toggle  | |                                                              | | |
| |   * Contacts      |                    | |                                                              | | |
| |   * Team          |                    | |                                                              | | |
| |   * Replication   |                    | |                                                              | | |
| | - Settings / ⌘K   |                    | |                                                              | | |
| | - Collapse Rail   |                    | |                                                              | | |
| +-------------------+--------------------+------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
```

---

## Detailed Specifications

### 1. `PrimarySidebar.tsx`
* **Location:** `packages/frontend/src/components/PrimarySidebar.tsx`
* **Props:**
  - `currentHub`: `string`
  - `onSelectHub`: `(hub: string) => void`
  - `onOpenNewItem`: `() => void`
  - `onOpenCommandPalette`: `() => void`
  - `isCollapsed`: `boolean`
  - `onToggleCollapse`: `() => void`
  - Workspace Context integration: `userSpaces`, `activeUserSpace`, `handleSelectUserSpace`, `handleCreateUserSpace`, `members`, `user`.
* **Behavior:**
  - When `isCollapsed === false` (`w-[220px]`):
    - Full workspace picker dropdown with organization name, operator role, member count, and creation form.
    - Full "+ New Item" button with text label.
    - Full-width hub navigation buttons with icons, labels, and badges.
    - Bottom quick actions (⌘K), settings trigger, and collapse button with `chevron_left` icon.
  - When `isCollapsed === true` (`w-[60px]`):
    - Compact 36x36 workspace letter avatar button (opens dropdown popover when clicked).
    - Compact 36x36 "+" orange button.
    - Centered 40x40 hub icon buttons with hover tooltip indicating hub name.
    - Active hub indicated by orange background highlight (`bg-orange-950/40 text-orange-400 border border-orange-500/30 rounded-[6px]`).
    - Bottom settings icon button, ⌘K icon button, and expand button with `chevron_right` icon.

### 2. `InnerSidebar.tsx`
* **Location:** `packages/frontend/src/components/InnerSidebar.tsx`
* **Props:**
  - `currentHub`: `'task-spaces' | 'crm'`
  - `isCollapsed`: `boolean`
  - `onToggleCollapse`: `() => void`
  - **Task Spaces mode:**
    - `folders`: `SpaceFolder[]`
    - `activeSpace`: `string`
    - `currentView`: `string`
    - `onSelectSpace`: `(spaceId: string) => void`
    - `onSelectDashboard`: `() => void`
    - `onOpenAddFolder`: `() => void`
    - `onEditFolder`: `(folder: SpaceFolder) => void`
    - `onDeleteFolder`: `(folder: SpaceFolder) => void`
  - **CRM mode:**
    - `pipelines`: `CrmPipeline[]`
    - `activePipelineId`: `string`
    - `crmView`: `string`
    - `onSelectPipeline`: `(pipelineId: string) => void`
    - `onSelectCrmDashboard`: `() => void`
    - `onSelectPipelineView`: `(pipelineId: string, view: 'board' | 'analytics' | 'settings') => void`
    - `onOpenAddPipeline`: `() => void`
    - `onEditPipeline`: `(pipeline: CrmPipeline) => void`
    - `onDeletePipeline`: `(pipeline: CrmPipeline) => void`
* **Behavior:**
  - When `isCollapsed === false` (`w-[240px]`):
    - Sub-header with uppercase mono label (`TASK SPACES` / `PIPELINES`), total count badge, `+` button, and collapse trigger button (`chevron_left` or `dock_to_right`).
    - Hub Dashboard button (`Spaces Dashboard` / `CRM Dashboard`).
    - Search / filter input for quick entity filtering.
    - Tree listing:
      - For Task Spaces: Folders with color indicators, count, 3-dots action menu (`ActionContextMenu`), and nested spaces with active selection highlight.
      - For CRM: Pipelines with stage counts, 3-dots action menu, and nested sub-views (Board, Win/Loss Analytics, Settings) when active.
  - When `isCollapsed === true`:
    - Slim 28px vertical rail with a centered expand button (`chevron_right`) and rotated label (`Task Spaces` / `CRM Pipelines`) allowing one-click restore.

### 3. `DashboardLayout.tsx`
* Update state:
  - `isPrimarySidebarCollapsed`: `boolean` (persisted in `localStorage` key `'backnode_primary_sidebar_collapsed'`).
  - `isInnerSidebarCollapsed`: `boolean` (persisted in `localStorage` key `'backnode_inner_sidebar_collapsed'`).
* Conditional rendering:
  - Primary Sidebar is always rendered.
  - Inner Sidebar is rendered when `currentHub === 'task-spaces' || currentHub === 'crm'`.
  - Main viewport occupies `flex-1 min-w-0 flex flex-col h-screen overflow-hidden`.
* Keyboard shortcut:
  - `⌘[` or `Ctrl+[` toggles primary sidebar collapse.
  - `⌘]` or `Ctrl+]` toggles inner sidebar collapse (when inner sidebar is active).

---

## Verification & Acceptance Criteria
1. Frontend compiles with zero TypeScript / build errors (`yarn build:frontend`).
2. Primary Sidebar renders at `220px` and collapses down to `60px` icon rail with full tooltip support and smooth transitions.
3. Inner Sidebar renders at `240px` when in Task Spaces or CRM Pipelines hubs, displaying folders/spaces or pipelines/views.
4. Inner Sidebar can be collapsed and expanded independently without breaking the canvas layout.
5. In single-level hubs (Overview, Contacts, Team, Replication), the inner sidebar disappears cleanly, expanding the main canvas to fill available space.
6. All interactions (workspace switcher, item creation, folder/pipeline CRUD, context menus, navigation switching) continue functioning properly.
7. Strict adherence to [`design.md`](file:///D:/Work/Personal/backnode-os/design.md) (Full Dark Obsidian & Electric Orange, 6px radii, zero purple).
