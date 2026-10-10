import React, { useState } from 'react';
import { CrmDeal } from '../types';

interface DealInspectorProps {
  deal: CrmDeal;
  onClose: () => void;
  onUpdateDeal: (updatedDeal: CrmDeal) => void;
  onAdvanceStage: () => void;
}

export const DealInspector: React.FC<DealInspectorProps> = ({
  deal,
  onClose,
  onUpdateDeal,
  onAdvanceStage,
}) => {
  const [newNote, setNewNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const stages: CrmDeal['stage'][] = [
    'Qualified Lead',
    'Discovery & Demo',
    'Proposal Submitted',
    'Contract & Legal',
    'Closed Won',
    'Closed Lost',
  ];

  const currentStageIndex = stages.indexOf(deal.stage);

  const handleSelectStage = (newStage: CrmDeal['stage']) => {
    const probMap: Record<string, number> = {
      'Qualified Lead': 20,
      'Discovery & Demo': 40,
      'Proposal Submitted': 70,
      'Contract & Legal': 85,
      'Closed Won': 100,
      'Closed Lost': 0,
    };
    onUpdateDeal({
      ...deal,
      stage: newStage,
      probability: probMap[newStage] !== undefined ? probMap[newStage] : deal.probability,
      closedAt:
        newStage === 'Closed Won' || newStage === 'Closed Lost'
          ? deal.closedAt || new Date().toISOString()
          : undefined,
    });
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = deal.linkedTasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    onUpdateDeal({ ...deal, linkedTasks: updatedTasks });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      done: false,
      priority: 'High' as const,
      dueDate: 'Oct 26, 2026',
      tag: 'Deliverable',
      assignee: 'AW',
    };
    onUpdateDeal({
      ...deal,
      linkedTasks: [...deal.linkedTasks, newTask],
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleAddLog = () => {
    if (!newNote.trim()) return;
    const newHistoryEvent = {
      id: `hist-${Date.now()}`,
      type: 'note' as const,
      title: newNote.trim(),
      date: 'Just now',
      detail: 'Logged by Operator AW via Deal Inspector.',
    };
    onUpdateDeal({
      ...deal,
      history: [newHistoryEvent, ...deal.history],
    });
    setNewNote('');
  };

  return (
    <aside
      className="fixed top-0 right-0 w-[760px] max-w-[95vw] h-screen bg-[#121214] border-l border-[#27272a] shadow-2xl flex flex-col justify-between z-50 overflow-hidden animate-in slide-in-from-right duration-200 select-none text-zinc-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Inspection Navigation & Deal Header */}
      <div className="p-6 border-b border-[#27272a] shrink-0 bg-[#0c0a09]">
        {/* Deal ID Breadcrumb & Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
            <span className="hover:text-orange-400 cursor-pointer">Deals</span>
            <span>/</span>
            <span className="hover:text-orange-400 cursor-pointer">Enterprise 2026</span>
            <span>/</span>
            <span className="text-orange-400 font-bold bg-orange-950/40 px-1.5 py-0.5 rounded-[6px] border border-orange-500/20">
              {deal.id}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors cursor-pointer"
              title="Close Inspector"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Main Deal Title */}
        <h2 className="text-xl font-bold text-zinc-100 mt-3 leading-snug tracking-tight font-headline">
          {deal.title}
        </h2>

        {/* Value, Probability, Target Close Date Row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="font-mono text-2xl font-bold text-orange-400 tracking-tight">
            ${deal.value.toLocaleString()} USD
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/20 font-mono text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            {deal.probability}% Probability
          </span>
          <span className="text-zinc-400 text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">event</span>
            <span>Target Close: <strong className="text-zinc-200">{deal.targetCloseDate}</strong></span>
          </span>
        </div>
      </div>

      {/* Stage Stepper Progression Bar */}
      <div className="px-6 py-2.5 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 text-xs whitespace-nowrap flex-nowrap overflow-x-hidden">
          {stages.map((stageName, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <React.Fragment key={stageName}>
                {idx > 0 && <span className="text-zinc-600 text-xs">›</span>}
                <button
                  type="button"
                  onClick={() => handleSelectStage(stageName)}
                  className="cursor-pointer transition-all hover:opacity-80"
                  title={`Click to set stage to ${stageName}`}
                >
                  {isCompleted ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
                      <span className="material-symbols-outlined text-[15px]">
                        check_circle
                      </span>
                      <span>{stageName}</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1.5 bg-orange-600 text-white px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold shadow-xs shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>{stageName}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-xs shrink-0 hover:text-zinc-300">
                      {stageName}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Quick Advance Button */}
        {currentStageIndex < stages.length - 1 && (
          <button
            onClick={onAdvanceStage}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-200 bg-[#121214] border border-[#27272a] hover:bg-zinc-800 px-2.5 py-1 rounded-[6px] transition-colors active:scale-[0.98] shrink-0 ml-2 whitespace-nowrap cursor-pointer"
          >
            <span>Advance Stage</span>
            <span className="material-symbols-outlined text-[14px] text-orange-400">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {/* Scrollable Drawer Body */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar bg-[#121214]">
        {/* SECTION 0: Win/Loss Attribution & Competitor Intelligence */}
        <div className="border border-[#27272a] rounded-[6px] p-4 bg-[#18181b] shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-orange-400">swords</span>
              <span className="font-bold text-xs text-zinc-100">Deal Attribution &amp; Intelligence</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-400">
              Stage: {deal.stage}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                Competitor (Battlecard)
              </label>
              <input
                type="text"
                value={deal.competitor || ''}
                onChange={(e) => onUpdateDeal({ ...deal, competitor: e.target.value })}
                placeholder="e.g. Salesforce, HubSpot, Linear"
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-[#27272a] bg-[#121214] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 placeholder:text-zinc-600 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                Sales Cycle (Days)
              </label>
              <input
                type="number"
                value={deal.cycleDays ?? ''}
                onChange={(e) => onUpdateDeal({ ...deal, cycleDays: Number(e.target.value) || 0 })}
                placeholder="e.g. 16"
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-[#27272a] bg-[#121214] text-zinc-100 font-mono text-xs focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {deal.stage === 'Closed Lost' ? (
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-rose-400 uppercase font-semibold flex items-center gap-1">
                <span>Primary Loss Attribution Reason</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={deal.lossReason || ''}
                onChange={(e) => onUpdateDeal({ ...deal, lossReason: e.target.value })}
                placeholder="e.g. Budget & Procurement Freeze, Incumbent contract lock-in"
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-rose-500/40 bg-[#121214] text-zinc-100 text-xs focus:outline-none focus:border-rose-500 placeholder:text-zinc-600 font-medium"
              />
            </div>
          ) : deal.stage === 'Closed Won' ? (
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
                <span>Key Winning Factor</span>
              </label>
              <input
                type="text"
                value={deal.wonReason || ''}
                onChange={(e) => onUpdateDeal({ ...deal, wonReason: e.target.value })}
                placeholder="e.g. Local-first SQLite VFS speed & privacy"
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-emerald-500/40 bg-[#121214] text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600 font-medium"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                Next Strategic Action / Milestone
              </label>
              <input
                type="text"
                value={deal.nextStep || ''}
                onChange={(e) => onUpdateDeal({ ...deal, nextStep: e.target.value })}
                placeholder="e.g. Scheduled technical demo with VP Engineering"
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-[#27272a] bg-[#121214] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
              />
            </div>
          )}
        </div>
        {/* SECTION 1: Stakeholder & Account Card */}
        <div className="border border-[#27272a] rounded-[6px] p-4 bg-[#18181b] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              PRIMARY STAKEHOLDER
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold font-mono text-sm shrink-0">
              {deal.contact.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-zinc-100 truncate">{deal.contact.name}</h4>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-300 font-medium">
                  {deal.contact.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {deal.contact.title} · {deal.company}
              </p>

              {/* Quick Contacts Row */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#27272a] text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                  <span className="material-symbols-outlined text-[15px] text-zinc-500">mail</span>
                  <a
                    href={`mailto:${deal.contact.email}`}
                    className="hover:text-orange-400 transition-colors truncate"
                  >
                    {deal.contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="material-symbols-outlined text-[15px] text-zinc-500">call</span>
                  <span>{deal.contact.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 col-span-2">
                  <span className="material-symbols-outlined text-[15px] text-zinc-500">location_on</span>
                  <span>{deal.contact.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Associated Tasks & Deliverables */}
        <div className="border border-[#27272a] rounded-[6px] p-4 bg-[#18181b] shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-orange-400">check_box</span>
              <span className="font-bold text-xs text-zinc-100">Linked Tasks &amp; Deliverables</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-300 font-bold">
                {deal.linkedTasks.length}
              </span>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-1 text-xs text-orange-400 font-semibold hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Task</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {deal.linkedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-3 p-2.5 rounded-[6px] border border-[#27272a] bg-[#121214] hover:border-orange-500/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => handleToggleTask(t.id)}
                  className="mt-0.5 w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <p
                      className={`leading-snug ${
                        t.done
                          ? 'text-zinc-500 line-through'
                          : 'font-semibold text-zinc-100'
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.priority && !t.done && (
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.2 rounded-[6px] font-bold shrink-0 ml-2 ${
                          t.priority === 'Urgent'
                            ? 'bg-red-950/40 text-red-400 border border-red-500/20'
                            : 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {t.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-zinc-400">
                    {t.dueDate && (
                      <span className={t.priority === 'Urgent' ? 'text-amber-400 font-semibold' : ''}>
                        Due {t.dueDate}
                      </span>
                    )}
                    {t.tag && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-300">
                          Tag: {t.tag}
                        </span>
                      </>
                    )}
                    {t.assignee && (
                      <>
                        <span>•</span>
                        <span>Assignee: {t.assignee}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isAddingTask && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Task title..."
                  className="flex-1 bg-[#121214] border border-orange-500 rounded-[6px] px-2.5 py-1 text-xs text-zinc-100 focus:outline-none"
                />
                <button
                  onClick={handleAddTask}
                  className="px-2.5 py-1 bg-orange-600 text-white text-xs font-semibold rounded-[6px] cursor-pointer"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Activity Timeline & Interaction Log */}
        <div className="border border-[#27272a] rounded-[6px] p-4 bg-[#18181b] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              COMMUNICATION HISTORY
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {deal.history.length} Events Recorded
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
            {deal.history.map((ev) => (
              <div key={ev.id} className="relative text-xs">
                <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#121214] border border-[#27272a] flex items-center justify-center text-orange-400">
                  <span className="material-symbols-outlined text-[11px]">
                    {ev.type === 'email' ? 'mail' : ev.type === 'call' ? 'call' : 'note'}
                  </span>
                </span>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-100">{ev.title}</p>
                  <span className="font-mono text-[10px] text-zinc-500 shrink-0 ml-2">
                    {ev.date}
                  </span>
                </div>
                {ev.detail && (
                  <p className="text-zinc-400 text-[11px] mt-0.5">{ev.detail}</p>
                )}
              </div>
            ))}
          </div>

          {/* Quick Log Bar */}
          <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
              placeholder="Add note, log email or call..."
              className="flex-1 bg-[#121214] text-zinc-100 text-xs rounded-[6px] px-3 py-1.5 border border-[#27272a] focus:outline-none focus:border-orange-500 placeholder:text-zinc-500"
            />
            <button
              onClick={handleAddLog}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-[#27272a] bg-[#0c0a09] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Changes saved locally to encrypted storage</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-rose-400 text-xs font-medium px-3 py-1.5 transition-colors rounded-[6px] cursor-pointer"
          >
            Archive Deal
          </button>
          <button
            onClick={onClose}
            className="bg-[#18181b] hover:bg-zinc-800 text-zinc-100 border border-[#27272a] text-xs font-semibold rounded-[6px] px-5 py-1.5 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </aside>
  );
};
