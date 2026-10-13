import React, { useState, useEffect } from 'react';
import { TaskItem, TeamMember, TaskStatus } from '../types';
import { AssigneePopover } from './AssigneePopover';
import { StatusTransitionPopover } from './StatusTransitionPopover';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatDateDisplay, formatDateIso, parseTaskDueDate } from '../utils/dateUtils';
import { CalendarPopover, RecurringCadenceSelector, DynamicEntityLinker } from '../modules/shared';
import { PriorityDropdown } from './PriorityDropdown';

interface TaskInspectorProps {
  task: TaskItem;
  members: TeamMember[];
  onClose: () => void;
  onUpdateTask: (updatedTask: TaskItem) => void;
  onRequestDelete?: (task: TaskItem) => void;
  onEditTask?: (task: TaskItem) => void;
}

export const TaskInspector: React.FC<TaskInspectorProps> = ({
  task,
  members,
  onClose,
  onUpdateTask,
  onRequestDelete,
  onEditTask,
}) => {
  const { user, effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  const { listSettings, statuses } = useWorkspace();
  const isPoints = listSettings?.estimationUnit === 'Story Points';

  const authorName = user?.name || 'Operator';
  const authorInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP';
  const authorRole = user?.role || 'Operator';

  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [titleText, setTitleText] = useState(task.title);
  const [descText, setDescText] = useState(task.specMarkdown || task.description || '');
  const [activeTab, setActiveTab] = useState<'spec' | 'preview'>('spec');
  const [commentText, setCommentText] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activityList = Array.isArray(task.activity) ? task.activity : [];
  const subtaskList = Array.isArray(task.subtasks) ? task.subtasks : [];
  const defaultAssignee: TeamMember = {
    id: 'unassigned',
    name: 'Unassigned',
    role: 'Member',
    initials: 'UN',
    avatarBg: '#27272a',
    avatarColor: '#a1a1aa',
  };
  const assignee = task.assignee || defaultAssignee;

  // Sync title and description on task prop change
  useEffect(() => {
    setTitleText(task.title);
    setDescText(task.specMarkdown || task.description || '');
    setIsAssigneePopoverOpen(false);
    setIsStatusPopoverOpen(false);
  }, [task.id, task.title, task.description, task.specMarkdown]);

  const handleTitleBlur = () => {
    if (isReadOnly) return;
    if (titleText.trim() && titleText !== task.title) {
      onUpdateTask({ ...task, title: titleText.trim() });
    } else if (!titleText.trim()) {
      setTitleText(task.title);
    }
  };

  const handleDescBlur = () => {
    if (isReadOnly) return;
    const current = task.specMarkdown || task.description || '';
    if (descText !== current) {
      onUpdateTask({
        ...task,
        description: descText,
        specMarkdown: descText,
      });
    }
  };

  const handleStartDateChange = (newDateStr: string) => {
    if (isReadOnly) return;
    if (!newDateStr) {
      onUpdateTask({ ...task, startDate: '' });
    } else {
      const [y, m, d] = newDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      onUpdateTask({ ...task, startDate: formatDateDisplay(dateObj) });
    }
  };

  const handleDueDateChange = (newDateStr: string) => {
    if (isReadOnly) return;
    if (!newDateStr) {
      onUpdateTask({ ...task, dueDate: '' });
    } else {
      const [y, m, d] = newDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      onUpdateTask({ ...task, dueDate: formatDateDisplay(dateObj) });
    }
  };

  const handleDeleteSubtask = (subId: string) => {
    if (isReadOnly) return;
    const updatedSubtasks = subtaskList.filter((st) => st.id !== subId);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAssigneeChange = (member: TeamMember) => {
    if (isReadOnly) return;
    const updated = {
      ...task,
      assignee: member,
      activity: [
        {
          id: `act-${Date.now()}`,
          type: 'assignee' as const,
          author: authorName,
          initials: authorInitials,
          time: 'Just now',
          text: `reassigned task to ${member.name}`,
        },
        ...activityList,
      ],
    };
    onUpdateTask(updated);
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (isReadOnly) return;
    const updated = {
      ...task,
      status,
      activity: [
        {
          id: `act-${Date.now()}`,
          type: 'status' as const,
          author: authorName,
          initials: authorInitials,
          time: 'Just now',
          text: `transitioned status to ${status}`,
        },
        ...activityList,
      ],
    };
    onUpdateTask(updated);
  };

  const handleToggleSubtask = (subId: string) => {
    if (isReadOnly) return;
    const updatedSubtasks = subtaskList.map((st) =>
      st.id === subId ? { ...st, done: !st.done } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddSubtask = () => {
    if (isReadOnly) return;
    if (!newSubtaskText.trim()) return;
    const newSt = {
      id: `sub-${Date.now()}`,
      text: newSubtaskText.trim(),
      done: false,
      author: authorInitials,
      time: 'Just now',
    };
    onUpdateTask({ ...task, subtasks: [...subtaskList, newSt] });
    setNewSubtaskText('');
    setIsAddingSubtask(false);
  };

  const handleAddComment = () => {
    if (isReadOnly) return;
    if (!commentText.trim()) return;
    const newComment = {
      id: `act-${Date.now()}`,
      type: 'comment' as const,
      author: authorName,
      initials: authorInitials,
      role: authorRole,
      time: 'Just now',
      text: commentText.trim(),
    };
    onUpdateTask({
      ...task,
      activity: [newComment, ...activityList],
    });
    setCommentText('');
  };

  const doneSubtasksCount = subtaskList.filter((s) => s.done).length;
  const totalSubtasks = subtaskList.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((doneSubtasksCount / totalSubtasks) * 100) : 0;

  return (
    <section className={`absolute top-0 right-0 bottom-0 bg-[#121214] border-l border-[#27272a] shadow-2xl z-40 flex flex-col justify-between overflow-hidden text-zinc-100 animate-in slide-in-from-right duration-200 transition-all ${
      isFullscreen ? 'w-full' : 'w-[580px] max-w-[95vw]'
    }`}>
      {/* Slide-Over Header */}
      <div className="border-b border-[#27272a] px-6 py-3 flex items-center justify-between bg-[#0c0a09] shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="bg-orange-950/40 text-orange-400 font-bold px-2 py-0.5 rounded-[6px] border border-orange-500/20">
            {task.id}
          </span>
          {isReadOnly && (
            <span className="bg-zinc-800 text-zinc-400 font-mono text-[10px] px-2 py-0.5 rounded-[6px] border border-zinc-700">
              Read-Only
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#18181b] hover:text-zinc-100 transition-colors relative cursor-pointer"
            title={copiedLink ? 'Link copied!' : 'Copy task link'}
          >
            <span className={`material-symbols-outlined text-[17px] ${copiedLink ? 'text-emerald-400' : ''}`}>
              {copiedLink ? 'check' : 'link'}
            </span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#18181b] transition-colors cursor-pointer ${
              isFullscreen ? 'text-orange-400 bg-[#18181b]' : 'hover:text-zinc-100'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isFullscreen ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>
          {onEditTask && !isReadOnly && (
            <button
              onClick={() => onEditTask(task)}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-orange-950/40 hover:text-orange-400 transition-colors cursor-pointer"
              title="Edit deliverable details in modal"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
            </button>
          )}
          {onRequestDelete && !isReadOnly && (
            <button
              onClick={() => onRequestDelete(task)}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-rose-950/40 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete Deliverable Permanently..."
            >
              <span className="material-symbols-outlined text-[17px]">delete</span>
            </button>
          )}
          <div className="h-4 w-px bg-zinc-800 mx-1"></div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#18181b] hover:text-zinc-100 transition-colors cursor-pointer"
            title="Close Panel (Esc)"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Slide-Over Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5 relative bg-[#121214]">
        {/* Title & Badges Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            {/* Priority Badge */}
            <span className={`font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-[6px] flex items-center gap-1 shadow-sm ${
              task.priority === 'Urgent'
                ? 'bg-red-950/40 text-red-400 border border-red-500/30'
                : task.priority === 'High'
                ? 'bg-orange-600 text-white'
                : task.priority === 'Medium'
                ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                : 'bg-[#18181b] text-zinc-300 border border-[#27272a]'
            }`}>
              <span className="material-symbols-outlined text-[12px]">priority_high</span>
              <span>{task.priority} Priority</span>
            </span>

            {/* Start Date with Calendar Popover */}
            <CalendarPopover
              value={task.startDate || ''}
              onChange={(newDateStr) => handleStartDateChange(newDateStr)}
              trigger={
                <button
                  type="button"
                  className={`bg-[#18181b] text-zinc-300 border border-[#27272a] hover:border-orange-500/50 font-mono text-[10px] px-2 py-0.5 rounded-[6px] flex items-center gap-1.5 transition-colors ${
                    isReadOnly ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  title={isReadOnly ? 'Start date' : 'Click to pick start date from calendar'}
                >
                  <span className="material-symbols-outlined text-[13px] text-orange-400">play_arrow</span>
                  <span>Start {task.startDate || 'Unscheduled'}</span>
                </button>
              }
            />

            {/* Due Date with Calendar Popover */}
            <CalendarPopover
              value={task.dueDate || ''}
              onChange={(newDateStr) => handleDueDateChange(newDateStr)}
              trigger={
                <button
                  type="button"
                  className={`bg-[#18181b] text-zinc-300 border border-[#27272a] hover:border-orange-500/50 font-mono text-[10px] px-2 py-0.5 rounded-[6px] flex items-center gap-1.5 transition-colors ${
                    isReadOnly ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  title={isReadOnly ? 'Due date' : 'Click to pick due date from calendar'}
                >
                  <span className="material-symbols-outlined text-[13px] text-amber-400">calendar_today</span>
                  <span>Due {task.dueDate || 'Unscheduled'}</span>
                </button>
              }
            />

            {/* Recurring Status Indicator */}
            {task.isRecurring && (
              <span className="bg-orange-950/40 text-orange-400 border border-orange-500/30 font-mono text-[10px] px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">repeat</span>
                <span className="capitalize">{task.recurrenceRule || 'Weekly'}</span>
              </span>
            )}
          </div>

          {/* Editable Title Field */}
          <div className="group relative">
            <input
              type="text"
              value={titleText}
              disabled={isReadOnly}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className={`w-full font-bold text-lg text-zinc-100 bg-transparent border-0 border-b border-transparent p-0 pb-1 leading-snug font-headline ${
                isReadOnly ? 'cursor-default' : 'hover:border-zinc-700 focus:border-orange-500 focus:ring-0 cursor-text transition-colors'
              }`}
            />
          </div>
        </div>

        {/* Properties Matrix Grid */}
        <div className="bg-[#18181b] rounded-[6px] p-3.5 border border-[#27272a] grid grid-cols-2 gap-y-3.5 gap-x-4 relative">
          {/* Assignee Field (ACTIVE ANCHOR ELEMENT) */}
          <div className="flex flex-col gap-1 relative">
            <span className="font-mono text-[10px] text-zinc-400 font-medium">ASSIGNEE</span>
            <div
              onClick={() => {
                if (isReadOnly) return;
                setIsAssigneePopoverOpen(!isAssigneePopoverOpen);
                setIsStatusPopoverOpen(false);
              }}
              className={`flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border border-[#27272a] shadow-sm transition-all ${
                isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
                  style={{
                    backgroundColor: assignee.avatarBg || '#ea580c',
                    color: assignee.avatarColor || '#ffffff',
                  }}
                >
                  {assignee.initials}
                </div>
                <span className="text-xs font-semibold text-zinc-100">
                  {assignee.name}
                </span>
              </div>
              {!isReadOnly && (
                <span className="material-symbols-outlined text-orange-400 text-[16px]">
                  expand_more
                </span>
              )}
            </div>
          </div>

          {/* Status Field (ACTIVE ANCHOR ELEMENT) */}
          <div className="flex flex-col gap-1 relative">
            <span className="font-mono text-[10px] text-zinc-400 font-medium">STATUS</span>
            <div
              onClick={() => {
                if (isReadOnly) return;
                setIsStatusPopoverOpen(!isStatusPopoverOpen);
                setIsAssigneePopoverOpen(false);
              }}
              className={`flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border border-[#27272a] shadow-sm transition-all ${
                isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-orange-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-orange-400">
                  {task.status}
                </span>
              </div>
              {!isReadOnly && (
                <span className="material-symbols-outlined text-orange-400 text-[16px]">
                  expand_more
                </span>
              )}
            </div>
          </div>

          {/* Priority Field */}
          <div className="flex flex-col gap-1 relative">
            <span className="font-mono text-[10px] text-zinc-400 font-medium">PRIORITY</span>
            <PriorityDropdown
              variant="card"
              priority={task.priority}
              disabled={isReadOnly}
              onChange={(newPriority) => {
                onUpdateTask({ ...task, priority: newPriority });
              }}
            />
          </div>

          {/* Story Points Field (When Primary) */}
          {isPoints && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 font-medium">STORY POINTS</span>
                <span className="font-mono text-[9px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1 py-0.2 rounded-[6px]">
                  Default
                </span>
              </div>
              <div
                className={`flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border border-orange-500/40 shadow-sm transition-all ${
                  isReadOnly ? 'cursor-default' : 'hover:border-orange-500 focus-within:border-orange-500'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-1.5">
                  <span className="material-symbols-outlined text-orange-400 text-[16px] shrink-0">
                    tag
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    disabled={isReadOnly}
                    value={task.estimation?.points ?? 0}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                      onUpdateTask({
                        ...task,
                        estimation: {
                          hours: task.estimation?.hours ?? 0,
                          points: val,
                        },
                      });
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-zinc-100 focus:outline-none text-left"
                  />
                </div>
                <span className="font-mono text-[11px] text-zinc-400 font-medium shrink-0">
                  pts
                </span>
              </div>
            </div>
          )}

          {/* Estimated Hours Field */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 font-medium">ESTIMATED HOURS</span>
              {!isPoints && (
                <span className="font-mono text-[9px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1 py-0.2 rounded-[6px]">
                  Default
                </span>
              )}
            </div>
            <div
              className={`flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border shadow-sm transition-all ${
                !isPoints ? 'border-orange-500/40' : 'border-[#27272a]'
              } ${
                isReadOnly ? 'cursor-default' : 'hover:border-zinc-700 focus-within:border-orange-500'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-1.5">
                <span className="material-symbols-outlined text-orange-400 text-[16px] shrink-0">
                  schedule
                </span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  disabled={isReadOnly}
                  value={task.estimation?.hours ?? 0}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                    onUpdateTask({
                      ...task,
                      estimation: {
                        hours: val,
                        points: task.estimation?.points ?? 0,
                      },
                    });
                  }}
                  className="w-full bg-transparent font-mono text-xs font-semibold text-zinc-100 focus:outline-none text-left"
                />
              </div>
              <span className="font-mono text-[11px] text-zinc-400 font-medium shrink-0">
                hrs
              </span>
            </div>
          </div>

          {/* Story Points Field (When Not Primary) */}
          {!isPoints && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-zinc-400 font-medium">STORY POINTS</span>
              <div
                className={`flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border border-[#27272a] shadow-sm transition-all ${
                  isReadOnly ? 'cursor-default' : 'hover:border-zinc-700 focus-within:border-orange-500'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-1.5">
                  <span className="material-symbols-outlined text-orange-400 text-[16px] shrink-0">
                    tag
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    disabled={isReadOnly}
                    value={task.estimation?.points ?? 0}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                      onUpdateTask({
                        ...task,
                        estimation: {
                          hours: task.estimation?.hours ?? 0,
                          points: val,
                        },
                      });
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-zinc-100 focus:outline-none text-left"
                  />
                </div>
                <span className="font-mono text-[11px] text-zinc-400 font-medium shrink-0">
                  pts
                </span>
              </div>
            </div>
          )}

          {/* Linked CRM Deal */}
          {task.linkedCrmDeal && (
            <div className="col-span-2 flex items-center justify-between pt-2 border-t border-[#27272a]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">handshake</span>
                  Linked CRM Deal:
                </span>
                <span className="bg-[#121214] hover:bg-zinc-800 border border-[#27272a] px-2.5 py-0.5 rounded-[6px] text-xs flex items-center gap-1.5 transition-colors cursor-pointer group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="font-semibold text-orange-400 group-hover:underline">
                    {task.linkedCrmDeal.name}
                  </span>
                  <span className="material-symbols-outlined text-[12px] text-zinc-400">
                    open_in_new
                  </span>
                </span>
              </div>
              <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-2 py-0.5 rounded-[6px] font-semibold">
                High Value
              </span>
            </div>
          )}

          {/* Recurring Task Selector */}
          <div className="col-span-2 pt-2 border-t border-[#27272a]">
            <RecurringCadenceSelector
              isRecurring={!!task.isRecurring}
              rule={task.recurrenceRule}
              availableStatuses={statuses}
              readOnly={isReadOnly}
              onToggle={(isRecurring) => {
                if (isReadOnly) return;
                onUpdateTask({ ...task, isRecurring });
              }}
              onRuleChange={(rule) => {
                if (isReadOnly) return;
                onUpdateTask({ ...task, isRecurring: true, recurrenceRule: rule });
              }}
            />
          </div>

          {/* Dynamic Cross-Module Linkages (Contacts, Deals, Docs) */}
          <div className="col-span-2 pt-2 border-t border-[#27272a]">
            <DynamicEntityLinker
              sourceModule="tasks"
              customLinks={task.customLinks || {}}
              readOnly={isReadOnly}
              onChange={(updatedLinks) => {
                if (isReadOnly) return;
                onUpdateTask({ ...task, customLinks: updatedLinks });
              }}
            />
          </div>

          {/* Standard Date Fields: Date Created & Completed */}
          <div className="col-span-2 pt-2 border-t border-[#27272a] grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-zinc-400 font-medium">DATE CREATED</span>
              <span className="font-mono text-xs text-zinc-300">
                {task.createdAt ? new Date(task.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-zinc-400 font-medium">DATE COMPLETED</span>
              <span className="font-mono text-xs text-zinc-300">
                {task.completedAt ? new Date(task.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : (task.status === 'Done' ? 'Completed' : 'Not completed')}
              </span>
            </div>
          </div>
        </div>

        {/* Popover Placements */}
        {isAssigneePopoverOpen && !isReadOnly && (
          <AssigneePopover
            currentAssigneeId={assignee.id}
            members={members}
            onSelectMember={handleAssigneeChange}
            onClose={() => setIsAssigneePopoverOpen(false)}
          />
        )}

        {isStatusPopoverOpen && !isReadOnly && (
          <StatusTransitionPopover
            currentStatus={task.status}
            timeInStage={task.timeInStage}
            onSelectStatus={handleStatusChange}
            onClose={() => setIsStatusPopoverOpen(false)}
          />
        )}

        {/* Specifications & Context Description Tabbed Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('spec')}
                className={`text-xs font-semibold pb-1.5 -mb-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'spec'
                    ? 'border-b-2 border-orange-500 text-orange-400'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span>Specification</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`text-xs font-medium pb-1.5 -mb-2 transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'border-b-2 border-orange-500 text-orange-400'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Preview
              </button>
            </div>

            {/* Rich text mini toolbar */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  if (isReadOnly) return;
                  const updated = descText + (descText.endsWith('\n') || !descText ? '**bold text** ' : ' **bold text** ');
                  setDescText(updated);
                  onUpdateTask({ ...task, description: updated, specMarkdown: updated });
                }}
                className="p-1 hover:bg-[#18181b] rounded-[6px] hover:text-orange-400 cursor-pointer"
                title="Bold (**text**)"
              >
                <span className="material-symbols-outlined text-[15px]">format_bold</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isReadOnly) return;
                  const updated = descText + (descText.endsWith('\n') || !descText ? '*italic text* ' : ' *italic text* ');
                  setDescText(updated);
                  onUpdateTask({ ...task, description: updated, specMarkdown: updated });
                }}
                className="p-1 hover:bg-[#18181b] rounded-[6px] hover:text-orange-400 cursor-pointer"
                title="Italic (*text*)"
              >
                <span className="material-symbols-outlined text-[15px]">format_italic</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isReadOnly) return;
                  const updated = descText + (descText.endsWith('\n') || !descText ? '`code` ' : ' `code` ');
                  setDescText(updated);
                  onUpdateTask({ ...task, description: updated, specMarkdown: updated });
                }}
                className="p-1 hover:bg-[#18181b] rounded-[6px] hover:text-orange-400 cursor-pointer"
                title="Inline Code (`code`)"
              >
                <span className="material-symbols-outlined text-[15px]">code</span>
              </button>
              <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1 rounded-[6px]">
                Markdown
              </span>
            </div>
          </div>

          {activeTab === 'spec' ? (
            <div className="flex flex-col gap-2">
              <textarea
                rows={6}
                disabled={isReadOnly}
                value={descText}
                onChange={(e) => setDescText(e.target.value)}
                onBlur={handleDescBlur}
                placeholder={isReadOnly ? 'No specification provided.' : 'Enter task specification, technical requirements, acceptance criteria...'}
                className={`w-full bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 text-xs leading-relaxed text-zinc-200 focus:outline-none transition-colors font-mono resize-y ${
                  isReadOnly ? 'cursor-default' : 'focus:border-orange-500'
                }`}
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>Auto-saves on blur</span>
                {descText !== (task.specMarkdown || task.description || '') && (
                  <button
                    type="button"
                    onClick={handleDescBlur}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-[6px] text-xs font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 text-xs leading-relaxed text-zinc-200 space-y-2 whitespace-pre-wrap font-sans">
              {descText ? (
                <p className="text-zinc-300">{descText}</p>
              ) : (
                <p className="text-zinc-500 italic">No specification written yet.</p>
              )}
              <div className="p-2.5 rounded-[6px] bg-[#121214] border-l-2 border-orange-500 text-[11px] text-zinc-400 space-y-1 font-mono">
                <div className="font-semibold text-orange-400">ARCHITECTURAL REQUIREMENTS</div>
                <div>Maintain strict 6px radius standard and obsidian black/electric orange tokens.</div>
              </div>
            </div>
          )}
        </div>

        {/* Subtask Checklist with Progress Indicator */}
        <div className="flex flex-col gap-2.5 bg-[#18181b] rounded-[6px] p-3.5 border border-[#27272a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-100 font-headline">Subtasks</span>
              <span className="bg-orange-950/40 text-orange-400 border border-orange-500/20 font-mono text-[10px] px-2 py-0.5 rounded-[6px] font-bold">
                {doneSubtasksCount} / {totalSubtasks} done
              </span>
            </div>
            <span className="font-mono text-xs text-orange-400 font-bold">
              {progressPercent}% completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#121214] h-2 rounded-full overflow-hidden border border-[#27272a]">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Checklist Items */}
          <div className="flex flex-col gap-1 pt-1">
            {subtaskList.map((st) => (
              <div
                key={st.id}
                className={`flex items-center justify-between gap-2 p-1.5 rounded-[6px] transition-colors group ${
                  isReadOnly ? 'cursor-default' : 'hover:bg-[#121214]'
                }`}
              >
                <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={st.done}
                    onChange={() => handleToggleSubtask(st.id)}
                    className="w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer shrink-0"
                  />
                  <span
                    className={`text-xs transition-colors truncate ${
                      st.done
                        ? 'text-zinc-500 line-through group-hover:text-zinc-300'
                        : 'text-zinc-200 font-medium group-hover:text-orange-400'
                    }`}
                  >
                    {st.text}
                  </span>
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-zinc-500">
                    {st.author} • {st.time}
                  </span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteSubtask(st.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 hover:bg-rose-950/40 rounded-[6px] text-zinc-500 transition-all cursor-pointer"
                      title="Delete subtask"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!isReadOnly && (
              isAddingSubtask ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    autoFocus
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Enter subtask title..."
                    className="flex-1 bg-[#121214] border border-orange-500 rounded-[6px] px-2.5 py-1 text-xs text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-2.5 py-1 bg-orange-600 text-white text-xs font-semibold rounded-[6px] cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubtask(false)}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-left text-xs text-orange-400 hover:underline font-medium pt-1 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add subtask</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Activity & Audit Log Section */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
            <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5 font-headline">
              <span className="material-symbols-outlined text-[16px] text-orange-400">history</span>
              Activity &amp; Audit Log
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {activityList.length} events logged
            </span>
          </div>

          {activityList.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500 font-mono italic">
              No activity logged yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-zinc-800">
              {activityList.map((act) => (
                <div key={act.id} className="flex items-start gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-orange-950/40 border border-orange-500/30 flex items-center justify-center z-10 text-orange-400 font-mono text-[10px] font-bold">
                    {act.initials}
                  </div>
                  <div className="flex flex-col flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">
                        <strong className="font-semibold text-zinc-100">{act.author}</strong>{' '}
                        {act.text}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {act.time}
                      </span>
                    </div>
                    {act.detail && (
                      <p className="text-[11px] text-zinc-500 italic mt-0.5">
                        {act.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-Over Footer Action Dock */}
      <div className="border-t border-[#27272a] p-3 bg-[#0c0a09] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-1 mr-3">
          <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-mono text-[11px] flex items-center justify-center font-bold">
            {authorInitials}
          </div>
          <input
            type="text"
            disabled={isReadOnly}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder={isReadOnly ? 'Read-only view — comments disabled' : 'Write a comment or type @ to mention...'}
            className={`w-full bg-[#18181b] border border-[#27272a] rounded-[6px] px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none ${
              isReadOnly ? 'opacity-60 cursor-not-allowed' : 'focus:border-orange-500'
            }`}
          />
        </div>
        <button
          type="button"
          disabled={isReadOnly || !commentText.trim()}
          onClick={handleAddComment}
          className={`text-white text-xs font-semibold px-3.5 py-1.5 rounded-[6px] shadow-sm flex items-center gap-1 transition-all ${
            isReadOnly || !commentText.trim()
              ? 'bg-zinc-800 text-zinc-500 opacity-60 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 active:scale-[0.98] cursor-pointer'
          }`}
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-[13px]">send</span>
        </button>
      </div>
    </section>
  );
};
