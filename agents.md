# BACKNODE OS — AGENTS INSTRUCTIONS & DESIGN DIRECTIVE (`agents.md`)

> **MANDATORY INSTRUCTION FOR ALL AI AGENTS & CODING ASSISTANTS**  
> Whenever making any changes, adjusting layout, updating the layout, creating new UI items, or refactoring existing components in this repository, you **MUST** refer to and strictly follow [`design.md`](file:///D:/Work/Personal/backnode-os/design.md).

---

## 1. Prime Directive: Strict Adherence to `design.md`

All visual, layout, and component development in Backnode OS is governed by the canonical design specification located at:
👉 **[`design.md`](file:///D:/Work/Personal/backnode-os/design.md)**

Never introduce arbitrary styling, guesswork colors, inconsistent border radii, or ad-hoc layout systems. Every UI change must conform to the design tokens and structural patterns defined in `design.md`.

---

## 2. Core Non-Negotiables & Invariants

When working on any frontend component or view (`packages/frontend/src/`):

### 1. Full Dark Theme: Obsidian Black & Electric Orange System
* **Global Canvas:** Pure obsidian pitch black `#09090b` (`bg-[#09090b]` / `bg-zinc-950`).
* **Card & Panel Surfaces:** Deep obsidian `#121214` (`bg-[#121214]`), elevated panels `#18181b` (`bg-zinc-900`), and rail surface `#0c0a09`.
* **Primary Brand Orange:** `#ea580c` (Tailwind `orange-600` / `bg-orange-600` / `text-orange-600`) for primary action buttons, active states, active tab underlines, and key accents.
* **Secondary / Vibrant Orange Accent:** `#f97316` (Tailwind `orange-500`) for badges, alert dots, notification pings, and hover icons.
* **Dark Orange Surfaces & Tints:** `rgba(234, 88, 12, 0.15)` (`bg-orange-950/40`) for active sidebar item highlights, selected table rows, and soft chips.
* **Dark Borders:** `#27272a` (`border-[#27272a]` / `border-zinc-800`), with `#3f3f46` on hover.
* **Typography:** `#f4f4f5` (`text-zinc-100`) for primary text, `#a1a1aa` (`text-zinc-400`) for secondary text, `#71717a` (`text-zinc-500`) for muted captions.
* **Banned Colors:** NEVER use legacy purple/violet tokens (`#9900c2`, `#b731e0`, `#f4f2fd`, `#eeedf7`, `#d4c0d5`, `#fbd7ff`, `#330043`). Replace them with the Obsidian Black and Electric Orange tokens defined in `design.md`.

### 2. Strict 6px Border Radius Standard (`rounded-[6px]`)
* Every card, item, widget, button, form input, modal, dropdown menu, popover, filter pill, tab, and badge **MUST use `rounded-[6px]`** (or `border-radius: 6px;`).
* **Banned Radii:** Do NOT use `rounded-lg`, `rounded-xl`, `rounded-2xl`, or `rounded-3xl` on any items, containers, or inputs.
* **Permitted Exceptions:**
  - User avatars: `rounded-full` (circular profile photos or letter avatars).
  - Horizontal progress bar tracks: `rounded-full` (4px–6px height pill bars).
  - Telemetry / status pulse dots: `rounded-full` (6px–8px indicator dots).

### 3. Dual-Tier Sidebar Navigation Architecture
* **Primary Sidebar (Major Items Rail — 220px):**
  - Styled in `#0c0a09` with border `#27272a`.
  - Houses the Workspace Switcher, Primary "+ New Item" Orange CTA, and top-level navigation hubs:
    - Overview (`dashboard`)
    - Task Spaces (`folder_open`)
    - CRM Pipelines (`leaderboard`)
    - Contacts Directory (`contacts`)
    - Team & Access (`group`)
    - Replication Telemetry (`sync_saved_locally`)
    - Settings (`settings`) and Operator Profile.
* **Inner Sidebar (Sub-Navigation Rail — 240px):**
  - Styled in `#121214` with border `#27272a`.
  - Whenever a major hub has an inner list hierarchy (such as Folders and Spaces in **Task Spaces**, or Pipelines and Views in **CRM Pipelines**), display a dedicated **Inner Sidebar** rather than a single sidebar cluttered with collapsible dropdown accordions.
  - The Inner Sidebar displays folders, spaces, pipelines, and direct child views with dedicated search, "+ Folder" / "+ Pipeline" triggers, and clean un-nested styling.
  - The Inner Sidebar can be collapsed via a toggle button to yield maximum canvas width.

### 4. Bento Grid for All Dashboard Layouts
* All dashboard views (`OverviewView`, `TaskSpaceDashboardView`, `CrmDashboardView`, `ExecutiveCockpitView`, `ReplicationHudView`) **MUST** use a **Bento Grid** structure:
  - Container: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` (or `gap-5`) on canvas `#09090b`.
  - Modular item spans:
    - `col-span-1 row-span-1`: Compact KPI metric card.
    - `col-span-2 row-span-1`: Progress banner / dual stat tile.
    - `col-span-2 row-span-2`: Major content widget (triage stream, activity list, chart).
    - `col-span-3 row-span-2`: Deep operational analysis widget.
    - `col-span-4 row-span-1`: System health / telemetry banner.
* Every Bento card must feature:
  - Container with `bg-[#121214] border border-[#27272a] rounded-[6px] p-4 shadow-sm hover:border-orange-500/50 transition-all`.
  - Uppercase monospace category tag (`font-mono text-[10px] text-zinc-400 uppercase tracking-wider`).
  - Clear section title (`text-[13px] font-semibold text-zinc-100`).
  - Bold KPI number (`font-mono text-2xl md:text-3xl font-bold text-zinc-100`).

### 5. Consistent Spacing & Typography Hierarchy
* Adhere strictly to the 4px baseline spacing grid (`gap-1`, `gap-2`, `gap-3`, `gap-4`, `p-3`, `p-4`, `p-6`).
* Top Navigation Bar height: `h-[52px]` (`bg-[#0c0a09] border-b border-[#27272a]`).
* Filter & Views Bar height: `h-[44px]` (`bg-[#121214] border-b border-[#27272a]`).
* Standard Button height: `32px` (`px-3 py-1.5 rounded-[6px] text-xs font-semibold`).
* Form Input height: `34px` (`px-2.5 py-1.5 rounded-[6px] text-[13px] bg-[#18181b] border-[#27272a] text-zinc-100 focus:border-orange-500`).
* Headings: `font-headline` (Plus Jakarta Sans).
* Body & UI: `font-body` (Geist).
* Numerical Metrics & IDs: `font-mono` (JetBrains Mono).

---

## 3. Pre-Flight Checklist for UI Changes

Before writing or submitting any UI code, verify your implementation against this checklist:

| Checkpoint | Requirement | Verified? |
|---|---|:---:|
| **1. Consulted `design.md`** | Did you read `design.md` for specific tokens, layout rules, and component specs? | [ ] |
| **2. Color Palette** | Are backgrounds pure obsidian black (`#09090b`), surfaces `#121214`, borders `#27272a`, and primary accents `#ea580c` / `#f97316`? (Zero purple `#9900c2`) | [ ] |
| **3. Border Radius** | Are all cards, buttons, inputs, pills, popovers, and dialogs using `rounded-[6px]`? (No `rounded-xl` or `rounded-2xl`) | [ ] |
| **4. Layout Architecture** | If working on navigation, does it follow the Two-Tier Sidebar layout (no nested accordion clutter in primary rail)? | [ ] |
| **5. Dashboard Structure** | If building or updating a dashboard, does it use the Bento Grid arrangement with appropriate column spans? | [ ] |
| **6. Typography & Spacing** | Are font sizes, line heights, and padding clean tokens from the 4px grid? | [ ] |

---

## 4. Architectural Overview & Workspaces

Backnode OS is structured as a monorepo:
* **`packages/frontend`**: React 19, Vite, Tailwind CSS v4, Lucide icons, Material Symbols.
* **`packages/backend`**: NestJS REST API, Prisma ORM, PostgreSQL connection.
* **`packages/shared`**: Shared TypeScript types, interfaces, seed schemas.

When creating new items or data structures:
1. Define shared TypeScript interfaces in `packages/shared/src/types.ts`.
2. Follow existing API service patterns in `packages/frontend/src/services/api.ts`.
3. Keep context clean in `packages/frontend/src/context/WorkspaceContext.tsx`.

---

## 5. Summary Reference

Whenever in doubt, **[`design.md`](file:///D:/Work/Personal/backnode-os/design.md)** is the single source of truth. Always preserve and enforce these rules.
