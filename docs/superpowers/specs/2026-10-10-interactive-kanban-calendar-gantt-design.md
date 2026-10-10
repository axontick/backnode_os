# Interactive Kanban, Calendar, and Gantt Mouse Functionalities Specification

**Date:** 2026-10-10  
**Status:** Approved  
**Topic:** Kanban Drag-and-Drop, Calendar Mouse Engine & Rescheduling, Gantt Timeline Drag & Resize  
**Design Standard:** Strict adherence to [`design.md`](file:///D:/Work/Personal/backnode-os/design.md) (Obsidian Black `#09090b`, `#121214`, Electric Orange `#ea580c` / `#f97316`, `rounded-[6px]`)

---

## 1. Executive Summary & Goals

This specification defines the mouse interaction and drag-and-drop systems for the primary execution views in Backnode OS:
1. **Kanban Board (`KanbanBoard.tsx`)**:
   - Full drag-and-drop support: reorder tasks within columns and move tasks between status columns.
   - Sharp Electric Orange visual drop insertion indicator lines (`border-t-2 border-orange-500` / `border-b-2`).
   - Smooth drag states, hover cues, and instant status/index persistence.
2. **Monthly Calendar View (`MonthlyCalendarView.tsx`)**:
   - Dynamic month navigation engine (previous/next month buttons `<` and `>`, "Today" reset).
   - Mouse drag-and-drop rescheduling: pick up tasks and drop onto any day cell to immediately update due dates.
   - Click-to-create on empty day cells to open task creation pre-filled with that date.
   - Viewport-clamped floating detail inspector on card hover.
3. **Gantt Timeline View (`GanttTimelineView.tsx`)**:
   - Interactive bar manipulation engine:
     - Drag bar body to shift start and due dates horizontally with grid-snapping.
     - Drag left edge handle to extend/trim start date.
     - Drag right edge handle to extend/trim due date (duration).
   - Empty grid cell click to create a task mapped to that timeline day.
   - Reactive zoom scales ('days', 'weeks', 'months') adjusting day column widths.

---

## 2. Architecture & Data Contracts

### 2.1 Date Normalization Helper (`packages/frontend/src/utils/dateUtils.ts`)
A dedicated date utility to handle uniform serialization, parsing, and day arithmetic without external dependencies:
- `formatDateIso(date: Date): string` $\rightarrow$ `YYYY-MM-DD`
- `formatDateDisplay(date: Date): string` $\rightarrow$ `MMM D, YYYY` (e.g. `Oct 18, 2026`)
- `parseTaskDueDate(dueDateStr?: string, fallbackDate?: Date): Date`
- `addDays(date: Date, days: number): Date`
- `getDaysInMonth(year: number, monthIndex: number): number`
- `generateMonthGrid(year: number, monthIndex: number): CalendarGridCell[]`

### 2.2 Task Persistence & Workspace Context Extensions
- **`handleMoveTaskStatus(taskId: string, newStatus: TaskStatus, targetIndex?: number)`**:
  - Updates task status and array index in local React state.
  - Calls `tasksApi.update(taskId, { status: newStatus, targetCycle: ... })` to persist immediately to PostgreSQL.
- **`handleUpdateTask(task: TaskItem)`**:
  - Persists updated `dueDate`, `estimation`, or metadata to both state and backend API.

---

## 3. Component Specifications

### 3.1 Kanban Board (`KanbanBoard.tsx`)
* **State**:
  * `draggingTaskId: string | null`
  * `dropIndicator: { columnStatus: TaskStatus; targetTaskId: string; position: 'before' | 'after' } | null`
  * `dragOverColumn: TaskStatus | null`
* **Interaction Flow**:
  1. **Drag Start (`onDragStart`)**:
     * Sets `draggingTaskId`.
     * Card enters drag visual mode: `opacity-40 scale-[0.98] ring-1 ring-orange-500/40`.
  2. **Drag Over Card (`onDragOver`)**:
     * Calculates mouse $Y$ relative to target card bounding rectangle:
       * If $Y < \text{cardHeight} / 2$: shows insertion indicator `position: 'before'`.
       * If $Y \ge \text{cardHeight} / 2$: shows insertion indicator `position: 'after'`.
     * Prevents default to allow drop.
  3. **Drag Over Column (`onDragOver` on column container)**:
     * If hovering over empty column or bottom padding, sets `dragOverColumn`.
  4. **Drop (`onDrop`)**:
     * Determines target column and target index.
     * Reorders array or moves between columns.
     * Resets drag states.

### 3.2 Monthly Calendar View (`MonthlyCalendarView.tsx`)
* **State**:
  * `currentDate: Date` (defaults to current date or October 2026 base).
  * `draggedTaskId: string | null`
  * `dragOverDayKey: string | null`
  * `hoveredTask: TaskItem | null`
  * `hoverPosition: { x: number; y: number } | null`
* **Interaction Flow**:
  1. **Navigation Controls**:
     * Clicking `<` subtracts 1 month from `currentDate`.
     * Clicking `>` adds 1 month to `currentDate`.
     * Clicking `Today` sets `currentDate` to `new Date()`.
  2. **Drag-and-Drop Rescheduling**:
     * Tasks in cells have `draggable="true"`, triggering `onDragStart`.
     * Each day cell implements `onDragOver` (preventDefault + set `dragOverDayKey`) and `onDragLeave`.
     * Day cell `onDrop`: parses the target cell's date, updates `task.dueDate`, calls `handleUpdateTask`.
     * Dropped cell shows positive visual feedback (`border-orange-500 bg-orange-950/30`).
  3. **Click on Day**:
     * Clicking an empty cell space calls `onOpenCreateTask(cellDateStr)`.
  4. **Hover Inspector**:
     * Hovering over task pill opens fixed card clamped to viewport boundaries.

### 3.3 Gantt Timeline View (`GanttTimelineView.tsx`)
* **State**:
  * `zoomScale: 'days' | 'weeks' | 'months'`
  * `columnWidth: number` (60px for days, 45px for weeks, 25px for months).
  * `dragSession: { taskId: string; mode: 'move' | 'resize-left' | 'resize-right'; initialMouseX: number; initialLeftPx: number; initialWidthPx: number; currentLeftPx: number; currentWidthPx: number } | null`
* **Interaction Flow**:
  1. **Mouse Down on Handle / Bar**:
     * Body `onMouseDown`: initializes `mode: 'move'`.
     * Left handle `onMouseDown`: initializes `mode: 'resize-left'`.
     * Right handle `onMouseDown`: initializes `mode: 'resize-right'`.
     * Binds global `window.addEventListener('mousemove')` and `window.addEventListener('mouseup')`.
  2. **Active Drag (`mousemove`)**:
     * Computes $\Delta X = \text{currentMouseX} - \text{initialMouseX}$.
     * Snaps to increments of `columnWidth`.
     * Clamps minimum width to 1 day.
     * Updates `currentLeftPx` and `currentWidthPx` for real-time visual feedback.
  3. **Mouse Up (`mouseup`)**:
     * Unbinds window listeners.
     * Computes final start day and end day based on snapped pixel position.
     * Derives new `dueDate` string (and estimation).
     * Commits change via `handleUpdateTask`.
  4. **Click on Timeline Grid**:
     * Clicking an empty day column in a task row opens task creation or selects the date.

---

## 4. Visual & Token Compliance ([`design.md`](file:///D:/Work/Personal/backnode-os/design.md))
- Canvas: `#09090b` (`bg-[#09090b]`).
- Elevated Cards / Surfaces: `#121214` and `#18181b`.
- Dark Borders: `#27272a`.
- Primary Accents: `#ea580c` (Electric Orange) and `#f97316`.
- Border Radius: Strict `rounded-[6px]` on all pills, cards, handles, and containers.
- Typography: Headings in `font-headline`, UI in `font-body`, dates and metrics in `font-mono`.

---

## 5. Verification & Testing Plan
1. **Kanban Drag-and-Drop**:
   - Drag card within same column: verify reorder insertion indicator appears above/below target card and card repositions correctly.
   - Drag card across columns: verify card moves to new column and status updates in state and backend API.
2. **Monthly Calendar**:
   - Click `<` and `>`: verify calendar changes months with correct days and weekday alignments.
   - Click `Today`: verify jump to current month.
   - Drag task to another day: verify `dueDate` is updated and reflected in UI and inspector.
   - Click day cell: verify task creation modal opens.
3. **Gantt Chart**:
   - Drag bar body: verify bar slides horizontally and snaps to day columns; on release, due date is updated.
   - Drag left handle: verify start position shifts while right edge stays pinned.
   - Drag right handle: verify duration expands/contracts and due date is updated.
4. **Build & Type Check**:
   - Execute `yarn build` across frontend and backend packages to confirm zero TypeScript regressions.
