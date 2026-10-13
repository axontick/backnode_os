import React, { useState, useMemo } from 'react';
import { Repeat } from 'lucide-react';
import { TaskItem, TaskStatus, PriorityLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatEstimationValue } from '../utils/taskSpaceSettingsUtils';
import { PriorityDropdown } from './PriorityDropdown';
import { formatRecurrenceLabel } from '../utils/recurrenceUtils';

interface ListViewProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (task: TaskItem) => void;
  onQuickStatusChange: (taskId: string, status: TaskStatus) => void;
  onMoveTaskStatus?: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => void;
  onOpenCreateTask?: () => void;
  groupBy?: 'status' | 'priority' | 'assignee';
  visibleColumns?: Record<string, boolean>;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onQuickStatusChange,
  onMoveTaskStatus,
  onOpenCreateTask,
  groupBy = 'status',
  visibleColumns,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  const { statuses, listSettings, members, handleUpdateTask } = useWorkspace();
  const isPoints = listSettings?.estimationUnit === 'Story Points';

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Expanded subtask checklists per task ID
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  // Local subtask check state
  const [localSubtasks, setLocalSubtasks] = useState<Record<string, boolean>>({});

  const isColVisible = (colKey: string, defaultVal = true) => {
    if (visibleColumns && visibleColumns[colKey] !== undefined) {
      return visibleColumns[colKey];
    }
    return defaultVal;
  };

  const activeCustomFields = useMemo(() => {
    if (!visibleColumns) return [];
    return Object.keys(visibleColumns)
      .filter((k) => k.startsWith('custom:') && visibleColumns[k])
      .map((k) => k.slice(7));
  }, [visibleColumns]);

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey] !== undefined ? !prev[sectionKey] : false,
    }));
  };

  const toggleChecklist = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChecklists((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleToggleSubtask = (subtaskId: string, currentDone: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    setLocalSubtasks((prev) => ({
      ...prev,
      [subtaskId]: prev[subtaskId] !== undefined ? !prev[subtaskId] : !currentDone,
    }));
  };

  const isSubtaskDone = (subtaskId: string, originalDone: boolean) => {
    return localSubtasks[subtaskId] !== undefined ? localSubtasks[subtaskId] : originalDone;
  };

  // Group definitions based on `groupBy` ('status' | 'priority' | 'assignee')
  const dynamicGroups = useMemo(() => {
    if (groupBy === 'priority') {
      const priorityConfigs: { id: PriorityLevel; label: string; color: string; icon: string; badgeClass: string }[] = [
        {
          id: 'Urgent',
          label: 'URGENT',
          color: '#ef4444',
          icon: 'bolt',
          badgeClass: 'bg-red-950/40 text-red-400 border border-red-500/30',
        },
        {
          id: 'High',
          label: 'HIGH',
          color: '#f97316',
          icon: 'flag',
          badgeClass: 'bg-orange-950/40 text-orange-400 border border-orange-500/30',
        },
        {
          id: 'Medium',
          label: 'MEDIUM',
          color: '#3b82f6',
          icon: 'flag',
          badgeClass: 'bg-blue-950/40 text-blue-400 border border-blue-500/30',
        },
        {
          id: 'Low',
          label: 'LOW',
          color: '#71717a',
          icon: 'flag',
          badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        },
      ];

      return priorityConfigs.map((p) => ({
        key: p.id,
        label: p.label,
        color: p.color,
        icon: p.icon,
        badgeClass: p.badgeClass,
        filter: (t: TaskItem) => t.priority === p.id,
        onDropTarget: (taskId: string) => handleUpdateTask({ id: taskId, priority: p.id }),
      }));
    }

    if (groupBy === 'assignee') {
      const memberGroups = members.map((m) => ({
        key: m.id,
        label: m.name.toUpperCase(),
        color: m.avatarBg || '#ea580c',
        initials: m.initials,
        badgeClass: 'bg-orange-950/40 text-orange-400 border border-orange-500/30',
        filter: (t: TaskItem) =>
          t.assigneeId === m.id ||
          t.assignee?.id === m.id ||
          (t.assignee?.name && t.assignee.name.toLowerCase() === m.name.toLowerCase()),
        onDropTarget: (taskId: string) =>
          handleUpdateTask({ id: taskId, assigneeId: m.id, assignee: m }),
      }));

      memberGroups.push({
        key: 'unassigned',
        label: 'UNASSIGNED',
        color: '#71717a',
        initials: 'UA',
        badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        filter: (t: TaskItem) => !t.assigneeId && !t.assignee?.id,
        onDropTarget: (taskId: string) =>
          handleUpdateTask({ id: taskId, assigneeId: undefined, assignee: undefined as any }),
      });

      return memberGroups;
    }

    // Default: Group by Status
    if (statuses && statuses.length > 0) {
      const seen = new Set<string>();
      return [...statuses]
        .filter((st) => {
          const key = (st.name || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((st) => ({
          key: st.name,
          status: st.name as TaskStatus,
          label: st.name.toUpperCase(),
          color: st.color || '#ea580c',
          badgeClass:
            st.name === 'In Progress'
              ? 'bg-orange-950/50 text-orange-400 border border-orange-500/30'
              : st.name === 'Done'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700',
          filter: (t: TaskItem) => t.status === st.name,
          onDropTarget: (taskId: string) => onMoveTaskStatus?.(taskId, st.name as TaskStatus),
        }));
    }

    return [
      {
        key: 'In Progress',
        status: 'In Progress' as TaskStatus,
        label: 'IN PROGRESS',
        color: '#ea580c',
        badgeClass: 'bg-orange-950/50 text-orange-400 border border-orange-500/30',
        filter: (t: TaskItem) => t.status === 'In Progress',
        onDropTarget: (taskId: string) => onMoveTaskStatus?.(taskId, 'In Progress'),
      },
      {
        key: 'In Review',
        status: 'In Review' as TaskStatus,
        label: 'IN REVIEW',
        color: '#f59e0b',
        badgeClass: 'bg-amber-950/40 text-amber-400 border border-amber-500/30',
        filter: (t: TaskItem) => t.status === 'In Review',
        onDropTarget: (taskId: string) => onMoveTaskStatus?.(taskId, 'In Review'),
      },
      {
        key: 'Blocked',
        status: 'Blocked' as TaskStatus,
        label: 'BLOCKED',
        color: '#ef4444',
        badgeClass: 'bg-red-950/40 text-red-400 border border-red-500/30',
        filter: (t: TaskItem) => t.status === 'Blocked',
        onDropTarget: (taskId: string) => onMoveTaskStatus?.(taskId, 'Blocked'),
      },
      {
        key: 'Backlog',
        status: 'Backlog' as TaskStatus,
        label: 'BACKLOG',
        color: '#71717a',
        badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        filter: (t: TaskItem) => t.status === 'Backlog',
        onDropTarget: (taskId: string) => onMoveTaskStatus?.(taskId, 'Backlog'),
      },
      {
        key: 'Done',
        status: 'Done' as TaskStatus,
        label: 'DONE',
        color: '#10b981',
        badgeClass: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30',
        filter: (t: TaskItem) => t.status === 'Done',
        onDropTarget: (taskId: string) => onMoveTaskStatus?.(taskId, 'Done'),
      },
    ];
  }, [groupBy, statuses, members, handleUpdateTask, onMoveTaskStatus]);

  const totalHours = tasks.reduce((acc, t) => acc + (t.estimation?.hours || 0), 0);
  const totalPoints = tasks.reduce((acc, t) => acc + (t.estimation?.points || 0), 0);

  const renderTaskRow = (t: TaskItem) => {
    const isSelected = t.id === selectedTaskId;
    const hasSubtasks = t.subtasks && t.subtasks.length > 0;
    const isChecklistOpen = expandedChecklists[t.id] ?? false;

    const completedSubtasksCount = hasSubtasks
      ? t.subtasks.filter((st) => isSubtaskDone(st.id, st.done)).length
      : 0;

    const isDraggingThis = draggingTaskId === t.id;
    const isDropBefore = dragOverTaskId === t.id && dropPosition === 'before' && !isDraggingThis;
    const isDropAfter = dragOverTaskId === t.id && dropPosition === 'after' && !isDraggingThis;

    return (
      <div
        key={t.id}
        draggable={!isReadOnly}
        onDragStart={(e) => {
          if (isReadOnly) return;
          e.dataTransfer.setData('text/plain', t.id);
          e.dataTransfer.effectAllowed = 'move';
          setDraggingTaskId(t.id);
        }}
        onDragEnd={() => {
          setDraggingTaskId(null);
          setDragOverSection(null);
          setDragOverTaskId(null);
          setDropPosition(null);
        }}
        onDragOver={(e) => {
          if (isReadOnly || !draggingTaskId || draggingTaskId === t.id) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const pos = e.clientY < midY ? 'before' : 'after';
          setDropPosition(pos);
          setDragOverTaskId(t.id);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          if (dragOverTaskId === t.id) {
            setDragOverTaskId(null);
            setDropPosition(null);
          }
        }}
        onDrop={(e) => {
          if (isReadOnly) return;
          e.preventDefault();
          e.stopPropagation();
          const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
          if (sourceTaskId && sourceTaskId !== t.id) {
            onMoveTaskStatus?.(sourceTaskId, t.status, undefined, t.id, dropPosition || 'before');
          }
          setDraggingTaskId(null);
          setDragOverSection(null);
          setDragOverTaskId(null);
          setDropPosition(null);
        }}
        className={`group border rounded-[6px] p-3 transition-all relative ${
          isDraggingThis
            ? 'opacity-40 border-dashed border-orange-500 bg-orange-950/20'
            : isSelected
            ? 'bg-orange-950/20 border-orange-500 shadow-sm'
            : 'bg-[#121214] border-[#27272a] hover:border-orange-500/50 hover:bg-[#18181b]'
        } ${
          isDropBefore
            ? 'border-t-2 border-t-orange-500'
            : isDropAfter
            ? 'border-b-2 border-b-orange-500'
            : ''
        }`}
      >
        {/* Parent Row Content */}
        <div
          onClick={() => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0) return;
            onSelectTask(t);
          }}
          className="flex items-center justify-between cursor-pointer"
        >
          {/* Left Column Area: Drag handle, checkbox, ID, Title */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
            {!isReadOnly && (
              <span
                className="material-symbols-outlined text-[15px] text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 select-none"
                title="Drag to reorder or reassign"
              >
                drag_indicator
              </span>
            )}

            {/* Quick Status Check Toggle */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={(e) => {
                e.stopPropagation();
                if (isReadOnly) return;
                onQuickStatusChange(t.id, t.status === 'Done' ? 'In Progress' : 'Done');
              }}
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                isReadOnly ? 'cursor-default opacity-70' : 'cursor-pointer'
              } ${
                t.status === 'Done'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-zinc-600 hover:border-orange-500 bg-transparent'
              }`}
              title={isReadOnly ? 'Read-only view' : t.status === 'Done' ? 'Mark incomplete' : 'Mark complete'}
            >
              {t.status === 'Done' ? (
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-transparent hover:bg-orange-500/40"></span>
              )}
            </button>

            {/* Task ID */}
            {isColVisible('id') && (
              <span
                onMouseDown={(e) => e.stopPropagation()}
                className="font-mono text-zinc-400 text-[11px] shrink-0 font-semibold cursor-text select-text"
              >
                {t.id}
              </span>
            )}

            {/* Title & tags */}
            {isColVisible('title') && (
              <span
                onMouseDown={(e) => e.stopPropagation()}
                className={`font-medium truncate transition-colors text-xs cursor-text select-text ${
                  t.status === 'Done'
                    ? 'line-through text-zinc-500'
                    : 'text-zinc-100 group-hover:text-orange-400'
                }`}
              >
                {t.title}
              </span>
            )}

            {t.isRecurring && (
              <span
                className="inline-flex items-center gap-1 font-mono text-[9px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded-[6px] shrink-0"
                title={formatRecurrenceLabel(t.recurrenceRule)}
              >
                <Repeat className="w-2.5 h-2.5 text-orange-400" />
                <span>Recurring</span>
              </span>
            )}

            {/* Subtask pill trigger */}
            {hasSubtasks && (
              <button
                type="button"
                onClick={(e) => toggleChecklist(t.id, e)}
                className={`flex items-center gap-1 font-mono px-1.5 py-0.5 rounded-[6px] text-[10px] shrink-0 transition-colors cursor-pointer ${
                  isChecklistOpen
                    ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                    : 'bg-[#18181b] text-zinc-400 border border-[#27272a] hover:text-zinc-200'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isChecklistOpen ? 'expand_less' : 'checklist'}
                </span>
                <span>
                  {completedSubtasksCount}/{t.subtasks.length} subtasks
                </span>
              </button>
            )}
          </div>

          {/* Right Matrix Columns Area */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Status Column (Visible when toggled on, especially useful when grouped by Priority/Assignee) */}
            {isColVisible('status') && (
              <span
                className={`w-20 text-center font-mono text-[10px] px-1.5 py-0.5 rounded-[6px] shrink-0 ${
                  t.status === 'Done'
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                    : t.status === 'In Progress'
                    ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                    : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                }`}
              >
                {t.status}
              </span>
            )}

            {/* Estimation Column */}
            {isColVisible('estimation') && (
              <div className="w-16 flex justify-center">
                {t.estimation ? (
                  <span
                    className="font-mono text-[10px] text-zinc-400 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[6px]"
                    title={isPoints ? 'Story Points' : 'Estimated Hours'}
                  >
                    {formatEstimationValue(t.estimation, listSettings?.estimationUnit)}
                  </span>
                ) : (
                  <span className="font-mono text-zinc-600 text-[10px]">—</span>
                )}
              </div>
            )}

            {/* Priority Column */}
            {isColVisible('priority') && (
              <div onClick={(e) => e.stopPropagation()} className="w-16 flex justify-center">
                <PriorityDropdown
                  priority={t.priority}
                  disabled={isReadOnly}
                  onChange={(newPriority) => {
                    handleUpdateTask({ ...t, priority: newPriority });
                  }}
                />
              </div>
            )}

            {/* Start Date Column */}
            {isColVisible('start', false) && (
              <span className="w-16 text-center font-mono text-zinc-400 text-[11px] truncate">
                {t.startDate || '—'}
              </span>
            )}

            {/* Due Date Column */}
            {isColVisible('due') && (
              <span className="w-16 text-center font-mono text-orange-400 font-semibold text-[11px]">
                {t.dueDate || 'Today'}
              </span>
            )}

            {/* Assignee Column */}
            {isColVisible('assignee') && (
              <div className="w-14 flex justify-center">
                {t.assignee ? (
                  <div
                    className="w-6 h-6 rounded-full border border-zinc-700 text-zinc-100 flex items-center justify-center font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor:
                        t.assignee.avatarBg && t.assignee.avatarBg !== '#9900c2'
                          ? t.assignee.avatarBg
                          : '#ea580c',
                    }}
                    title={t.assignee.name}
                  >
                    {t.assignee.initials || 'OP'}
                  </div>
                ) : (
                  <span className="text-zinc-600 font-mono text-xs">—</span>
                )}
              </div>
            )}

            {/* Linked Deal Column */}
            {isColVisible('deal') && (
              <div className="w-20 text-right">
                {t.linkedCrmDeal ? (
                  <span className="inline-block font-mono text-zinc-300 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[6px] text-[10px] truncate max-w-[80px] text-right">
                    {t.linkedCrmDeal.name.split(' ')[0]}
                  </span>
                ) : (
                  <span className="text-zinc-600 font-mono text-[11px]">—</span>
                )}
              </div>
            )}

            {/* Custom Fields Columns */}
            {activeCustomFields.map((fieldKey) => {
              const val = t.customLinks?.[fieldKey];
              return (
                <div key={fieldKey} className="w-20 text-center font-mono text-[10px] truncate">
                  {val ? (
                    <span className="bg-orange-950/30 border border-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-[6px] truncate inline-block max-w-[80px]">
                      {String(val)}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Nested Subtask Checklist */}
        {hasSubtasks && isChecklistOpen && (
          <div className="pl-6 space-y-1.5 border-l border-[#27272a] ml-4 my-2.5 pt-1">
            {t.subtasks.map((st) => {
              const done = isSubtaskDone(st.id, st.done);
              return (
                <div
                  key={st.id}
                  onClick={(e) => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) return;
                    handleToggleSubtask(st.id, st.done, e);
                  }}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-[6px] flex items-center justify-center text-[10px] ${
                        done ? 'bg-orange-600 text-white' : 'border border-zinc-600'
                      }`}
                    >
                      {done && <span className="material-symbols-outlined text-[12px]">check</span>}
                    </div>
                    <span
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`cursor-text select-text ${done ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}`}
                    >
                      {st.text}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-500 text-[10px]">{st.time || 'Pending'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#09090b] p-6 text-center">
        <div className="w-14 h-14 rounded-[6px] bg-[#121214] border border-[#27272a] flex items-center justify-center text-orange-400 mb-3 shadow-sm">
          <span className="material-symbols-outlined text-2xl">format_list_bulleted</span>
        </div>
        <h3 className="text-sm font-semibold text-zinc-100 font-headline mb-1">
          No tasks in this list
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mb-4">
          This task list is currently empty. Get started by creating your first deliverable item.
        </p>
        {!isReadOnly && onOpenCreateTask && (
          <button
            type="button"
            onClick={onOpenCreateTask}
            className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create Task</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto p-6 text-xs custom-scrollbar">
      {/* Header Summary Stats Strip */}
      <div className="flex items-center justify-between bg-[#121214] border border-[#27272a] rounded-[6px] px-4 py-2.5 shadow-sm mb-5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="font-bold text-zinc-100 font-headline">
            {tasks.length} Total Deliverables
          </span>
          {dynamicGroups.map(({ key, label, color, filter }) => {
            const count = tasks.filter(filter).length;
            if (count === 0 && groupBy !== 'status') return null;
            return (
              <React.Fragment key={key}>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                  {count} {label}
                </span>
              </React.Fragment>
            );
          })}
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 font-mono">
            {isPoints ? `Est: ${totalPoints} pts` : `Est: ${totalHours} hrs`}
          </span>
        </div>

        {/* View Badge */}
        <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded-[6px]">
          <span className="material-symbols-outlined text-[14px] text-orange-400">layers</span>
          <span className="font-mono text-zinc-300 text-[10.5px] capitalize">
            Grouped by {groupBy}
          </span>
        </div>
      </div>

      {/* Primary Content Container */}
      <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-sm p-6 flex flex-col gap-6">
        {dynamicGroups.map((group) => {
          const groupTasks = tasks.filter(group.filter);
          const isOpen = openSections[group.key] ?? true;
          const isSectionOver = dragOverSection === group.key;

          return (
            <div
              key={group.key}
              onDragOver={(e) => {
                if (isReadOnly || !draggingTaskId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverSection !== group.key) {
                  setDragOverSection(group.key);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverSection === group.key) {
                  setDragOverSection(null);
                }
              }}
              onDrop={(e) => {
                if (isReadOnly) return;
                e.preventDefault();
                const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                if (sourceTaskId) {
                  group.onDropTarget(sourceTaskId);
                }
                setDraggingTaskId(null);
                setDragOverSection(null);
                setDragOverTaskId(null);
                setDropPosition(null);
              }}
              className={`flex flex-col gap-3 p-3 rounded-[6px] transition-all border ${
                isSectionOver
                  ? 'border-orange-500/80 bg-orange-950/20 ring-1 ring-orange-500/30'
                  : 'border-transparent'
              }`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]">
                <button
                  type="button"
                  onClick={() => toggleSection(group.key)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">
                    {isOpen ? 'arrow_drop_down' : 'arrow_right'}
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                    {group.label}
                  </h3>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] ${group.badgeClass}`}>
                    {groupTasks.length} tasks
                  </span>
                </button>

                {/* Visible Column Headers */}
                <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-mono">
                  {isColVisible('status') && <span className="w-20 text-center uppercase">Status</span>}
                  {isColVisible('estimation') && <span className="w-16 text-center uppercase">Est</span>}
                  {isColVisible('priority') && <span className="w-16 text-center uppercase">Priority</span>}
                  {isColVisible('start', false) && <span className="w-16 text-center uppercase">Start</span>}
                  {isColVisible('due') && <span className="w-16 text-center uppercase">Due</span>}
                  {isColVisible('assignee') && <span className="w-14 text-center uppercase">Assignee</span>}
                  {isColVisible('deal') && <span className="w-20 text-right uppercase">Deal</span>}
                  {activeCustomFields.map((cf) => (
                    <span key={cf} className="w-20 text-center uppercase truncate">
                      {cf}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section Tasks */}
              {isOpen && (
                <div className="space-y-2.5">
                  {groupTasks.length === 0 ? (
                    <div
                      className={`p-4 text-center text-xs font-mono rounded-[6px] border border-dashed transition-colors ${
                        isSectionOver
                          ? 'border-orange-500/50 bg-orange-950/30 text-orange-400'
                          : 'border-[#27272a] bg-[#18181b] text-zinc-500'
                      }`}
                    >
                      {isSectionOver
                        ? `Drop to move deliverable to ${group.label}`
                        : `No ${group.label.toLowerCase()} tasks in current list`}
                    </div>
                  ) : (
                    groupTasks.map(renderTaskRow)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
