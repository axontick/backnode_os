import React, { useState } from 'react';
import { TaskItem, TaskStatus, PriorityLevel, TeamMember, CrmDeal } from '../types';

interface UniversalAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onAddTask: (newTask: TaskItem) => void;
  onAddDeal?: (newDeal: CrmDeal) => void;
  defaultStatus?: TaskStatus;
  initialType?: 'task' | 'deal';
  defaultDealStage?: CrmDeal['stage'];
}

export const UniversalAddEditModal: React.FC<UniversalAddEditModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddTask,
  onAddDeal,
  defaultStatus = 'In Progress',
  initialType = 'task',
  defaultDealStage = 'Proposal Submitted',
}) => {
  if (!isOpen) return null;

  const [modalType, setModalType] = useState<'task' | 'deal'>(initialType);

  // Task form state
  const [title, setTitle] = useState('Implement webhook retry mechanism with exponential backoff');
  const [space, setSpace] = useState('Sprint 14 - Q4 Infra');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || 'mem-1');
  const [reviewerId, setReviewerId] = useState(members[1]?.id || 'mem-2');
  const [dueDate, setDueDate] = useState('Oct 24, 2026');
  const [linkedDeal, setLinkedDeal] = useState('Acme Corp ($180k ARR)');
  const [specMarkdown, setSpecMarkdown] = useState(
    'Enforce strict jitter calculation for failed webhook deliveries. Store transient payload state directly in local indexed SQLite WAL mode before attempting backoff queue sync.\n\n// Jitter delay calculation (Full Jitter)\ndelay = min(max_interval, base * (2 ** attempt))\njitter_sleep = random_between(0, delay)'
  );
  const [subtasks, setSubtasks] = useState([
    { id: 'st-1', text: 'Architecture review & jitter algorithm RFC', done: true },
    { id: 'st-2', text: 'Write SQLite migration for failure_audit_logs', done: true },
    { id: 'st-3', text: 'Unit test suite with 10k mock webhook events', done: false },
  ]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Deal form state
  const [dealTitle, setDealTitle] = useState('GlobalBank Sync Node Enterprise License');
  const [dealCompany, setDealCompany] = useState('GlobalBank Corporation');
  const [dealValue, setDealValue] = useState('$180,000');
  const [dealStage, setDealStage] = useState<CrmDeal['stage']>(defaultDealStage);
  const [dealOwner, setDealOwner] = useState(members[0]?.name || 'Alex Wong');

  const completedSubtasksCount = subtasks.filter((s) => s.done).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}`, text: newSubtaskInput.trim(), done: false },
    ]);
    setNewSubtaskInput('');
    setIsAddingSubtask(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'task') {
      if (!title.trim()) return;
      const assignedMember = members.find((m) => m.id === assigneeId) || members[0];
      const newTask: TaskItem = {
        id: `BN-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        description: specMarkdown.slice(0, 150),
        specMarkdown: specMarkdown,
        status: defaultStatus,
        priority: priority,
        assignee: assignedMember,
        tags: ['Core Engine', 'SQLite'],
        subtasks: subtasks.map((s) => ({
          id: s.id,
          text: s.text,
          done: s.done,
          author: assignedMember.initials,
          time: 'Just now',
        })),
        estimation: {
          hours: priority === 'Urgent' ? 14 : priority === 'High' ? 10 : 6,
          points: priority === 'Urgent' ? 5 : 3,
        },
        targetCycle: space,
        dueDate: dueDate,
        gitBranch: `feat/${title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`,
        replicationHash: `${Math.random().toString(36).substring(2, 7)}...${Math.random().toString(36).substring(2, 6)}`,
        timeInStage: 'Just created',
        linkedCrmDeal: linkedDeal ? { id: 'crm-link-1', name: linkedDeal, value: '$180k' } : undefined,
        activity: [
          {
            id: `act-${Date.now()}`,
            type: 'status',
            author: assignedMember.name,
            initials: assignedMember.initials,
            time: 'Just now',
            text: `Created deliverable in ${defaultStatus}`,
          },
        ],
      };
      onAddTask(newTask);
    } else {
      if (!dealTitle.trim()) return;
      if (onAddDeal) {
        const numVal = parseInt(dealValue.replace(/[^0-9]/g, ''), 10) || 75000;
        const newDeal: CrmDeal = {
          id: `DEAL-${Math.floor(500 + Math.random() * 500)}`,
          title: dealTitle.trim(),
          company: dealCompany.trim(),
          value: numVal,
          formattedValue: `$${numVal.toLocaleString()}`,
          stage: dealStage,
          probability: dealStage === 'Closed Won' ? 100 : dealStage === 'Contract & Legal' ? 85 : 60,
          targetCloseDate: dueDate,
          contact: {
            name: 'Sarah Connor',
            title: 'VP Technology',
            email: 's.connor@enterprise.com',
            phone: '+1 (555) 349-2019',
            location: 'San Francisco, CA',
            role: 'VP Tech',
            initials: 'SC',
          },
          owner: dealOwner,
          ownerInitials: dealOwner.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          tags: ['Tier 1', 'Enterprise'],
          linkedTasks: [
            {
              id: 'BN-108',
              title: title,
              done: false,
              priority: 'High',
              dueDate: dueDate,
              tag: 'Core Infra',
            },
          ],
          history: [
            {
              id: `hist-${Date.now()}`,
              type: 'note',
              title: 'Deal created in pipeline',
              date: 'Just now',
            },
          ],
        };
        onAddDeal(newDeal);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181b]/40 backdrop-blur-[6px] transition-all duration-200 select-none animate-in fade-in">
      {/* Centered 680px Wide Modal Card */}
      <div className="w-[660px] max-w-full max-h-[94vh] bg-[#ffffff] rounded-2xl border border-zinc-200/90 shadow-2xl flex flex-col overflow-hidden text-[#1a1b22] relative animate-in zoom-in-95 duration-150">
        {/* ========================================== */}
        {/* 1. MODAL HEADER                            */}
        {/* ========================================== */}
        <div className="p-5 pb-4 border-b border-zinc-100 flex flex-col gap-3 bg-white">
          {/* Top Row: Segmented Switcher & Close Keycap */}
          <div className="flex items-center justify-between">
            {/* Segmented Toggle: [ Task (#c03ce9) | CRM Deal ] */}
            <div className="p-0.5 bg-zinc-100/90 rounded-full flex items-center border border-zinc-200/60">
              <button
                type="button"
                onClick={() => setModalType('task')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  modalType === 'task'
                    ? 'bg-[#c03ce9] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">assignment</span>
                <span>Task Deliverable</span>
              </button>
              <button
                type="button"
                onClick={() => setModalType('deal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  modalType === 'deal'
                    ? 'bg-[#c03ce9] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">work</span>
                <span>CRM Deal</span>
              </button>
            </div>

            {/* Close Action & 'Esc' Keycap */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
                Esc
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Headline & Engine Commit Context Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-zinc-900 tracking-tight leading-tight">
                {modalType === 'task' ? 'Create Task Deliverable' : 'Create Enterprise CRM Deal'}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#c03ce9]/10 text-[#c03ce9] border border-[#c03ce9]/20 font-medium">
                Draft Auto-saved
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-amber-600">bolt</span>
              <span>
                {modalType === 'task'
                  ? 'Local-first item commits directly to encrypted storage (0.2ms)'
                  : 'Saves deal record into local SQLite replica and synchronizes with pipeline ARR'}
              </span>
            </p>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. FORM BODY (Scrollable Field Canvas)     */}
        {/* ========================================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {modalType === 'task' ? (
            <>
              {/* Deliverable Title Input with violet active glow */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-zinc-600 uppercase tracking-wider font-semibold">
                    Title Specification <span className="text-[#c03ce9]">*</span>
                  </label>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {title.length} / 120 chars
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Implement webhook retry mechanism with exponential backoff"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c03ce9] ring-2 ring-[#c03ce9]/25 text-zinc-900 text-sm font-medium focus:outline-none bg-white transition-all pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-emerald-600">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </span>
                </div>
              </div>

              {/* Row 1: Space Selector & Priority Pills */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {/* Space Selector Dropdown */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Deliverable Space
                  </label>
                  <select
                    value={space}
                    onChange={(e) => setSpace(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 text-xs font-medium focus:outline-none focus:border-[#c03ce9]"
                  >
                    <option value="Sprint 14 - Q4 Infra">Sprint 14 - Q4 Infra</option>
                    <option value="Client Deliverables">Client Deliverables</option>
                    <option value="Bugs & Triages">Bugs & Triages</option>
                    <option value="Product Design">Product Design</option>
                  </select>
                </div>

                {/* Priority Pills */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Priority Level
                  </label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {(['Low', 'Medium', 'High', 'Urgent'] as PriorityLevel[]).map((lvl) => {
                      const isSelected = priority === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setPriority(lvl)}
                          className={`flex-1 py-1.5 rounded-lg border text-center font-mono text-[11px] transition-all ${
                            isSelected
                              ? lvl === 'Urgent'
                                ? 'border-red-400 bg-red-50 text-red-700 font-bold'
                                : 'border-[#c03ce9] bg-purple-50 text-[#c03ce9] font-bold shadow-xs'
                              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          {lvl === 'High' ? 'High P1' : lvl === 'Urgent' ? 'Urgent P0' : lvl === 'Medium' ? 'Med' : 'Low'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Assignee Selector & Due Date Picker */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Assignee Selector */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Assigned Operator
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs font-medium focus:outline-none focus:border-[#c03ce9]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date Picker */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Target Milestone
                  </label>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl border border-zinc-200 bg-white h-[38px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-zinc-400">
                        calendar_today
                      </span>
                      <input
                        type="text"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="text-xs font-mono font-medium text-zinc-800 bg-transparent border-none p-0 focus:outline-none w-28"
                      />
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      Freeze
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Bi-directional CRM Account Link */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold flex items-center justify-between">
                  <span>Linked CRM Account</span>
                  <span className="font-mono text-[10px] text-zinc-400">Bi-directional relation</span>
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  {linkedDeal ? (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                      <span className="material-symbols-outlined text-[16px] text-[#9900c2]">domain</span>
                      <span className="font-medium text-zinc-900">{linkedDeal}</span>
                      <button
                        type="button"
                        onClick={() => setLinkedDeal('')}
                        className="w-4 h-4 rounded-full hover:bg-purple-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      const deal = prompt('Link deal name (e.g. HyperFlow $320k):');
                      if (deal) setLinkedDeal(deal.trim());
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 hover:border-[#9900c2] text-zinc-500 hover:text-[#9900c2] text-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_link</span>
                    <span>{linkedDeal ? '+ Change Deal' : '+ Link Deal'}</span>
                  </button>
                </div>
              </div>

              {/* Markdown Specification Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Technical Specification (Markdown)
                  </label>
                  <span className="font-mono text-[10px] text-zinc-400">Indexed for SQLite FTS5</span>
                </div>
                {/* Formatting Toolbar */}
                <div className="rounded-xl border border-zinc-200 overflow-hidden focus-within:border-[#c03ce9] focus-within:ring-1 focus-within:ring-[#c03ce9]/30 transition-all">
                  <div className="px-2.5 py-1 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-zinc-600">
                    <div className="flex items-center gap-1">
                      <button type="button" className="w-6 h-6 rounded hover:bg-zinc-200 font-bold text-xs">B</button>
                      <button type="button" className="w-6 h-6 rounded hover:bg-zinc-200 italic text-xs">I</button>
                      <button type="button" className="w-6 h-6 rounded hover:bg-zinc-200 font-mono text-[11px]">&lt;/&gt;</button>
                      <div className="h-3 w-px bg-zinc-300 mx-1"></div>
                      <button type="button" className="p-1 hover:bg-zinc-200 rounded">
                        <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                      </button>
                      <button type="button" className="p-1 hover:bg-zinc-200 rounded">
                        <span className="material-symbols-outlined text-[14px]">checklist</span>
                      </button>
                      <button type="button" className="p-1 hover:bg-zinc-200 rounded">
                        <span className="material-symbols-outlined text-[14px]">link</span>
                      </button>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">Live Markdown</span>
                  </div>
                  <textarea
                    rows={3}
                    value={specMarkdown}
                    onChange={(e) => setSpecMarkdown(e.target.value)}
                    className="w-full text-xs font-mono text-zinc-800 p-3 bg-white focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Subtask Checklist & Gates
                  </label>
                  <span className="font-mono text-[10px] text-[#c03ce9] font-medium bg-[#c03ce9]/10 px-2 py-0.5 rounded-full">
                    {completedSubtasksCount} of {subtasks.length} completed ({subtasksPercent}%)
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c03ce9] rounded-full transition-all duration-300"
                    style={{ width: `${subtasksPercent}%` }}
                  ></div>
                </div>

                {/* Interactive Checklist Items */}
                <div className="space-y-1.5 pt-1">
                  {subtasks.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-zinc-200/80 hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 rounded text-[#c03ce9] focus:ring-0 cursor-pointer border-zinc-300"
                      />
                      <span
                        className={`text-xs flex-1 ${
                          st.done ? 'line-through text-zinc-400' : 'text-zinc-800 font-medium'
                        }`}
                      >
                        {st.text}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {st.done ? 'Done' : 'Pending'}
                      </span>
                    </label>
                  ))}

                  {isAddingSubtask ? (
                    <div className="flex items-center gap-2 p-1">
                      <input
                        type="text"
                        autoFocus
                        value={newSubtaskInput}
                        onChange={(e) => setNewSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask();
                          } else if (e.key === 'Escape') {
                            setIsAddingSubtask(false);
                          }
                        }}
                        placeholder="Type subtask and press Enter..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#c03ce9] text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="px-3 py-1.5 bg-[#c03ce9] text-white rounded-lg text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingSubtask(true)}
                      className="w-full py-1.5 px-2 text-left font-mono text-[11px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#c03ce9]">add</span>
                      <span>Add subtask or press Tab</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* CRM Deal Mode */
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                  Deal Name / Project Title <span className="text-[#c03ce9]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="e.g. GlobalBank Sync Node Enterprise License"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-[#c03ce9] text-sm font-medium focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Client Organization / Company
                  </label>
                  <input
                    type="text"
                    required
                    value={dealCompany}
                    onChange={(e) => setDealCompany(e.target.value)}
                    placeholder="e.g. GlobalBank Corporation"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Deal Contract Value (ARR)
                  </label>
                  <input
                    type="text"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="$180,000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 font-mono text-xs font-semibold text-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Pipeline Stage
                  </label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none"
                  >
                    <option value="Qualified Lead">Qualified Lead (10%)</option>
                    <option value="Discovery & Demo">Discovery & Demo (30%)</option>
                    <option value="Proposal Submitted">Proposal Submitted (60%)</option>
                    <option value="Contract & Legal">Contract & Legal (85%)</option>
                    <option value="Closed Won">Closed Won (100%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                    Deal Account Owner
                  </label>
                  <select
                    value={dealOwner}
                    onChange={(e) => setDealOwner(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-zinc-600 uppercase font-semibold">
                  Target Close Date
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 font-mono text-xs text-zinc-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 3. MODAL FOOTER                            */}
          {/* ========================================== */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between bg-white">
            {/* Left: Engine Commit Status Indicator */}
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-900">Instant local commit (0.2ms)</span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1 text-zinc-500">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                WAL Encrypted
              </span>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#c03ce9] hover:bg-[#a62ec9] active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-[0_4px_16px_rgba(192,60,233,0.28)]"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {modalType === 'task' ? 'add_task' : 'monetization_on'}
                </span>
                <span>{modalType === 'task' ? 'Create Task' : 'Create Deal'}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white">
                  ⌘↵
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
