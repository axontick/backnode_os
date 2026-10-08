import React, { useState } from 'react';
import { TaskItem, TaskStatus } from '../types';

interface ListViewProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (task: TaskItem) => void;
  onQuickStatusChange: (taskId: string, status: TaskStatus) => void;
  onOpenCreateTask?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onQuickStatusChange,
  onOpenCreateTask,
}) => {
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(true);
  const [doneOpen, setDoneOpen] = useState(false);

  // Local checklist state for quick checklist interactivity
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({
    'sub-094-1': true,
    'sub-094-2': false,
    'sub-094-3': false,
    'sub-101-1': true,
    'sub-101-2': false,
  });

  const handleToggleCheck = (key: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const backlogTasks = tasks.filter((t) => t.status === 'Backlog');
  const doneTasks = tasks.filter((t) => t.status === 'Done');

  const totalHours = tasks.reduce((acc, t) => acc + (t.estimation?.hours || 0), 0);

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="font-mono px-2 py-0.5 rounded-[6px] text-[10px] font-semibold w-16 text-center text-red-400 bg-red-950/40 border border-red-500/30">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="font-mono px-2 py-0.5 rounded-[6px] text-[10px] font-semibold w-16 text-center text-orange-400 bg-orange-950/40 border border-orange-500/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="font-mono px-2 py-0.5 rounded-[6px] text-[10px] font-semibold w-16 text-center text-amber-400 bg-amber-950/40 border border-amber-500/30">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="font-mono px-2 py-0.5 rounded-[6px] text-[10px] font-semibold w-16 text-center text-zinc-400 bg-zinc-800/60 border border-zinc-700/50">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const renderTaskRow = (t: TaskItem) => {
    const hasChecklist = t.id === 'ENG-094' || t.id === 'ENG-101';
    const isENG094 = t.id === 'ENG-094';
    const isSelected = t.id === selectedTaskId;

    return (
      <div
        key={t.id}
        className={`group border rounded-[6px] p-3 transition-all ${
          isSelected
            ? 'bg-orange-950/20 border-orange-500 shadow-sm'
            : 'bg-[#121214] border-[#27272a] hover:border-orange-500/50 hover:bg-[#18181b]'
        }`}
      >
        {/* Parent Row */}
        <div
          onClick={() => onSelectTask(t)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickStatusChange(t.id, t.status === 'Done' ? 'In Progress' : 'Done');
              }}
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                t.status === 'Done'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-zinc-600 hover:border-orange-500 bg-transparent'
              }`}
              title={t.status === 'Done' ? 'Mark incomplete' : 'Mark complete'}
            >
              {t.status === 'Done' ? (
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-transparent hover:bg-orange-500/40"></span>
              )}
            </button>
            <span className="font-mono text-zinc-400 text-[11px] shrink-0 font-semibold">
              {t.id}
            </span>
            <span
              className={`font-medium truncate transition-colors text-xs ${
                t.status === 'Done'
                  ? 'line-through text-zinc-500'
                  : 'text-zinc-100 group-hover:text-orange-400'
              }`}
            >
              {t.title}
            </span>
            {hasChecklist && (
              <div className="flex items-center gap-1 font-mono text-zinc-400 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[6px] text-[10px] shrink-0">
                <span className="material-symbols-outlined text-[13px] text-zinc-400">
                  checklist
                </span>
                <span>
                  {isENG094
                    ? `${Object.values(checklistState).filter(Boolean).length}/3 subtasks`
                    : '1/2 subtasks'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {getPriorityBadge(t.priority)}
            <span className="w-16 text-center font-mono text-orange-400 font-semibold text-[11px]">
              {t.dueDate || 'Today'}
            </span>
            <div className="w-14 flex justify-center">
              <div
                className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-mono text-[10px] font-bold"
                style={{
                  backgroundColor: t.assignee.avatarBg && t.assignee.avatarBg !== '#9900c2' ? t.assignee.avatarBg : '#27272a',
                }}
              >
                {t.assignee.initials}
              </div>
            </div>
            <div className="w-24 text-right">
              {t.linkedCrmDeal ? (
                <span className="inline-block font-mono text-zinc-300 bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded-[6px] text-[10px] truncate max-w-[100px] text-right">
                  {t.linkedCrmDeal.name.split(' ')[0]}
                </span>
              ) : (
                <span className="text-zinc-600 font-mono text-[11px]">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Indented Nested Checklist for ENG-094 */}
        {isENG094 && (
          <div className="pl-6 space-y-1.5 border-l border-[#27272a] ml-4 my-2.5">
            <div
              onClick={() => handleToggleCheck('sub-094-1')}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[10px] ${
                    checklistState['sub-094-1']
                      ? 'bg-orange-600 text-white'
                      : 'border border-zinc-600'
                  }`}
                >
                  {checklistState['sub-094-1'] && (
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  )}
                </div>
                <span
                  className={
                    checklistState['sub-094-1']
                      ? 'line-through text-zinc-500'
                      : 'text-zinc-200 font-medium'
                  }
                >
                  Token mapping (Geist / Plus Jakarta Sans)
                </span>
              </div>
              <span className="font-mono text-zinc-500 text-[10px]">Oct 08</span>
            </div>

            <div
              onClick={() => handleToggleCheck('sub-094-2')}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[10px] ${
                    checklistState['sub-094-2']
                      ? 'bg-orange-600 text-white'
                      : 'border border-zinc-600'
                  }`}
                >
                  {checklistState['sub-094-2'] && (
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  )}
                </div>
                <span
                  className={
                    checklistState['sub-094-2']
                      ? 'line-through text-zinc-500'
                      : 'text-zinc-200 font-medium'
                  }
                >
                  SQLite WAL checkpoint verify
                </span>
              </div>
              <span className="font-mono text-zinc-500 text-[10px]">Oct 12</span>
            </div>

            <div
              onClick={() => handleToggleCheck('sub-094-3')}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[10px] ${
                    checklistState['sub-094-3']
                      ? 'bg-orange-600 text-white'
                      : 'border border-zinc-600'
                  }`}
                >
                  {checklistState['sub-094-3'] && (
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  )}
                </div>
                <span
                  className={
                    checklistState['sub-094-3']
                      ? 'line-through text-zinc-500'
                      : 'text-zinc-200 font-medium'
                  }
                >
                  Peer PR sign-off
                </span>
              </div>
              <span className="font-mono text-zinc-500 text-[10px]">Oct 14</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto select-none p-6 text-xs custom-scrollbar">
      {/* Header Summary Stats Strip */}
      <div className="flex items-center justify-between bg-[#121214] border border-[#27272a] rounded-[6px] px-4 py-2.5 shadow-sm mb-5 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-zinc-100">
            {tasks.length} Tasks in Sprint 14
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-orange-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            {inProgressTasks.length} In Progress
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            {backlogTasks.length} Backlog
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {doneTasks.length} Done
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 font-mono">Est: {totalHours || 58} hrs</span>
        </div>

        {/* Benchmark Badge */}
        <div className="flex items-center gap-2 bg-orange-950/40 border border-orange-500/30 px-2.5 py-1 rounded-[6px]">
          <span className="material-symbols-outlined text-[14px] text-orange-400">bolt</span>
          <span className="font-mono text-zinc-300 text-[10.5px]">
            Query Time: <strong className="text-orange-400">0.11ms</strong>
          </span>
        </div>
      </div>

      {/* PRIMARY HIERARCHICAL CONTENT CARD */}
      <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-sm p-6 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* SECTION 1: IN PROGRESS                                     */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]">
            <button
              type="button"
              onClick={() => setInProgressOpen(!inProgressOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-zinc-400">
                {inProgressOpen ? 'arrow_drop_down' : 'arrow_right'}
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                IN PROGRESS
              </h3>
              <span className="font-mono text-[10px] bg-orange-950/50 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded-[6px]">
                {inProgressTasks.length} tasks
              </span>
            </button>
            <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-mono">
              <span className="w-16 text-center">PRIORITY</span>
              <span className="w-16 text-center">DUE</span>
              <span className="w-14 text-center">ASSIGNEE</span>
              <span className="w-24 text-right">CONTEXT</span>
            </div>
          </div>

          {inProgressOpen && (
            <div className="space-y-2.5">
              {inProgressTasks.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs font-mono bg-[#18181b] rounded-[6px] border border-dashed border-[#27272a]">
                  No in-progress tasks matching current filters
                </div>
              ) : (
                inProgressTasks.map(renderTaskRow)
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: BACKLOG                                         */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]">
            <button
              type="button"
              onClick={() => setBacklogOpen(!backlogOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-zinc-400">
                {backlogOpen ? 'arrow_drop_down' : 'arrow_right'}
              </span>
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                BACKLOG
              </h3>
              <span className="font-mono text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.2 rounded-[6px]">
                {backlogTasks.length} tasks
              </span>
            </button>
            <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-mono">
              <span className="w-16 text-center">PRIORITY</span>
              <span className="w-16 text-center">DUE</span>
              <span className="w-14 text-center">ASSIGNEE</span>
              <span className="w-24 text-right">CONTEXT</span>
            </div>
          </div>

          {backlogOpen && (
            <div className="space-y-2.5">
              {backlogTasks.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs font-mono bg-[#18181b] rounded-[6px] border border-dashed border-[#27272a]">
                  No backlog tasks
                </div>
              ) : (
                backlogTasks.map(renderTaskRow)
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: DONE                                            */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]">
            <button
              type="button"
              onClick={() => setDoneOpen(!doneOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-zinc-400">
                {doneOpen ? 'arrow_drop_down' : 'arrow_right'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                DONE
              </h3>
              <span className="font-mono text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-[6px]">
                {doneTasks.length} tasks
              </span>
            </button>
            <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-mono">
              <span className="w-16 text-center">PRIORITY</span>
              <span className="w-16 text-center">DUE</span>
              <span className="w-14 text-center">ASSIGNEE</span>
              <span className="w-24 text-right">CONTEXT</span>
            </div>
          </div>

          {doneOpen && (
            <div className="space-y-2.5">
              {doneTasks.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs font-mono bg-[#18181b] rounded-[6px] border border-dashed border-[#27272a]">
                  No completed tasks
                </div>
              ) : (
                doneTasks.map(renderTaskRow)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
