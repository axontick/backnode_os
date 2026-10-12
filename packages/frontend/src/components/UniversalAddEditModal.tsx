import React, { useState, useEffect } from 'react';
import { TaskItem, TaskStatus, PriorityLevel, TeamMember, CrmDeal, SpaceFolder } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { RecurringCadenceSelector, DynamicEntityLinker } from '../modules/shared';
import { PriorityDropdown } from './PriorityDropdown';

interface UniversalAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onAddTask: (newTask: Partial<TaskItem>) => void;
  onUpdateTask?: (updatedTask: TaskItem) => void;
  taskToEdit?: TaskItem | null;
  onAddDeal?: (newDeal: Partial<CrmDeal>) => void;
  onUpdateDeal?: (updatedDeal: CrmDeal) => void;
  dealToEdit?: CrmDeal | null;
  defaultStatus?: TaskStatus;
  initialType?: 'task' | 'deal';
  defaultDealStage?: CrmDeal['stage'];
  folders?: SpaceFolder[];
  activeSpace?: string;
}

export const UniversalAddEditModal: React.FC<UniversalAddEditModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddTask,
  onUpdateTask,
  taskToEdit,
  onAddDeal,
  onUpdateDeal,
  dealToEdit,
  defaultStatus = 'In Progress',
  initialType = 'task',
  defaultDealStage = 'Proposal Submitted',
  folders = [],
  activeSpace = '',
}) => {
  const { user } = useAuth();
  const { statuses } = useWorkspace();

  const isEditing = Boolean(taskToEdit || dealToEdit);
  const [modalType, setModalType] = useState<'task' | 'deal'>(initialType);

  // Task form state
  const [title, setTitle] = useState('');
  const [space, setSpace] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string>('weekly');
  const [customLinks, setCustomLinks] = useState<Record<string, any>>({});
  const [linkedDeal, setLinkedDeal] = useState('');
  const [specMarkdown, setSpecMarkdown] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Deal form state
  const [dealTitle, setDealTitle] = useState('');
  const [dealCompany, setDealCompany] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [dealStage, setDealStage] = useState<CrmDeal['stage']>(defaultDealStage);
  const [dealOwner, setDealOwner] = useState('');
  const [dealCompetitor, setDealCompetitor] = useState('');
  const [dealLossReason, setDealLossReason] = useState('');
  const [dealWonReason, setDealWonReason] = useState('');
  const [dealCycleDays, setDealCycleDays] = useState('');

  // Reset or load data whenever modal opens or itemToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setModalType('task');
      setTitle(taskToEdit.title || '');
      setSpace(taskToEdit.targetCycle || activeSpace || '');
      setTaskStatus(taskToEdit.status || defaultStatus);
      setPriority((taskToEdit.priority as PriorityLevel) || 'Medium');
      setAssigneeId(taskToEdit.assignee?.id || members[0]?.id || '');
      setDueDate(taskToEdit.dueDate || '');
      setIsRecurring(!!taskToEdit.isRecurring);
      setRecurrenceRule(taskToEdit.recurrenceRule || 'weekly');
      setCustomLinks(taskToEdit.customLinks || {});
      setLinkedDeal(taskToEdit.linkedCrmDeal?.name || '');
      setSpecMarkdown(taskToEdit.specMarkdown || taskToEdit.description || '');
      setSubtasks(taskToEdit.subtasks?.map((s) => ({ id: s.id, text: s.text, done: s.done })) || []);
    } else if (dealToEdit) {
      setModalType('deal');
      setDealTitle(dealToEdit.title || '');
      setDealCompany(dealToEdit.company || '');
      setDealValue(dealToEdit.formattedValue || (dealToEdit.value ? `$${dealToEdit.value.toLocaleString()}` : ''));
      setDealStage(dealToEdit.stage || defaultDealStage);
      setDealOwner(dealToEdit.owner || members[0]?.name || user?.name || '');
      setDueDate(dealToEdit.targetCloseDate || '');
      setCustomLinks(dealToEdit.customLinks || {});
      setDealCompetitor(dealToEdit.competitor || '');
      setDealLossReason(dealToEdit.lossReason || '');
      setDealWonReason(dealToEdit.wonReason || '');
      setDealCycleDays(dealToEdit.cycleDays ? String(dealToEdit.cycleDays) : '');
    } else {
      // Creation mode: initialize everything clean and empty
      setModalType(initialType);
      setTitle('');
      setSpace(activeSpace || (folders[0]?.items?.[0]?.name ?? 'Sprint 01'));
      setTaskStatus(defaultStatus);
      setPriority('Medium');
      setAssigneeId(members[0]?.id || '');
      setDueDate('');
      setIsRecurring(false);
      setRecurrenceRule('weekly');
      setCustomLinks({});
      setLinkedDeal('');
      setSpecMarkdown('');
      setSubtasks([]);
      setNewSubtaskInput('');
      setIsAddingSubtask(false);

      setDealTitle('');
      setDealCompany('');
      setDealValue('');
      setDealStage(defaultDealStage);
      setDealOwner(members[0]?.name || user?.name || '');
      setDealCompetitor('');
      setDealLossReason('');
      setDealWonReason('');
      setDealCycleDays('');
    }
  }, [isOpen, taskToEdit, dealToEdit, initialType, defaultStatus, defaultDealStage, activeSpace, members, folders, user]);

  if (!isOpen) return null;

  const completedSubtasksCount = subtasks.filter((s) => s.done).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, text: newSubtaskInput.trim(), done: false },
    ]);
    setNewSubtaskInput('');
    setIsAddingSubtask(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === 'task') {
      if (!title.trim()) return;
      const assignedMember = members.find((m) => m.id === assigneeId) || members[0];

      if (taskToEdit && onUpdateTask) {
        // Edit Mode
        const updated: TaskItem = {
          ...taskToEdit,
          title: title.trim(),
          description: specMarkdown.slice(0, 150) || title.trim(),
          specMarkdown: specMarkdown,
          status: taskStatus,
          priority: priority,
          assignee: assignedMember,
          targetCycle: space,
          dueDate: dueDate,
          isRecurring: isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : undefined,
          customLinks: customLinks,
          subtasks: subtasks.map((s) => ({
            id: s.id,
            text: s.text,
            done: s.done,
            author: assignedMember?.initials || 'OP',
            time: 'Updated',
          })),
          linkedCrmDeal: linkedDeal ? { id: taskToEdit.linkedCrmDeal?.id || 'crm-link', name: linkedDeal, value: '$100k' } : undefined,
        };
        onUpdateTask(updated);
      } else {
        // Create Mode
        const newTask: Partial<TaskItem> = {
          title: title.trim(),
          description: specMarkdown.slice(0, 150) || title.trim(),
          specMarkdown: specMarkdown,
          status: taskStatus,
          priority: priority,
          assignee: assignedMember,
          tags: ['Deliverable'],
          isRecurring: isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : undefined,
          customLinks: customLinks,
          subtasks: subtasks.map((s) => ({
            id: s.id,
            text: s.text,
            done: s.done,
            author: assignedMember?.initials || 'OP',
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
          linkedCrmDeal: linkedDeal ? { id: 'crm-link-1', name: linkedDeal, value: '$100k' } : undefined,
        };
        onAddTask(newTask);
      }
    } else {
      // CRM Deal
      if (!dealTitle.trim()) return;
      const numVal = parseInt(dealValue.replace(/[^0-9]/g, ''), 10) || 50000;

      if (dealToEdit && onUpdateDeal) {
        // Edit Mode
        const updatedDeal: CrmDeal = {
          ...dealToEdit,
          title: dealTitle.trim(),
          company: dealCompany.trim() || 'Enterprise Client',
          value: numVal,
          formattedValue: `$${numVal.toLocaleString()}`,
          stage: dealStage,
          owner: dealOwner || 'Operator',
          targetCloseDate: dueDate || 'Q4 2026',
          customLinks: customLinks,
          competitor: dealCompetitor.trim() || undefined,
          lossReason: dealStage === 'Closed Lost' ? (dealLossReason.trim() || undefined) : undefined,
          wonReason: dealStage === 'Closed Won' ? (dealWonReason.trim() || undefined) : undefined,
          cycleDays: dealCycleDays ? Number(dealCycleDays) : undefined,
          closedAt: dealStage === 'Closed Won' || dealStage === 'Closed Lost' ? (dealToEdit.closedAt || new Date().toISOString()) : undefined,
        };
        onUpdateDeal(updatedDeal);
      } else if (onAddDeal) {
        // Create Mode
        const newDeal: Partial<CrmDeal> = {
          title: dealTitle.trim(),
          company: dealCompany.trim() || 'Enterprise Client',
          value: numVal,
          formattedValue: `$${numVal.toLocaleString()}`,
          stage: dealStage,
          probability: dealStage === 'Closed Won' ? 100 : dealStage === 'Closed Lost' ? 0 : dealStage === 'Contract & Legal' ? 85 : 60,
          targetCloseDate: dueDate || 'Q4 2026',
          owner: dealOwner || 'Operator',
          customLinks: customLinks,
          competitor: dealCompetitor.trim() || undefined,
          lossReason: dealStage === 'Closed Lost' ? (dealLossReason.trim() || undefined) : undefined,
          wonReason: dealStage === 'Closed Won' ? (dealWonReason.trim() || undefined) : undefined,
          cycleDays: dealCycleDays ? Number(dealCycleDays) : undefined,
          closedAt: dealStage === 'Closed Won' || dealStage === 'Closed Lost' ? new Date().toISOString() : undefined,
        };
        onAddDeal(newDeal);
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      {/* Centered Modal Card */}
      <div
        className="w-[680px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl flex flex-col overflow-hidden text-zinc-100 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================== */}
        {/* 1. STICKY MODAL HEADER                     */}
        {/* ========================================== */}
        <div className="shrink-0 p-5 pb-4 border-b border-[#27272a] flex flex-col gap-3 bg-[#121214]">
          {/* Top Row: Segmented Switcher & Close Keycap */}
          <div className="flex items-center justify-between">
            {/* If editing, show fixed badge; if creating, show segmented switcher */}
            {isEditing ? (
              <span className="font-mono text-[10.5px] uppercase font-bold text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2.5 py-1 rounded-[6px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span>{taskToEdit ? `Editing Task ${taskToEdit.id}` : `Editing Deal ${dealToEdit?.title}`}</span>
              </span>
            ) : (
              <div className="p-0.5 bg-[#18181b] rounded-[6px] flex items-center border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setModalType('task')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                    modalType === 'task'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">assignment</span>
                  <span>Task Deliverable</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('deal')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                    modalType === 'deal'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">monetization_on</span>
                  <span>CRM Opportunity</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 p-1 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <kbd className="font-mono text-[10px] bg-[#18181b] border border-[#27272a] px-1 py-0.5 rounded-[6px] text-zinc-400">
                Esc
              </kbd>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Headline & Engine Commit Context Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-zinc-100 tracking-tight leading-tight font-headline">
                {taskToEdit
                  ? 'Edit Task Deliverable'
                  : dealToEdit
                  ? 'Edit CRM Commercial Deal'
                  : modalType === 'task'
                  ? 'Create Task Deliverable'
                  : 'Create Enterprise CRM Deal'}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-mono bg-orange-950/40 text-orange-400 border border-orange-500/20 font-medium">
                {isEditing ? 'Live Edit' : 'Local Draft'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-orange-500">bolt</span>
              <span>
                {modalType === 'task'
                  ? 'Commits directly to persistent workspace storage'
                  : 'Saves deal record into workspace store and synchronizes with pipeline ARR'}
              </span>
            </p>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. FORM BODY (Scrollable Inner Canvas)     */}
        {/* ========================================== */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs bg-[#121214]">
            {/* A. TASK DELIVERABLE FORM */}
            {modalType === 'task' && (
              <div className="space-y-4">
                {/* Deliverable Title */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <span>Task Title</span>
                    <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Implement webhook retry mechanism with exponential backoff"
                    className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Grid: Space / Folder, Status, Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Target Cycle / Space
                    </label>
                    <input
                      type="text"
                      value={space}
                      onChange={(e) => setSpace(e.target.value)}
                      placeholder="e.g. Sprint 14, Core Engine"
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Execution Status
                    </label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Priority Level
                    </label>
                    <PriorityDropdown
                      variant="card"
                      priority={priority}
                      onChange={(p) => setPriority(p)}
                    />
                  </div>
                </div>

                {/* Grid: Assignee, Due Date, Linked Deal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Assignee
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate && dueDate.match(/^\d{4}-\d{2}-\d{2}$/) ? dueDate : ''}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] font-mono text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <RecurringCadenceSelector
                      isRecurring={isRecurring}
                      rule={recurrenceRule}
                      availableStatuses={statuses}
                      onToggle={setIsRecurring}
                      onRuleChange={setRecurrenceRule}
                    />
                  </div>
                </div>

                {/* Dynamic Cross-Module Linkages for Tasks */}
                <div className="p-3 rounded-[6px] bg-[#18181b]/40 border border-[#27272a]">
                  <DynamicEntityLinker
                    sourceModule="tasks"
                    customLinks={customLinks}
                    onChange={setCustomLinks}
                  />
                </div>

                {/* Technical Specification & Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Technical Spec &amp; Verification Gates
                    </label>
                    <span className="font-mono text-[10px] text-zinc-500">
                      Markdown &amp; Code Syntax
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={specMarkdown}
                    onChange={(e) => setSpecMarkdown(e.target.value)}
                    placeholder="Enter implementation spec, verification gates, architectural notes, or markdown..."
                    className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-orange-500 custom-scrollbar placeholder:text-zinc-600"
                  />
                </div>

                {/* Subtasks Checklist */}
                <div className="space-y-2 pt-2 border-t border-[#27272a]">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Acceptance Criteria &amp; Subtasks
                    </label>
                    {subtasks.length > 0 && (
                      <span className="font-mono text-[10px] text-orange-400 font-medium bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/20">
                        {completedSubtasksCount} of {subtasks.length} completed ({subtasksPercent}%)
                      </span>
                    )}
                  </div>

                  {subtasks.length > 0 && (
                    <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${subtasksPercent}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Checklist Items */}
                  <div className="space-y-1.5 pt-1">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-[6px] border border-[#27272a] hover:bg-[#18181b] bg-[#121214] transition-colors"
                      >
                        <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={st.done}
                            onChange={() => handleToggleSubtask(st.id)}
                            className="w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                          />
                          <span
                            className={`text-xs truncate ${
                              st.done ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'
                            }`}
                          >
                            {st.text}
                          </span>
                        </label>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] text-zinc-500">
                            {st.done ? 'Done' : 'Pending'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(st.id)}
                            className="w-5 h-5 rounded-[6px] text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove subtask"
                          >
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        </div>
                      </div>
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
                          className="flex-1 px-3 py-1.5 rounded-[6px] border border-orange-500 bg-[#18181b] text-zinc-100 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubtask}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-[6px] text-xs font-semibold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingSubtask(true)}
                        className="w-full py-1.5 px-2 text-left font-mono text-[11px] text-zinc-500 hover:text-zinc-200 flex items-center gap-1.5 hover:bg-[#18181b] rounded-[6px] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Add Subtask or Acceptance Gate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* B. CRM OPPORTUNITY FORM */}
            {modalType === 'deal' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <span>Opportunity Title</span>
                    <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder="e.g. Enterprise Platform Deployment License"
                    className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Client Organization
                    </label>
                    <input
                      type="text"
                      required
                      value={dealCompany}
                      onChange={(e) => setDealCompany(e.target.value)}
                      placeholder="e.g. GlobalBank Corporation"
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Deal Contract Value (ARR)
                    </label>
                    <input
                      type="text"
                      required
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="$180,000"
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] font-mono text-xs font-semibold text-emerald-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Pipeline Stage
                    </label>
                    <select
                      value={dealStage}
                      onChange={(e) => setDealStage(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Qualified Lead">Qualified Lead (10%)</option>
                      <option value="Discovery & Demo">Discovery & Demo (30%)</option>
                      <option value="Proposal Submitted">Proposal Submitted (60%)</option>
                      <option value="Contract & Legal">Contract & Legal (85%)</option>
                      <option value="Closed Won">Closed Won (100%)</option>
                      <option value="Closed Lost">Closed Lost (0%)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Deal Account Owner
                    </label>
                    <select
                      value={dealOwner}
                      onChange={(e) => setDealOwner(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Competitor (Battlecard)
                    </label>
                    <input
                      type="text"
                      value={dealCompetitor}
                      onChange={(e) => setDealCompetitor(e.target.value)}
                      placeholder="e.g. Salesforce, HubSpot, Linear"
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      Sales Cycle (Days)
                    </label>
                    <input
                      type="number"
                      value={dealCycleDays}
                      onChange={(e) => setDealCycleDays(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] font-mono text-xs text-zinc-100 focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {dealStage === 'Closed Lost' && (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <label className="font-mono text-[10px] text-rose-400 uppercase font-semibold flex items-center gap-1">
                      <span>Primary Loss Attribution Reason</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dealLossReason}
                      onChange={(e) => setDealLossReason(e.target.value)}
                      placeholder="e.g. Budget & Procurement Freeze, Legacy Contract Lock-in"
                      className="w-full px-3 py-2 rounded-[6px] border border-rose-500/40 bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-rose-500 placeholder:text-zinc-600"
                    />
                  </div>
                )}

                {dealStage === 'Closed Won' && (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <label className="font-mono text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
                      <span>Primary Winning Factor</span>
                    </label>
                    <input
                      type="text"
                      value={dealWonReason}
                      onChange={(e) => setDealWonReason(e.target.value)}
                      placeholder="e.g. Local-first SQLite VFS speed & privacy"
                      className="w-full px-3 py-2 rounded-[6px] border border-emerald-500/40 bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                    Target Close Date
                  </label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g. Q4 2026, Dec 15, 2026"
                    className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] font-mono text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Dynamic Cross-Module Linkages for CRM Deals */}
                <div className="p-3 rounded-[6px] bg-[#18181b]/40 border border-[#27272a]">
                  <DynamicEntityLinker
                    sourceModule="crm"
                    customLinks={customLinks}
                    onChange={setCustomLinks}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* 3. STICKY MODAL FOOTER                     */}
          {/* ========================================== */}
          <div className="shrink-0 p-4 border-t border-[#27272a] flex items-center justify-between bg-[#121214]">
            {/* Left: Engine Commit Status Indicator */}
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-200">Instant local commit (0.2ms)</span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="hidden sm:flex items-center gap-1 text-zinc-400">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                WAL Encrypted
              </span>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[6px] text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors cursor-pointer border border-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isEditing ? 'save' : modalType === 'task' ? 'add_task' : 'monetization_on'}
                </span>
                <span>
                  {isEditing
                    ? 'Save Changes'
                    : modalType === 'task'
                    ? 'Create Task'
                    : 'Create Deal'}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[6px] bg-white/20 text-white">
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
