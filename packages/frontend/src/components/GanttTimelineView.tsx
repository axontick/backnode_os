import React, { useState, useEffect } from 'react';
import { TaskItem } from '../types';
import { addDays, formatDateDisplay } from '../utils/dateUtils';

interface GanttTimelineViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: (defaultDate?: string) => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  onUpdateTask?: (task: TaskItem) => void;
}

interface DragSession {
  taskId: string;
  mode: 'move' | 'resize-left' | 'resize-right';
  initialMouseX: number;
  initialLeftPx: number;
  initialWidthPx: number;
  currentLeftPx: number;
  currentWidthPx: number;
}

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
  onUpdateTask,
}) => {
  const [zoomScale, setZoomScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [dependenciesOn, setDependenciesOn] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(tasks[0]?.id || null);
  const [hoveredBar, setHoveredBar] = useState<{
    task: TaskItem;
    startDay: number;
    duration: number;
    x: number;
    y: number;
  } | null>(null);

  // Active drag or resize state
  const [dragSession, setDragSession] = useState<DragSession | null>(null);

  // Column width calculated dynamically per zoom scale
  const dayColWidth = zoomScale === 'days' ? 65 : zoomScale === 'months' ? 28 : 45;
  const weekColWidth = dayColWidth * 7;
  const totalCanvasWidth = dayColWidth * 35;
  const baseDate = new Date(2026, 8, 28); // Sep 28, 2026 Monday

  // Helper to parse day from dueDate or calculate fallback index
  const getTaskSchedule = (task: TaskItem, index: number) => {
    if (dragSession && dragSession.taskId === task.id) {
      const startDay = Math.round(dragSession.currentLeftPx / dayColWidth);
      const duration = Math.max(1, Math.round(dragSession.currentWidthPx / dayColWidth));
      return {
        startDay,
        duration,
        leftPx: dragSession.currentLeftPx,
        widthPx: dragSession.currentWidthPx,
      };
    }

    let startDay = (index * 3 + 2) % 27; // default fallback
    let duration = 3 + (index % 4); // 3-6 days

    if (task.dueDate) {
      const match = task.dueDate.match(/\b([1-9]|[12][0-9]|3[01])\b/);
      if (match) {
        const day = parseInt(match[1], 10);
        // Oct 1 is index 3 (since Sep 28-30 are 0,1,2)
        const endDay = Math.min(day + 2, 34);
        duration = Math.max(1, Math.min(Math.round((task.estimation?.hours || 24) / 8), 7));
        startDay = Math.max(0, endDay - duration);
      }
    }

    const leftPx = startDay * dayColWidth;
    const widthPx = duration * dayColWidth;
    return { startDay, duration, leftPx, widthPx };
  };

  // Window mousemove and mouseup listeners for active drag session
  useEffect(() => {
    if (!dragSession) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragSession.initialMouseX;

      if (dragSession.mode === 'move') {
        const snappedDelta = Math.round(deltaX / dayColWidth) * dayColWidth;
        const maxLeft = totalCanvasWidth - dragSession.initialWidthPx;
        const newLeft = Math.max(0, Math.min(maxLeft, dragSession.initialLeftPx + snappedDelta));
        setDragSession((prev) => (prev ? { ...prev, currentLeftPx: newLeft } : null));
      } else if (dragSession.mode === 'resize-left') {
        const snappedDelta = Math.round(deltaX / dayColWidth) * dayColWidth;
        const maxLeft = dragSession.initialLeftPx + dragSession.initialWidthPx - dayColWidth;
        const newLeft = Math.max(0, Math.min(maxLeft, dragSession.initialLeftPx + snappedDelta));
        const newWidth = dragSession.initialWidthPx - (newLeft - dragSession.initialLeftPx);
        setDragSession((prev) => (prev ? { ...prev, currentLeftPx: newLeft, currentWidthPx: newWidth } : null));
      } else if (dragSession.mode === 'resize-right') {
        const snappedDelta = Math.round(deltaX / dayColWidth) * dayColWidth;
        const minWidth = dayColWidth;
        const maxWidth = totalCanvasWidth - dragSession.initialLeftPx;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, dragSession.initialWidthPx + snappedDelta));
        setDragSession((prev) => (prev ? { ...prev, currentWidthPx: newWidth } : null));
      }
    };

    const handleMouseUp = () => {
      const finalStartDay = Math.round(dragSession.currentLeftPx / dayColWidth);
      const finalDuration = Math.max(1, Math.round(dragSession.currentWidthPx / dayColWidth));
      const finalEndDay = finalStartDay + finalDuration;

      const targetEndDate = addDays(baseDate, finalEndDay);
      const formattedDueDate = formatDateDisplay(targetEndDate);

      const task = tasks.find((t) => t.id === dragSession.taskId);
      if (task && onUpdateTask) {
        onUpdateTask({
          ...task,
          dueDate: formattedDueDate,
          estimation: {
            hours: finalDuration * 8,
            points: Math.min(finalDuration, 13),
          },
        });
      }

      setDragSession(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragSession, dayColWidth, totalCanvasWidth, tasks, onUpdateTask, baseDate]);

  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'Done':
        return <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>;
      case 'In Progress':
        return (
          <span className="material-symbols-outlined text-orange-400 text-[18px] animate-spin" style={{ animationDuration: '4s' }}>
            autorenew
          </span>
        );
      case 'In Review':
        return <span className="material-symbols-outlined text-amber-400 text-[18px]">visibility</span>;
      case 'Blocked':
        return <span className="material-symbols-outlined text-red-400 text-[18px]">block</span>;
      default:
        return <span className="material-symbols-outlined text-zinc-400 text-[18px]">radio_button_unchecked</span>;
    }
  };

  const getBarStyle = (status: TaskItem['status'], isSelected: boolean) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 hover:border-emerald-400';
      case 'In Progress':
        return 'bg-orange-600 border border-orange-500 text-white shadow-md shadow-orange-600/30 hover:bg-orange-500';
      case 'In Review':
        return 'bg-amber-950/70 border border-amber-500/40 text-amber-200 hover:border-amber-400';
      default:
        return isSelected
          ? 'bg-[#18181b] border-2 border-orange-500 text-zinc-100'
          : 'bg-[#18181b] border border-[#27272a] text-zinc-300 hover:border-zinc-600';
    }
  };

  const canvasHeight = Math.max(tasks.length * 54, 378);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden select-none text-xs">
      {/* 1. Timeline Controls Toolbar */}
      <div className="h-11 px-6 bg-[#121214] border-b border-[#27272a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-100 text-xs">Roadmap &amp; Gantt Schedule</span>
          <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-[6px]">
            Oct 2026 Sprint
          </span>
          <span className="font-mono text-[10px] text-zinc-500 hidden sm:inline">
            • Drag bar to move, drag edges to resize duration
          </span>
        </div>

        {/* Right Zoom & Canvas Macro Controls */}
        <div className="flex items-center gap-3">
          {/* Dependencies Switch Pill */}
          <button
            type="button"
            onClick={() => setDependenciesOn(!dependenciesOn)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-orange-400 text-[15px]">hub</span>
            <span className="text-xs font-medium">Dependencies</span>
            <span className="font-mono text-[10px] text-orange-400 font-bold">
              {dependenciesOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Zoom Scale Segmented Control */}
          <div className="flex items-center bg-[#18181b] rounded-[6px] p-0.5 border border-[#27272a]">
            {(['days', 'weeks', 'months'] as const).map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setZoomScale(scale)}
                className={`px-2.5 py-0.5 rounded-[6px] font-mono text-[10px] transition-colors capitalize cursor-pointer ${
                  zoomScale === scale ? 'bg-[#27272a] text-orange-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>

          {/* Quick Jump 'Today' */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('timeline-today-indicator');
              if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }}
            className="px-3 py-1 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 font-medium rounded-[6px] border border-[#27272a] transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[13px] text-orange-400">adjust</span>
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* 2. Main Gantt / Roadmap Timeline Canvas */}
      <div className="flex-1 flex flex-row overflow-hidden relative bg-[#09090b]">
        {/* 2A. Left Task Key & Breakdown Panel (340px width) */}
        <div className="w-[340px] shrink-0 border-r border-[#27272a] bg-[#121214] flex flex-col z-10 select-none">
          {/* Panel Header */}
          <div className="h-14 px-4 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-[18px]">checklist</span>
              <span className="text-xs font-bold text-zinc-100">Tasks &amp; Milestones</span>
              <span className="font-mono text-[10px] bg-orange-950/60 text-orange-400 font-bold px-1.5 py-0.2 rounded-[6px] border border-orange-500/30">
                {tasks.length}
              </span>
            </div>
          </div>

          {/* Task Rows Key List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#27272a] custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-500 gap-2">
                <span className="material-symbols-outlined text-[28px] text-zinc-600">playlist_remove</span>
                <p className="text-xs font-medium text-zinc-400">No tasks in this list yet</p>
                <p className="text-[11px] text-zinc-500">Create a task to see it on the timeline.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const isSelected = selectedRowId === task.id;
                const initials = task.assignee?.name
                  ? task.assignee.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'OP';

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedRowId(task.id);
                      onSelectTask(task);
                    }}
                    className={`h-[54px] px-3.5 flex items-center justify-between transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-orange-950/20 border-l-2 border-orange-500 hover:bg-orange-950/30'
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      {getStatusIcon(task.status)}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-orange-400' : 'text-zinc-400'}`}>
                            {task.id}
                          </span>
                          <span className={`font-medium truncate text-xs ${isSelected ? 'text-zinc-100 font-semibold' : 'text-zinc-200'}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{task.dueDate || 'Sprint Scope'}</span>
                          <span>•</span>
                          <span className={task.status === 'Done' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px] flex items-center justify-center font-bold shrink-0 ml-2"
                      title={task.assignee?.name || 'Unassigned'}
                    >
                      {initials}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inline Quick Add Task Action */}
          <button
            type="button"
            onClick={() => onOpenCreateTask()}
            className="h-10 px-4 border-t border-[#27272a] flex items-center gap-2 text-zinc-400 hover:text-orange-400 hover:bg-[#18181b] transition-colors text-xs font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] font-bold">add</span>
            <span>Add Task to Timeline...</span>
          </button>
        </div>

        {/* 2B. Right Gantt Schedule Grid Canvas */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative custom-scrollbar bg-[#09090b]">
          {/* Date Header Matrix */}
          <div
            className="h-14 border-b border-[#27272a] bg-[#121214] flex flex-col shrink-0 select-none"
            style={{ width: `${totalCanvasWidth}px` }}
          >
            {/* Top Tier: Weeks 40 to 44 */}
            <div className="h-7 flex border-b border-[#27272a] font-mono text-[10px] text-zinc-400 font-medium">
              {[
                { label: 'Week 40', span: 'Sep 28 - Oct 04', active: false },
                { label: 'Week 41', span: 'Oct 05 - Oct 11', active: false },
                { label: 'Week 42', span: 'Oct 12 - Oct 18', active: true },
                { label: 'Week 43', span: 'Oct 19 - Oct 25', active: false },
                { label: 'Week 44', span: 'Oct 26 - Nov 01', active: false },
              ].map((w, idx) => (
                <div
                  key={idx}
                  style={{ width: `${weekColWidth}px` }}
                  className={`border-r border-[#27272a] px-3 flex items-center justify-between ${
                    w.active ? 'bg-orange-950/20 text-orange-400' : 'bg-[#18181b] text-zinc-200'
                  }`}
                >
                  <span className="font-bold">{w.label}</span>
                  <span className={w.active ? 'text-orange-400 font-semibold text-[9px]' : 'text-zinc-500 text-[9px]'}>
                    {w.span}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Tier: Daily Day Columns */}
            <div className="h-7 flex font-mono text-[10px] text-zinc-500">
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = ((i + 28) % 31) || 31;
                const isToday = i === 16;
                const isWeekend = i % 7 === 5 || i % 7 === 6;

                return (
                  <div
                    key={i}
                    style={{ width: `${dayColWidth}px` }}
                    className={`text-center py-1 border-r border-[#27272a] ${
                      isToday
                        ? 'bg-orange-950/40 text-orange-400 font-bold border-orange-500/50'
                        : isWeekend
                        ? 'bg-[#18181b]/50 text-zinc-600'
                        : 'text-zinc-400'
                    }`}
                  >
                    {String(dayNum).padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Canvas Body */}
          <div
            className="relative overflow-hidden"
            style={{ width: `${totalCanvasWidth}px`, height: `${canvasHeight}px` }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const dayIdx = Math.floor(clickX / dayColWidth);
                const clickedDate = addDays(baseDate, dayIdx);
                onOpenCreateTask(formatDateDisplay(clickedDate));
              }
            }}
          >
            {/* Background Vertical Guidelines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${dayColWidth}px` }}
                  className={`h-full border-r ${
                    i === 16
                      ? 'border-orange-500/40 bg-orange-950/10'
                      : i % 7 === 5 || i % 7 === 6
                      ? 'border-[#27272a]/60 bg-[#121214]/40'
                      : 'border-[#27272a]/40'
                  }`}
                />
              ))}
            </div>

            {/* Horizontal Row Dividers */}
            <div className="absolute inset-0 flex flex-col pointer-events-none divide-y divide-[#27272a]">
              {tasks.map((t) => (
                <div key={t.id} className="h-[54px] w-full" />
              ))}
            </div>

            {/* SVG Dependency Connector Lines */}
            {dependenciesOn && tasks.length >= 2 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrow-orange" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ea580c" />
                  </marker>
                </defs>
                {tasks.slice(0, tasks.length - 1).map((t, idx) => {
                  const curr = getTaskSchedule(t, idx);
                  const next = getTaskSchedule(tasks[idx + 1], idx + 1);
                  const startX = curr.leftPx + curr.widthPx;
                  const startY = idx * 54 + 27;
                  const endX = next.leftPx;
                  const endY = (idx + 1) * 54 + 27;

                  const midX = (startX + endX) / 2;
                  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                  return (
                    <path
                      key={`dep-${idx}`}
                      d={path}
                      fill="none"
                      markerEnd="url(#arrow-orange)"
                      opacity="0.8"
                      stroke="#ea580c"
                      strokeDasharray="4,3"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            )}

            {/* TODAY VERTICAL INDICATOR LINE */}
            <div
              id="timeline-today-indicator"
              style={{ left: `${16 * dayColWidth}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-orange-500 z-20 pointer-events-none flex flex-col items-center"
            >
              <div className="-mt-1.5 px-2 py-0.5 rounded-[6px] bg-orange-600 text-white font-mono text-[9px] font-bold shadow-md shadow-orange-600/30 flex items-center gap-1 scale-90">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                TODAY
              </div>
              <div className="w-full h-full bg-orange-500/10"></div>
            </div>

            {/* DYNAMIC GANTT BARS CONTAINER */}
            <div className="relative w-full h-full z-10">
              {tasks.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <p className="text-xs">No tasks currently mapped on this sprint timeline.</p>
                </div>
              ) : (
                tasks.map((task, idx) => {
                  const { leftPx, widthPx, startDay, duration } = getTaskSchedule(task, idx);
                  const topPx = idx * 54 + 9;
                  const isSelected = selectedRowId === task.id;
                  const isDraggingThis = dragSession?.taskId === task.id;

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedRowId(task.id);
                        onSelectTask(task);
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({
                          task,
                          startDay,
                          duration,
                          x: rect.left,
                          y: rect.bottom + 4,
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{
                        position: 'absolute',
                        top: `${topPx}px`,
                        left: `${leftPx}px`,
                        width: `${Math.max(widthPx, dayColWidth)}px`,
                        height: '36px',
                      }}
                      className={`rounded-[6px] shadow-sm flex items-center justify-between px-2.5 group/bar transition-all select-none relative ${getBarStyle(
                        task.status,
                        isSelected
                      )} ${isDraggingThis ? 'opacity-90 ring-2 ring-orange-500 shadow-xl cursor-grabbing scale-[1.01]' : 'cursor-grab'}`}
                    >
                      {/* Left Resize Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDragSession({
                            taskId: task.id,
                            mode: 'resize-left',
                            initialMouseX: e.clientX,
                            initialLeftPx: leftPx,
                            initialWidthPx: widthPx,
                            currentLeftPx: leftPx,
                            currentWidthPx: widthPx,
                          });
                        }}
                        className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3 cursor-ew-resize bg-orange-400/0 hover:bg-white/30 rounded-l-[6px] transition-all flex items-center justify-center group/lhandle z-20"
                        title="Drag left handle to change start date"
                      >
                        <div className="w-0.5 h-3 bg-white/70 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                      </div>

                      {/* Bar Central Body */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDragSession({
                            taskId: task.id,
                            mode: 'move',
                            initialMouseX: e.clientX,
                            initialLeftPx: leftPx,
                            initialWidthPx: widthPx,
                            currentLeftPx: leftPx,
                            currentWidthPx: widthPx,
                          });
                        }}
                        className="flex items-center gap-2 truncate flex-1 h-full cursor-grab active:cursor-grabbing px-1"
                        title="Drag bar to shift schedule, or click to inspect"
                      >
                        {getStatusIcon(task.status)}
                        <span className="font-semibold truncate text-xs">
                          {task.id} • {task.title}
                        </span>
                      </div>

                      <span className="font-mono text-[10px] bg-black/40 font-bold px-1.5 py-0.5 rounded-[6px] shrink-0 ml-1 pointer-events-none">
                        {task.status}
                      </span>

                      {/* Right Resize Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDragSession({
                            taskId: task.id,
                            mode: 'resize-right',
                            initialMouseX: e.clientX,
                            initialLeftPx: leftPx,
                            initialWidthPx: widthPx,
                            currentLeftPx: leftPx,
                            currentWidthPx: widthPx,
                          });
                        }}
                        className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3 cursor-ew-resize bg-orange-400/0 hover:bg-white/30 rounded-r-[6px] transition-all flex items-center justify-center group/rhandle z-20"
                        title="Drag right handle to change duration & due date"
                      >
                        <div className="w-0.5 h-3 bg-white/70 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredBar && !dragSession && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(hoveredBar.x, window.innerWidth - 300)}px`,
            top: `${Math.min(hoveredBar.y, window.innerHeight - 150)}px`,
          }}
          className="w-[280px] bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl p-3 z-50 pointer-events-none text-zinc-100"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]">
            <span className="font-mono text-[10px] text-orange-400 font-bold">
              {hoveredBar.task.id}
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-[6px] bg-zinc-800 text-zinc-300">
              {hoveredBar.duration} {hoveredBar.duration === 1 ? 'day' : 'days'} ({hoveredBar.duration * 8}h)
            </span>
          </div>
          <div className="text-xs font-semibold text-zinc-100 mt-1 truncate">
            {hoveredBar.task.title}
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Due Date:</span>
            <span className="text-orange-400 font-semibold">{hoveredBar.task.dueDate || 'Sprint Scope'}</span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-zinc-500 text-center border-t border-[#27272a] pt-1">
            Drag bar to shift • Drag edges to resize duration
          </div>
        </div>
      )}

      {/* 3. Bottom System Status & Telemetry Bar */}
      <footer className="h-9 px-6 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between shrink-0 font-mono text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Interactive Timeline: Active</span>
          </div>
          <span className="text-zinc-700">•</span>
          <span>{tasks.length} tasks scheduled</span>
          <span className="text-zinc-700">•</span>
          <span className="text-orange-400 font-semibold">
            {dependenciesOn && tasks.length >= 2 ? `${tasks.length - 1} dependencies linked` : '0 dependencies'}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-orange-950/50 text-orange-400 border border-orange-500/30 font-semibold">
          <span className="material-symbols-outlined text-[13px]">mouse</span>
          <span>Pointer Snapping: 1 Day Grid</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#18181b] rounded-[6px] border border-[#27272a] text-zinc-200 font-bold">
              Drag
            </kbd>
            <span>Reschedule</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#18181b] rounded-[6px] border border-[#27272a] text-zinc-200 font-bold">
              Edges
            </kbd>
            <span>Resize</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
