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
  ];

  const currentStageIndex = stages.indexOf(deal.stage);

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
      className="fixed top-0 right-0 w-[760px] max-w-[95vw] h-screen bg-white border-l border-[#d4c0d5]/40 shadow-2xl flex flex-col justify-between z-50 overflow-hidden animate-in slide-in-from-right duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Inspection Navigation & Deal Header (CSS selector 2) */}
      <div className="p-6 border-b border-[#d4c0d5]/30 shrink-0 bg-white">
        {/* Deal ID Breadcrumb & Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#837284] whitespace-nowrap">
            <span className="hover:text-[#9900c2] cursor-pointer">Deals</span>
            <span>/</span>
            <span className="hover:text-[#9900c2] cursor-pointer">Enterprise 2026</span>
            <span>/</span>
            <span className="text-[#1a1b22] font-bold bg-[#eeedf7] px-1.5 py-0.5 rounded border border-[#d4c0d5]/40">
              {deal.id}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => alert(`Expanded Deal ${deal.id} full-canvas view.`)}
              className="p-1 rounded text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7] transition-colors"
              title="Full view"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7] transition-colors"
              title="Close Inspector"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Main Deal Title */}
        <h2 className="text-xl font-bold text-[#1a1b22] mt-3 leading-snug tracking-tight font-sans">
          {deal.title}
        </h2>

        {/* Value, Probability, Target Close Date Row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="font-mono text-2xl font-bold text-[#9900c2] tracking-tight">
            ${deal.value.toLocaleString()} USD
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f4f2fd] text-[#9900c2] border border-[#9900c2]/20 font-mono text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9900c2]"></span>
            {deal.probability}% Probability
          </span>
          <span className="text-[#837284] text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">event</span>
            <span>Target Close: <strong className="text-[#1a1b22]">{deal.targetCloseDate}</strong></span>
          </span>
        </div>
      </div>

      {/* Stage Stepper Progression Bar (CSS selector 1: breadcrumbs show up without scrollbar) */}
      <div className="px-6 py-2.5 bg-[#f4f2fd]/70 border-b border-[#d4c0d5]/30 flex items-center justify-between shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 text-xs whitespace-nowrap flex-nowrap overflow-x-hidden">
          {stages.map((stageName, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <React.Fragment key={stageName}>
                {idx > 0 && <span className="text-[#837284] text-xs">›</span>}
                {isCompleted ? (
                  <div className="flex items-center gap-1 text-[#504252] font-medium shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">
                      check_circle
                    </span>
                    <span>{stageName}</span>
                  </div>
                ) : isCurrent ? (
                  <div className="flex items-center gap-1.5 bg-[#9900c2] text-white px-2.5 py-1 rounded font-mono text-[11px] font-semibold shadow-xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span>{stageName}</span>
                  </div>
                ) : (
                  <span className="text-[#837284] text-xs shrink-0">
                    {stageName}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Quick Advance Button */}
        {currentStageIndex < stages.length - 1 && (
          <button
            onClick={onAdvanceStage}
            className="flex items-center gap-1 text-xs font-semibold text-[#1a1b22] bg-white border border-[#d4c0d5]/40 hover:bg-[#eeedf7] px-2.5 py-1 rounded transition-colors active:scale-[0.98] shrink-0 ml-2 whitespace-nowrap"
          >
            <span>Advance Stage</span>
            <span className="material-symbols-outlined text-[14px] text-[#9900c2]">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {/* Scrollable Drawer Body */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
        {/* SECTION 1: Stakeholder & Account Card */}
        <div className="border border-[#d4c0d5]/30 rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              PRIMARY STAKEHOLDER
            </span>
            <button
              onClick={() => alert(`Reassign stakeholder contact for ${deal.id}`)}
              className="text-xs text-[#9900c2] font-medium hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[13px]">swap_horiz</span> Change
            </button>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#9900c2]/10 border border-[#9900c2]/20 text-[#9900c2] flex items-center justify-center font-bold font-mono text-sm shrink-0">
              {deal.contact.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1a1b22] truncate">{deal.contact.name}</h4>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#eeedf7] text-[#504252] font-medium">
                  {deal.contact.role}
                </span>
              </div>
              <p className="text-xs text-[#504252] truncate">
                {deal.contact.title} · {deal.company}
              </p>

              {/* Quick Contacts Row */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#d4c0d5]/20 text-xs">
                <div className="flex items-center gap-1.5 text-[#504252] truncate">
                  <span className="material-symbols-outlined text-[15px] text-[#837284]">mail</span>
                  <a
                    href={`mailto:${deal.contact.email}`}
                    className="hover:text-[#9900c2] transition-colors truncate"
                  >
                    {deal.contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-[#504252]">
                  <span className="material-symbols-outlined text-[15px] text-[#837284]">call</span>
                  <span>{deal.contact.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#504252] col-span-2">
                  <span className="material-symbols-outlined text-[15px] text-[#837284]">location_on</span>
                  <span>{deal.contact.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Associated Tasks & Deliverables */}
        <div className="border border-[#d4c0d5]/30 rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#d4c0d5]/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#9900c2]">check_box</span>
              <span className="font-bold text-xs text-[#1a1b22]">Linked Tasks &amp; Deliverables</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#eeedf7] text-[#504252] font-bold">
                {deal.linkedTasks.length}
              </span>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-1 text-xs text-[#9900c2] font-semibold hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Task</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {deal.linkedTasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                  t.done
                    ? 'bg-[#f4f2fd]/40 border-[#d4c0d5]/20'
                    : 'bg-white border-[#d4c0d5]/40 hover:border-[#9900c2]/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => handleToggleTask(t.id)}
                  className="mt-0.5 w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2] border-[#837284] cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <p
                      className={`leading-snug ${
                        t.done
                          ? 'text-[#837284] line-through'
                          : 'font-semibold text-[#1a1b22]'
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.priority && !t.done && (
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ml-2 ${
                          t.priority === 'Urgent'
                            ? 'bg-[#9900c2]/10 text-[#9900c2]'
                            : 'bg-amber-100 text-[#835000]'
                        }`}
                      >
                        {t.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-[#837284]">
                    {t.dueDate && (
                      <span className={t.priority === 'Urgent' ? 'text-[#835000] font-semibold' : ''}>
                        Due {t.dueDate}
                      </span>
                    )}
                    {t.tag && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#eeedf7] text-[#504252]">
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
                  className="flex-1 bg-white border border-[#9900c2]/40 rounded px-2.5 py-1 text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
                />
                <button
                  onClick={handleAddTask}
                  className="px-2.5 py-1 bg-[#9900c2] text-white text-xs font-semibold rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-2 py-1 text-xs text-[#837284] hover:text-[#1a1b22]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Activity Timeline & Interaction Log */}
        <div className="border border-[#d4c0d5]/30 rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              COMMUNICATION HISTORY
            </span>
            <span className="font-mono text-[10px] text-[#837284]">
              {deal.history.length} Events Recorded
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#d4c0d5]/40">
            {deal.history.map((ev) => (
              <div key={ev.id} className="relative text-xs">
                <span className="absolute -left-6 top-0.5 w-4 h-4 rounded bg-[#f4f2fd] border border-[#9900c2]/30 flex items-center justify-center text-[#9900c2]">
                  <span className="material-symbols-outlined text-[11px]">
                    {ev.type === 'email' ? 'mail' : ev.type === 'call' ? 'call' : 'note'}
                  </span>
                </span>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#1a1b22]">{ev.title}</p>
                  <span className="font-mono text-[10px] text-[#837284] shrink-0 ml-2">
                    {ev.date}
                  </span>
                </div>
                {ev.detail && (
                  <p className="text-[#504252] text-[11px] mt-0.5">{ev.detail}</p>
                )}
              </div>
            ))}
          </div>

          {/* Quick Log Bar */}
          <div className="mt-4 pt-3 border-t border-[#d4c0d5]/20 flex items-center gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
              placeholder="Add note, log email or call..."
              className="flex-1 bg-[#f4f2fd]/60 text-[#1a1b22] text-xs rounded-lg px-3 py-1.5 border border-[#d4c0d5]/40 focus:outline-none focus:border-[#9900c2]"
            />
            <button
              onClick={handleAddLog}
              className="bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#1a1b22] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-[#d4c0d5]/30 bg-[#f4f2fd]/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#837284]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Changes saved locally to encrypted storage</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              alert(`Deal ${deal.id} archived.`);
              onClose();
            }}
            className="text-[#837284] hover:text-rose-600 text-xs font-medium px-3 py-1.5 transition-colors rounded"
          >
            Archive Deal
          </button>
          <button
            onClick={onClose}
            className="bg-[#1a1b22] hover:bg-black text-white text-xs font-semibold rounded-lg px-5 py-1.5 transition-all active:scale-[0.98] shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </aside>
  );
};
