# Interactive Kanban, Calendar, and Gantt Mouse Functionalities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver full mouse interaction and drag-and-drop capabilities across Backnode OS: in-column reordering and cross-column status transfers with visual insertion indicators in Kanban, month navigation and drag-to-reschedule with click-to-create in Calendar, and day-snapping bar translation and edge-resizing in Gantt.

**Architecture:** Native HTML5 Drag & Drop API for Kanban and Calendar paired with a precision pointer coordinate tracker for Gantt handles, backed by a unified date utility (`dateUtils.ts`) that guarantees clean serialization and immediate synchronization to React state and backend API.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, HTML5 Drag and Drop API, Pointer/Mouse Events API, Vitest / Node test runner.

---

### File Map
- **Create:** `packages/frontend/src/utils/dateUtils.ts` (Date math, formatting, parsing, month grid generator)
- **Create:** `packages/frontend/src/utils/dateUtils.test.ts` (Unit tests for date math & formatting)
- **Modify:** `packages/frontend/src/context/WorkspaceContext.tsx` (Expose `handleReorderTasks` and verify `handleMoveTaskStatus` index insertion)
- **Modify:** `packages/frontend/src/components/KanbanBoard.tsx` (Card reordering, drop indicator line rendering, drag styling)
- **Modify:** `packages/frontend/src/components/MonthlyCalendarView.tsx` (Dynamic month state, `<` / `>` / `Today`, day cell drag-and-drop, click-to-create)
- **Modify:** `packages/frontend/src/components/GanttTimelineView.tsx` (Mouse drag bar translation, left/right handle resize, zoom scale widths, click-to-create)

---

### Task 1: Date Normalization & Calendar Arithmetic Utility

**Files:**
- Create: `packages/frontend/src/utils/dateUtils.ts`
- Create: `packages/frontend/src/utils/dateUtils.test.ts`

- [ ] **Step 1: Write the unit tests for date utilities**

```typescript
// packages/frontend/src/utils/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatDateIso,
  formatDateDisplay,
  parseTaskDueDate,
  addDays,
  getDaysInMonth,
  generateMonthGrid,
} from './dateUtils';

describe('dateUtils', () => {
  it('formats Date to ISO string YYYY-MM-DD', () => {
    const d = new Date(2026, 9, 14); // Oct 14, 2026
    expect(formatDateIso(d)).toBe('2026-10-14');
  });

  it('formats Date to Display string MMM D, YYYY', () => {
    const d = new Date(2026, 9, 14);
    expect(formatDateDisplay(d)).toBe('Oct 14, 2026');
  });

  it('parses various dueDate formats into Date', () => {
    const d1 = parseTaskDueDate('2026-10-18');
    expect(d1.getFullYear()).toBe(2026);
    expect(d1.getMonth()).toBe(9);
    expect(d1.getDate()).toBe(18);

    const d2 = parseTaskDueDate('Oct 18, 2026');
    expect(d2.getFullYear()).toBe(2026);
    expect(d2.getMonth()).toBe(9);
    expect(d2.getDate()).toBe(18);
  });

  it('generates a 35-cell or 42-cell calendar grid for a given month', () => {
    const grid = generateMonthGrid(2026, 9); // October 2026
    expect(grid.length).toBeGreaterThanOrEqual(35);
    const oct1 = grid.find((cell) => cell.isCurrentMonth && cell.dayNumber === 1);
    expect(oct1).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @backnode/frontend test dateUtils.test.ts`
Expected: FAIL with module not found `dateUtils`.

- [ ] **Step 3: Implement `dateUtils.ts`**

```typescript
// packages/frontend/src/utils/dateUtils.ts

export interface CalendarGridCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function parseTaskDueDate(dueDateStr?: string, fallbackDate: Date = new Date()): Date {
  if (!dueDateStr) return new Date(fallbackDate);

  // If already standard ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr.trim())) {
    const [y, m, d] = dueDateStr.trim().split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // If format "Oct 14, 2026" or "Oct 14"
  const parsed = Date.parse(dueDateStr);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  // Fallback: extract day number
  const match = dueDateStr.match(/\b([1-9]|[12][0-9]|3[01])\b/);
  if (match) {
    const day = parseInt(match[1], 10);
    const d = new Date(fallbackDate);
    d.setDate(day);
    return d;
  }

  return new Date(fallbackDate);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function generateMonthGrid(year: number, monthIndex: number): CalendarGridCell[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const totalDays = getDaysInMonth(year, monthIndex);
  const todayIso = formatDateIso(new Date());

  // Monday = 0, ..., Sunday = 6
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const cells: CalendarGridCell[] = [];

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(year, monthIndex - 1);
  for (let i = startingDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, monthIndex - 1, day);
    cells.push({
      date: d,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: formatDateIso(d) === todayIso,
      dateStr: formatDateIso(d),
    });
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      date: d,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: formatDateIso(d) === todayIso,
      dateStr: formatDateIso(d),
    });
  }

  // Next month leading days (fill to multiple of 7, 35 or 42 cells)
  const remaining = (7 - (cells.length % 7)) % 7;
  const targetTotal = cells.length + remaining < 35 ? 35 : cells.length + remaining;
  const toAdd = targetTotal - cells.length;

  for (let day = 1; day <= toAdd; day++) {
    const d = new Date(year, monthIndex + 1, day);
    cells.push({
      date: d,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: formatDateIso(d) === todayIso,
      dateStr: formatDateIso(d),
    });
  }

  return cells;
}
```

- [ ] **Step 4: Run tests to verify it passes**

Run: `yarn workspace @backnode/frontend test dateUtils.test.ts` (or run via Node test script if vitest not configured)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/utils/dateUtils.ts packages/frontend/src/utils/dateUtils.test.ts
git commit -m "feat: add dateUtils for calendar and timeline calculation"
```

---

### Task 2: WorkspaceContext Enhanced Task Reordering & Status Moves

**Files:**
- Modify: `packages/frontend/src/context/WorkspaceContext.tsx`

- [ ] **Step 1: Enhance `handleMoveTaskStatus` to support target index positioning and add `handleReorderTasks`**

In `packages/frontend/src/context/WorkspaceContext.tsx`:
Add support for moving a task to a specific index within a column or across columns:
```typescript
  const handleMoveTaskStatus = (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;

      const updatedTask = { ...task, status: newStatus };
      const withoutTask = prev.filter((t) => t.id !== taskId);

      if (targetTaskId) {
        const destIndex = withoutTask.findIndex((t) => t.id === targetTaskId);
        if (destIndex !== -1) {
          const insertAt = position === 'after' ? destIndex + 1 : destIndex;
          const copy = [...withoutTask];
          copy.splice(insertAt, 0, updatedTask);
          return copy;
        }
      }

      if (typeof targetIndex === 'number' && targetIndex >= 0) {
        const sameStatusTasks = withoutTask.filter((t) => t.status === newStatus);
        const otherTasks = withoutTask.filter((t) => t.status !== newStatus);
        sameStatusTasks.splice(targetIndex, 0, updatedTask);
        return [...otherTasks, ...sameStatusTasks];
      }

      return [...withoutTask, updatedTask];
    });

    tasksApi.update(taskId, { status: newStatus }).catch((err) => {
      console.error('Failed to move task status in DB:', err);
    });
    showToast(`Task updated to ${newStatus}`);
  };
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `yarn workspace @backnode/frontend build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/context/WorkspaceContext.tsx
git commit -m "feat(context): enhance handleMoveTaskStatus with index positioning"
```

---

### Task 3: Interactive Kanban Board with In-Column Reordering & Insertion Indicators

**Files:**
- Modify: `packages/frontend/src/components/KanbanBoard.tsx`

- [ ] **Step 1: Implement precision drop calculation and visual insertion indicators**

Update `packages/frontend/src/components/KanbanBoard.tsx`:
- Add `dropTarget: { taskId: string; position: 'before' | 'after'; status: TaskStatus } | null`
- In card `onDragOver`:
  - Calculate `e.clientY - rect.top` vs `rect.height / 2`
  - Determine `'before'` or `'after'`
  - Set `dropTarget`
  - `e.preventDefault()`, `e.stopPropagation()`
- Render glowing Electric Orange insertion line above (`border-t-2 border-orange-500`) or below (`border-b-2 border-orange-500`) with circular accent bead.
- In card `onDrop`:
  - Read `e.dataTransfer.getData('text/plain')`
  - If dropped on target card, call `onMoveTaskStatus(draggedId, col.status, undefined, targetCard.id, dropTarget.position)`.
- In column container `onDrop`:
  - If dropped on empty space in column, append to column.
- Clear `dropTarget` on `onDragLeave` and `onDragEnd`.

- [ ] **Step 2: Verify TypeScript compilation**

Run: `yarn workspace @backnode/frontend build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/components/KanbanBoard.tsx
git commit -m "feat(kanban): add in-column reordering, cross-column drop and visual indicators"
```

---

### Task 4: Interactive Monthly Calendar with Navigation & Drag-to-Reschedule

**Files:**
- Modify: `packages/frontend/src/components/MonthlyCalendarView.tsx`

- [ ] **Step 1: Wire reactive Month/Year state and navigation buttons**

- Replace static "October 2026" with `currentDate` state (`useState(new Date(2026, 9, 1))`).
- `<` button onClick: `setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))`
- `>` button onClick: `setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))`
- `Today` button onClick: `setCurrentDate(new Date())`
- Generate dynamic cells using `generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth())`.

- [ ] **Step 2: Add Drag-and-Drop rescheduling to Calendar Day Cells**

- Each task pill in the day list has `draggable={!isReadOnly}`, `onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}`.
- Each day cell has:
  - `onDragOver`: `e.preventDefault()`, set `dragOverDate: cell.dateStr`.
  - `onDragLeave`: clear `dragOverDate` if left cell.
  - `onDrop`: get `taskId`, update task's `dueDate` to `formatDateDisplay(cell.date)` (e.g., `Oct 22, 2026`), and call `handleUpdateTask({ ...task, dueDate: ... })`.
  - Visual highlight during drag-over: `border-orange-500 bg-orange-950/30 ring-1 ring-orange-500/40`.

- [ ] **Step 3: Add Click-to-Create on Day Cells**

- Clicking an empty space in a day cell triggers `onOpenCreateTask(cell.dateStr)`.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `yarn workspace @backnode/frontend build`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/MonthlyCalendarView.tsx
git commit -m "feat(calendar): implement dynamic month navigation, day-click create and drag-to-reschedule"
```

---

### Task 5: Interactive Gantt Timeline with Bar Dragging & Edge Resizing

**Files:**
- Modify: `packages/frontend/src/components/GanttTimelineView.tsx`

- [ ] **Step 1: Implement Mouse Drag Pointer Engine for Gantt Bars**

In `packages/frontend/src/components/GanttTimelineView.tsx`:
- Define `activeDrag: { taskId: string; mode: 'move' | 'resize-left' | 'resize-right'; startX: number; initialLeft: number; initialWidth: number; currentLeft: number; currentWidth: number } | null`.
- Column width driven by `zoomScale`: `days: 60px`, `weeks: 45px`, `months: 25px`.
- Attach `onMouseDown` on left resize handle (`mode: 'resize-left'`), right resize handle (`mode: 'resize-right'`), and bar body (`mode: 'move'`).
- In `window.onmousemove`:
  - Calculate `deltaX = e.clientX - activeDrag.startX`.
  - Snap `deltaX` to multiples of `columnWidth`.
  - Update `currentLeft` and `currentWidth` (clamped to minimum 1 day width).
- In `window.onmouseup`:
  - Calculate final start day index and duration in days.
  - Convert to new `dueDate` and `estimation.hours`.
  - Call `handleUpdateTask` to persist.
  - Reset `activeDrag`.

- [ ] **Step 2: Add interactive hover preview and click-to-create on empty timeline slots**

- Clicking an empty date column in any timeline row prompts task creation for that day.
- Hovering over a Gantt bar displays exact start date, due date, duration in days, and linked dependencies.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `yarn workspace @backnode/frontend build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/GanttTimelineView.tsx
git commit -m "feat(gantt): implement drag-to-shift bar, edge-resize handles and dynamic zoom scales"
```

---

### Task 6: End-to-End Verification & Visual Screenshot Artifacts

**Files:**
- Create: `scratch/verify-mouse-interactions.mjs`
- Capture: UI Screenshots showing Kanban DND, Calendar month navigation & drop highlight, and Gantt resized bars.

- [ ] **Step 1: Create automated browser verification script using Edge CDP**
- [ ] **Step 2: Test Kanban card dragging & reordering, Calendar month navigation & drop rescheduling, and Gantt bar resizing**
- [ ] **Step 3: Capture screenshots into artifact directory and verify visuals against `design.md`**
- [ ] **Step 4: Run full `yarn build` across the repository**

---
