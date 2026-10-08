import React, { useState } from 'react';
import { TaskItem } from '../types';

interface GanttTimelineViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: () => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
}

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
}) => {
  const [zoomScale, setZoomScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [dependenciesOn, setDependenciesOn] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(tasks[0]?.id || null);

  // Helper to parse day from dueDate or calculate fallback index
  const getTaskSchedule = (task: TaskItem, index: number) => {
    let startDay = (index * 3 + 2) % 27; // default fallback 0-26
    let duration = 3 + (index % 4); // 3-6 days

    if (task.dueDate) {
      const match = task.dueDate.match(/\b([1-9]|[12][0-9]|3[01])\b/);
      if (match) {
        const day = parseInt(match[1], 10);
        startDay = Math.min(Math.max(day - 1, 0), 28);
      }
    }

    const leftPx = startDay * 45;
    const widthPx = duration * 45;
    return { startDay, duration, leftPx, widthPx };
  };

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
        return 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 hover:border-emerald-400';
      case 'In Progress':
        return 'bg-orange-600 border border-orange-500 text-white shadow-md shadow-orange-600/30 hover:bg-orange-500';
      case 'In Review':
        return 'bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:border-amber-400';
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
                className={`px-2.5 py-0.5 rounded-[4px] font-mono text-[10px] transition-colors capitalize cursor-pointer ${
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
            onClick={onOpenCreateTask}
            className="h-10 px-4 border-t border-[#27272a] flex items-center gap-2 text-zinc-400 hover:text-orange-400 hover:bg-[#18181b] transition-colors text-xs font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] font-bold">add</span>
            <span>Add Task to Timeline...</span>
          </button>
        </div>

        {/* 2B. Right Gantt Schedule Grid Canvas */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative custom-scrollbar bg-[#09090b]">
          {/* Date Header Matrix */}
          <div className="h-14 border-b border-[#27272a] bg-[#121214] flex flex-col shrink-0 select-none min-w-[1575px]">
            {/* Top Tier: Weeks 40 to 44 */}
            <div className="h-7 flex border-b border-[#27272a] font-mono text-[10px] text-zinc-400 font-medium">
              <div className="w-[315px] border-r border-[#27272a] px-3 flex items-center justify-between bg-[#18181b]">
                <span className="font-bold text-zinc-200">Week 40</span>
                <span className="text-zinc-500">Sep 28 - Oct 04</span>
              </div>
              <div className="w-[315px] border-r border-[#27272a] px-3 flex items-center justify-between bg-[#18181b]">
                <span className="font-bold text-zinc-200">Week 41</span>
                <span className="text-zinc-500">Oct 05 - Oct 11</span>
              </div>
              <div className="w-[315px] border-r border-[#27272a] px-3 flex items-center justify-between bg-orange-950/20">
                <span className="font-bold text-orange-400">Week 42 (Current)</span>
                <span className="text-orange-400 font-semibold">Oct 12 - Oct 18</span>
              </div>
              <div className="w-[315px] border-r border-[#27272a] px-3 flex items-center justify-between bg-[#18181b]">
                <span className="font-bold text-zinc-200">Week 43</span>
                <span className="text-zinc-500">Oct 19 - Oct 25</span>
              </div>
              <div className="w-[315px] px-3 flex items-center justify-between bg-[#18181b]">
                <span className="font-bold text-zinc-200">Week 44</span>
                <span className="text-zinc-500">Oct 26 - Nov 01</span>
              </div>
            </div>

            {/* Bottom Tier: Daily Day Columns */}
            <div className="h-7 flex font-mono text-[10px] text-zinc-500">
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = ((i + 28) % 31) || 31;
                const isToday = i === 15;
                const isWeekend = i % 7 === 5 || i % 7 === 6;

                return (
                  <div
                    key={i}
                    className={`w-[45px] text-center py-1 border-r border-[#27272a] ${
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
            className="relative overflow-hidden min-w-[1575px]"
            style={{ height: `${canvasHeight}px` }}
          >
            {/* Background Vertical Guidelines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[45px] h-full border-r ${
                    i === 15
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
              className="absolute top-0 bottom-0 left-[675px] w-[2px] bg-orange-500 z-20 pointer-events-none flex flex-col items-center"
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
                  const { leftPx, widthPx } = getTaskSchedule(task, idx);
                  const topPx = idx * 54 + 9;
                  const isSelected = selectedRowId === task.id;

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedRowId(task.id);
                        onSelectTask(task);
                      }}
                      style={{
                        position: 'absolute',
                        top: `${topPx}px`,
                        left: `${leftPx}px`,
                        width: `${Math.max(widthPx, 180)}px`,
                        height: '36px',
                      }}
                      className={`rounded-[6px] shadow-sm flex items-center justify-between px-3 group transition-all cursor-pointer ${getBarStyle(
                        task.status,
                        isSelected
                      )}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getStatusIcon(task.status)}
                        <span className="font-semibold truncate text-xs">
                          {task.id} • {task.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-black/30 font-bold px-1.5 py-0.5 rounded-[4px] shrink-0 ml-2">
                        {task.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom System Status & Telemetry Bar */}
      <footer className="h-9 px-6 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between shrink-0 font-mono text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Local Mirror: Synchronized</span>
          </div>
          <span className="text-zinc-700">•</span>
          <span>{tasks.length} tasks on timeline</span>
          <span className="text-zinc-700">•</span>
          <span className="text-orange-400 font-semibold">
            {dependenciesOn && tasks.length >= 2 ? `${tasks.length - 1} active dependencies` : '0 active dependencies'}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-orange-950/50 text-orange-400 border border-orange-500/30 font-semibold">
          <span className="material-symbols-outlined text-[13px]">flag</span>
          <span>Critical Path: Active</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#18181b] rounded-[4px] border border-[#27272a] text-zinc-200 font-bold">
              T
            </kbd>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#18181b] rounded-[4px] border border-[#27272a] text-zinc-200 font-bold">
              W
            </kbd>
            <span>Week</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#18181b] rounded-[4px] border border-[#27272a] text-zinc-200 font-bold">
              D
            </kbd>
            <span>Dependency</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
