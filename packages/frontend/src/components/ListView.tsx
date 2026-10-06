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
  const [isDoneExpanded, setIsDoneExpanded] = useState(false);
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(true);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafc] overflow-y-auto select-none p-6 text-xs custom-scrollbar">
      {/* Header Summary Stats Strip */}
      <div className="flex items-center justify-between bg-white border border-[#d4c0d5]/40 rounded-xl px-4 py-2.5 shadow-xs mb-5 shrink-0">
        <div className="flex items-center gap-3 font-body-sm text-xs">
          <span className="font-bold text-[#1a1b22]">
            {tasks.length} Tasks in Sprint 14
          </span>
          <span className="text-[#d4c0d5]">•</span>
          <span className="text-[#9900c2] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c03ce9]"></span>
            {inProgressTasks.length} In Progress
          </span>
          <span className="text-[#d4c0d5]">•</span>
          <span className="text-[#504252] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            {backlogTasks.length} Backlog
          </span>
          <span className="text-[#d4c0d5]">•</span>
          <span className="text-emerald-700 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {doneTasks.length} Done
          </span>
          <span className="text-[#d4c0d5]">•</span>
          <span className="text-[#504252] font-mono">Est: {totalHours || 58} hrs</span>
        </div>

        {/* Benchmark Badge */}
        <div className="flex items-center gap-2 bg-purple-50/70 border border-purple-200/60 px-2.5 py-1 rounded-full">
          <span className="material-symbols-outlined text-[14px] text-[#c03ce9]">bolt</span>
          <span className="font-mono text-[#330043] text-[10.5px]">
            Query Time: <strong className="text-[#c03ce9]">0.11ms</strong>
          </span>
        </div>
      </div>

      {/* PRIMARY HIERARCHICAL CONTENT CARD */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-sm p-6 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* SECTION 1: IN PROGRESS                                     */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[#d4c0d5]/20">
            <button
              onClick={() => setInProgressOpen(!inProgressOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5f5e61]">
                {inProgressOpen ? 'arrow_drop_down' : 'arrow_right'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#c03ce9]"></span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1a1b22]">
                IN PROGRESS
              </h3>
              <span className="font-mono text-[10px] bg-purple-50 text-[#c03ce9] border border-purple-200 px-1.5 py-0.2 rounded-full">
                {inProgressTasks.length} tasks
              </span>
            </button>
            <div className="flex items-center gap-3 text-[#837284] text-[11px] font-mono">
              <span className="w-16 text-center">PRIORITY</span>
              <span className="w-16 text-center">DUE</span>
              <span className="w-14 text-center">ASSIGNEE</span>
              <span className="w-24 text-right">CONTEXT</span>
            </div>
          </div>

          {inProgressOpen && (
            <div className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <div className="p-4 text-center text-[#837284] text-xs font-mono bg-[#fafafc] rounded-xl border border-dashed border-[#d4c0d5]/40">
                  No in-progress tasks matching current filters
                </div>
              ) : (
                inProgressTasks.map((t) => {
                  const hasChecklist = t.id === 'ENG-094' || t.id === 'ENG-101';
                  const isENG094 = t.id === 'ENG-094';
                  const isENG101 = t.id === 'ENG-101';

                  return (
                    <div
                      key={t.id}
                      className="group border border-[#d4c0d5]/30 rounded-xl p-3 hover:border-[#9900c2]/40 transition-all bg-white hover:shadow-xs"
                    >
                      {/* Parent Row */}
                      <div
                        onClick={() => onSelectTask(t)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickStatusChange(t.id, 'Done');
                            }}
                            className="w-4 h-4 rounded-full border-2 border-zinc-400 hover:border-[#c03ce9] flex items-center justify-center transition-colors shrink-0"
                            title="Mark complete"
                          >
                            <span className="w-2 h-2 rounded-full bg-transparent hover:bg-purple-200"></span>
                          </button>
                          <span className="font-mono text-[#5f5e61] text-[11px] shrink-0 font-semibold">
                            {t.id}
                          </span>
                          <span className="font-semibold text-[#1a1b22] truncate group-hover:text-[#9900c2] transition-colors text-xs">
                            {t.title}
                          </span>
                          {hasChecklist && (
                            <div className="flex items-center gap-1 font-mono text-[#504252] bg-[#f4f2fd] px-1.5 py-0.5 rounded text-[10px] shrink-0">
                              <span className="material-symbols-outlined text-[13px] text-[#5f5e61]">
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
                          <span
                            className={`font-mono px-2 py-0.5 rounded text-[10px] font-semibold w-16 text-center ${
                              t.priority === 'Urgent'
                                ? 'text-[#9900c2] bg-purple-50 border border-purple-200'
                                : t.priority === 'High'
                                ? 'text-amber-800 bg-amber-50 border border-amber-200'
                                : 'text-zinc-700 bg-zinc-100 border border-zinc-200'
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="w-16 text-center font-mono text-[#9900c2] font-semibold text-[11px]">
                            {t.dueDate || 'Today'}
                          </span>
                          <div className="w-14 flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center font-mono text-[10px] font-bold">
                              {t.assignee.initials}
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            {t.linkedCrmDeal ? (
                              <span className="inline-block font-mono text-[#504252] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] truncate max-w-[100px] text-right">
                                {t.linkedCrmDeal.name.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="text-[#837284] font-mono text-[11px]">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indented Nested Checklist for ENG-094 */}
                      {isENG094 && (
                        <div className="pl-8 space-y-1.5 border-l-2 border-purple-100 ml-4 my-2.5">
                          <div
                            onClick={() => handleToggleCheck('sub-094-1')}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#f4f2fd] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                  checklistState['sub-094-1']
                                    ? 'bg-zinc-800 text-white'
                                    : 'border border-zinc-300'
                                }`}
                              >
                                {checklistState['sub-094-1'] && (
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                )}
                              </div>
                              <span
                                className={
                                  checklistState['sub-094-1']
                                    ? 'line-through text-zinc-400'
                                    : 'text-[#1a1b22] font-medium'
                                }
                              >
                                Token mapping (Geist / Plus Jakarta Sans)
                              </span>
                            </div>
                            <span className="font-mono text-zinc-400 text-[10px]">Oct 08</span>
                          </div>

                          <div
                            onClick={() => handleToggleCheck('sub-094-2')}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#f4f2fd] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                  checklistState['sub-094-2']
                                    ? 'bg-zinc-800 text-white'
                                    : 'border border-zinc-300'
                                }`}
                              >
                                {checklistState['sub-094-2'] && (
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                )}
                              </div>
                              <span
                                className={
                                  checklistState['sub-094-2']
                                    ? 'line-through text-zinc-400'
                                    : 'text-[#1a1b22] font-medium'
                                }
                              >
                                Viewport breakpoints (Desktop, Tablet)
                              </span>
                            </div>
                            <span className="font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                              Due today
                            </span>
                          </div>

                          <div
                            onClick={() => handleToggleCheck('sub-094-3')}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#f4f2fd] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                  checklistState['sub-094-3']
                                    ? 'bg-zinc-800 text-white'
                                    : 'border border-zinc-300'
                                }`}
                              >
                                {checklistState['sub-094-3'] && (
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                )}
                              </div>
                              <span
                                className={
                                  checklistState['sub-094-3']
                                    ? 'line-through text-zinc-400'
                                    : 'text-[#1a1b22]'
                                }
                              >
                                Hairline border alignment test
                              </span>
                            </div>
                            <span className="font-mono text-[#5f5e61] text-[10px]">Tomorrow</span>
                          </div>
                        </div>
                      )}

                      {/* Indented Nested Checklist for ENG-101 */}
                      {isENG101 && (
                        <div className="pl-8 space-y-1.5 border-l-2 border-zinc-100 ml-4 my-2.5">
                          <div
                            onClick={() => handleToggleCheck('sub-101-1')}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#f4f2fd] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                  checklistState['sub-101-1']
                                    ? 'bg-zinc-800 text-white'
                                    : 'border border-zinc-300'
                                }`}
                              >
                                {checklistState['sub-101-1'] && (
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                )}
                              </div>
                              <span
                                className={
                                  checklistState['sub-101-1']
                                    ? 'line-through text-zinc-400'
                                    : 'text-[#1a1b22] font-medium'
                                }
                              >
                                Schema design &amp; migrations
                              </span>
                            </div>
                            <span className="font-mono text-emerald-600 text-[10px]">Done</span>
                          </div>

                          <div
                            onClick={() => handleToggleCheck('sub-101-2')}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[#f4f2fd] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                  checklistState['sub-101-2']
                                    ? 'bg-zinc-800 text-white'
                                    : 'border border-zinc-300'
                                }`}
                              >
                                {checklistState['sub-101-2'] && (
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                )}
                              </div>
                              <span
                                className={
                                  checklistState['sub-101-2']
                                    ? 'line-through text-zinc-400'
                                    : 'text-[#1a1b22]'
                                }
                              >
                                Worker thread sync &amp; batch commits
                              </span>
                            </div>
                            <span className="font-mono text-[#5f5e61] text-[10px]">Oct 11</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: BACKLOG                                         */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-3">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[#d4c0d5]/20">
            <button
              onClick={() => setBacklogOpen(!backlogOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5f5e61]">
                {backlogOpen ? 'arrow_drop_down' : 'arrow_right'}
              </span>
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1a1b22]">
                BACKLOG
              </h3>
              <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.2 rounded-full">
                {backlogTasks.length} tasks
              </span>
            </button>
          </div>

          {backlogOpen && (
            <div className="space-y-2">
              {backlogTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="group border border-[#d4c0d5]/30 rounded-xl p-3 hover:border-[#9900c2]/40 transition-all bg-white flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickStatusChange(t.id, 'In Progress');
                      }}
                      className="w-4 h-4 rounded-full border border-zinc-300 hover:border-zinc-500"
                    ></button>
                    <span className="font-mono text-[#5f5e61] text-[11px] shrink-0 font-semibold">
                      {t.id}
                    </span>
                    <span className="font-normal text-[#1a1b22] truncate group-hover:text-[#9900c2] transition-colors text-xs">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-[10px] w-16 text-center">
                      {t.priority}
                    </span>
                    <span className="w-16 text-center font-mono text-[#5f5e61] text-[11px]">
                      {t.dueDate || 'Oct 22'}
                    </span>
                    <div className="w-14 flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-zinc-700 text-white flex items-center justify-center font-mono text-[10px] font-bold">
                        {t.assignee.initials}
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      {t.linkedCrmDeal ? (
                        <span className="inline-block font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded text-[10px] truncate max-w-[100px]">
                          {t.linkedCrmDeal.name.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="text-[#837284] font-mono text-[11px]">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: DONE (Collapsed Accordion)                      */}
        {/* ========================================================= */}
        <div className="border border-[#d4c0d5]/25 rounded-xl bg-[#f4f2fd]/40 p-3 hover:bg-[#f4f2fd] transition-colors">
          <div
            onClick={() => setIsDoneExpanded(!isDoneExpanded)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[16px] text-[#5f5e61]">
                {isDoneExpanded ? 'arrow_drop_down' : 'arrow_right'}
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1a1b22]">
                  DONE
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full text-[10px]">
                  {doneTasks.length} of {doneTasks.length} completed (100%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full"></div>
              </div>
              <span className="font-mono text-[#5f5e61] text-[11px]">
                {isDoneExpanded ? 'Hide tasks' : 'Show tasks'}
              </span>
            </div>
          </div>

          {/* Expanded Done Items */}
          {isDoneExpanded && (
            <div className="mt-3 space-y-2 border-t border-[#d4c0d5]/20 pt-2">
              {doneTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="flex items-center justify-between py-1.5 px-2 bg-white rounded-lg border border-[#d4c0d5]/20 hover:bg-[#fafafc] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      check_circle
                    </span>
                    <span className="font-mono text-[#5f5e61] text-[11px] font-semibold">{t.id}</span>
                    <span className="line-through text-zinc-400 text-xs">{t.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INLINE TASK CREATOR ROW */}
        <div
          onClick={onOpenCreateTask}
          className="border border-dashed border-[#d4c0d5]/60 hover:border-[#9900c2]/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-[#5f5e61] hover:text-[#1a1b22] transition-colors cursor-pointer bg-white"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-[#9900c2]">add_circle</span>
            <span className="text-xs">Add new task to Sprint 14 or press Enter...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[#5f5e61] bg-[#eeedf7] px-2 py-0.5 rounded text-[10px] border border-[#d4c0d5]/30">
            <span>Shortcut:</span>
            <strong className="text-[#1a1b22]">C</strong>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM STATUS HUD & KEYBOARD SHORTCUTS DOCK */}
      <footer className="mt-4 pt-3 border-t border-[#d4c0d5]/25 flex items-center justify-between text-[11px] font-mono text-[#5f5e61] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[#1a1b22] font-medium">IndexedDB Cache: Synchronized</span>
          </div>
          <span className="text-[#d4c0d5]">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-[#5f5e61]">lock</span>
            <span>E2E Encryption: AES-256-GCM</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10.5px]">
          <span>Shortcuts:</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[#eeedf7] px-1 rounded border border-[#d4c0d5]/40 text-[#1a1b22]">C</kbd>{' '}
            New Task
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[#eeedf7] px-1 rounded border border-[#d4c0d5]/40 text-[#1a1b22]">J / K</kbd>{' '}
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[#eeedf7] px-1 rounded border border-[#d4c0d5]/40 text-[#1a1b22]">Space</kbd>{' '}
            Toggle Subtask
          </span>
        </div>
      </footer>
    </div>
  );
};
