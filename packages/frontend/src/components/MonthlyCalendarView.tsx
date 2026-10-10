import React, { useState } from 'react';
import { TaskItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  formatMonthYear,
  formatDateDisplay,
  formatDateIso,
  parseTaskDueDate,
  generateMonthGrid,
  CalendarGridCell,
} from '../utils/dateUtils';

interface MonthlyCalendarViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: (defaultDate?: string) => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  onUpdateTask?: (task: TaskItem) => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
  onUpdateTask,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';

  // Base state defaults to October 2026 sprint horizon, with fully reactive dynamic date engine
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 14));
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<TaskItem | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Month grid cells for current active month
  const calendarCells = generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth());

  // Group tasks by resolved ISO date string
  const tasksByDateStr: Record<string, TaskItem[]> = {};

  tasks.forEach((task, index) => {
    // If task has dueDate, parse it; fallback to distributed day in Oct 2026
    const fallbackDay = ((index * 3 + 2) % 28) + 1;
    const fallbackDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), fallbackDay);
    const resolvedDate = parseTaskDueDate(task.dueDate, fallbackDate);
    const dateStr = formatDateIso(resolvedDate);

    if (!tasksByDateStr[dateStr]) {
      tasksByDateStr[dateStr] = [];
    }
    tasksByDateStr[dateStr].push(task);
  });

  const getStatusDot = (status: TaskItem['status']) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-400';
      case 'In Progress':
        return 'bg-orange-500 animate-pulse';
      case 'In Review':
        return 'bg-amber-400';
      default:
        return 'bg-zinc-400';
    }
  };

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-950/60 text-red-400 border border-red-500/30';
      case 'High':
        return 'bg-orange-950/60 text-orange-400 border border-orange-500/30';
      case 'Medium':
        return 'bg-amber-950/60 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 14));
  };

  // Drag and drop reschedule commit
  const handleDropOnCell = (cell: CalendarGridCell) => {
    if (!draggedTaskId || !onUpdateTask) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task) return;

    const newDueDate = formatDateDisplay(cell.date);
    onUpdateTask({ ...task, dueDate: newDueDate });
    setDraggedTaskId(null);
    setDragOverDateStr(null);
  };

  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden select-none text-xs">
      {/* 1. Calendar Controls & Month Switcher Bar */}
      <div className="px-6 py-2 bg-[#121214] border-b border-[#27272a] flex items-center justify-between shrink-0 h-11">
        {/* Left: View Title & Record Count */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-100 text-xs">Milestones &amp; Calendar Schedule</span>
          <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-[6px]">
            {tasks.length} deliverables
          </span>
        </div>

        {/* Right: Month Controls & Action */}
        <div className="flex items-center gap-3">
          {/* Month Navigation Capsule */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-[6px] px-2 py-0.5 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-[6px] transition-colors flex items-center cursor-pointer"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="font-bold px-2.5 tracking-tight text-zinc-100 font-mono text-[11px] min-w-[110px] text-center">
              {formatMonthYear(currentDate)}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-[6px] transition-colors flex items-center cursor-pointer"
              title="Next Month"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 rounded-[6px] shadow-sm text-zinc-200 transition-colors cursor-pointer"
            title="Reset to Today"
          >
            Today
          </button>

          {!isReadOnly && (
            <>
              <div className="h-4 w-px bg-[#27272a]"></div>
              {/* Primary CTA */}
              <button
                type="button"
                onClick={() => onOpenCreateTask()}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-[6px] shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Create Task</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-header Day Columns Legend */}
      <div className="grid grid-cols-7 border-b border-[#27272a] bg-[#18181b] text-center font-mono text-[10px] font-semibold tracking-wider text-zinc-400 py-2 shrink-0">
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div className="text-zinc-600">SAT</div>
        <div className="text-zinc-600">SUN</div>
      </div>

      {/* 2. Monthly Calendar Grid (5 or 6 Weeks x 7 Columns) */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-[#27272a] p-px overflow-y-auto relative auto-rows-fr">
        {calendarCells.map((cell, idx) => {
          const dayTasks = tasksByDateStr[cell.dateStr] || [];
          const isWeekend = idx % 7 === 5 || idx % 7 === 6;
          const isDragOver = dragOverDateStr === cell.dateStr;

          return (
            <div
              key={cell.dateStr + '-' + idx}
              onDragOver={(e) => {
                if (isReadOnly) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverDateStr !== cell.dateStr) {
                  setDragOverDateStr(cell.dateStr);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverDateStr === cell.dateStr) {
                  setDragOverDateStr(null);
                }
              }}
              onDrop={(e) => {
                if (isReadOnly) return;
                e.preventDefault();
                handleDropOnCell(cell);
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !isReadOnly) {
                  onOpenCreateTask(cell.dateStr);
                }
              }}
              className={`p-2 flex flex-col gap-1.5 transition-all relative min-h-[100px] overflow-hidden group/cell ${
                isDragOver
                  ? 'border-2 border-orange-500 bg-orange-950/40 ring-1 ring-orange-500/50 shadow-md'
                  : cell.isToday
                  ? 'bg-[#18181b] border border-orange-500/60 shadow-xs'
                  : !cell.isCurrentMonth
                  ? 'bg-[#121214]/50 opacity-40 hover:opacity-60'
                  : isWeekend
                  ? 'bg-[#0c0a09]/80 hover:bg-[#121214]'
                  : 'bg-[#121214] hover:bg-[#18181b]/70'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pointer-events-none">
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    cell.isToday
                      ? 'text-orange-400 font-bold'
                      : isWeekend
                      ? 'text-zinc-500'
                      : cell.isCurrentMonth
                      ? 'text-zinc-200'
                      : 'text-zinc-600'
                  }`}
                >
                  {String(cell.dayNumber).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1 pointer-events-auto">
                  {cell.isToday && (
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-[6px] bg-orange-600 text-white shadow-xs">
                      TODAY
                    </span>
                  )}
                  {!isReadOnly && cell.isCurrentMonth && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreateTask(cell.dateStr);
                      }}
                      className="opacity-0 group-hover/cell:opacity-100 p-0.5 hover:bg-zinc-800 text-zinc-500 hover:text-orange-400 rounded-[6px] transition-all cursor-pointer flex items-center"
                      title={`Add task for ${formatDateDisplay(cell.date)}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {dayTasks.map((t) => {
                  const isThisDragging = draggedTaskId === t.id;

                  return (
                    <div
                      key={t.id}
                      draggable={!isReadOnly}
                      onDragStart={(e) => {
                        if (isReadOnly) return;
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverDateStr(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(t);
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoverPosition({ x: rect.left, y: rect.bottom + 4 });
                        setHoveredTask(t);
                      }}
                      onMouseLeave={() => {
                        setHoveredTask(null);
                        setHoverPosition(null);
                      }}
                      className={`px-2 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] text-[11px] flex items-center justify-between gap-1.5 hover:border-orange-500/60 hover:bg-orange-950/20 transition-all shadow-xs group ${
                        isReadOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                      } ${isThisDragging ? 'opacity-30 ring-1 ring-orange-500' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(t.status)}`} />
                        <span className="truncate font-medium text-zinc-200 group-hover:text-zinc-100">
                          {t.title}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500 group-hover:text-orange-400 shrink-0">
                        {t.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING HOVER PREVIEW CARD - ONLY OPENS ON HOVER */}
      {hoveredTask && hoverPosition && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(hoverPosition.x, window.innerWidth - 360)}px`,
            top: `${Math.min(hoverPosition.y, window.innerHeight - 240)}px`,
          }}
          className="w-[340px] bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-4 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 text-zinc-100"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between pb-2 border-b border-[#27272a]">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-orange-400 bg-orange-950/50 border border-orange-500/30 px-2 py-0.5 rounded-[6px] font-semibold">
                  {hoveredTask.id}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(hoveredTask.status)}`} />
                <span className="font-mono text-[10px] text-zinc-400">{hoveredTask.status}</span>
              </div>
              <h4 className="text-[13px] font-bold text-zinc-100 mt-1 leading-snug">
                {hoveredTask.title}
              </h4>
            </div>
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-[6px] font-semibold ${getPriorityBadge(hoveredTask.priority)}`}>
              {hoveredTask.priority}
            </span>
          </div>

          {/* Details */}
          <div className="py-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Assignee</span>
              <span className="font-medium text-zinc-200">
                {hoveredTask.assignee?.name || 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Due Date</span>
              <span className="font-mono text-zinc-300">
                {hoveredTask.dueDate || 'Sprint Scope'}
              </span>
            </div>
            {hoveredTask.linkedCrmDeal && (
              <div className="flex items-center justify-between text-zinc-400">
                <span>Linked Deal</span>
                <span className="font-semibold text-orange-400">
                  {hoveredTask.linkedCrmDeal.name}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#27272a] text-[10px] font-mono text-zinc-500 text-center">
            Click deliverable to open detail inspector • Drag to reschedule
          </div>
        </div>
      )}

      {/* 3. Bottom Status & Velocity Ribbon */}
      <footer className="h-11 bg-[#0c0a09] border-t border-[#27272a] px-6 flex items-center justify-between shrink-0 font-mono text-[11px] z-20 text-zinc-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-zinc-200 font-semibold">{tasks.length} Deliverables Scheduled</span>
          </div>
          <div className="h-3 w-px bg-[#27272a]"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{doneCount} Completed</span>
          </div>
          <div className="h-3 w-px bg-[#27272a]"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            <span className="text-red-400 font-semibold">{urgentCount} Urgent Due</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <span className="material-symbols-outlined text-[13px] text-emerald-400">calendar_month</span>
          <span>Schedule Engine: <strong className="text-zinc-200">Interactive</strong></span>
          <span className="text-zinc-700">|</span>
          <span>Drag &amp; Drop: <strong className="text-orange-400 font-mono">Active</strong></span>
        </div>
      </footer>
    </div>
  );
};
