import React, { useState, useMemo } from 'react';
import { TaskItem, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatEstimationValue } from '../utils/taskSpaceSettingsUtils';

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
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onQuickStatusChange,
  onMoveTaskStatus,
  onOpenCreateTask,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  const { statuses, listSettings } = useWorkspace();
  const isPoints = listSettings?.estimationUnit === 'Story Points';

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'In Progress': true,
    'In Review': true,
    'Blocked': true,
    'Backlog': true,
    'Done': false,
  });

  // Expanded subtask checklists per task ID
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  // Local subtask check state
  const [localSubtasks, setLocalSubtasks] = useState<Record<string, boolean>>({});

  const toggleSection = (status: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [status]: prev[status] !== undefined ? !prev[status] : false,
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

  const statusGroups = useMemo(() => {
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
          id: st.id,
          status: st.name as TaskStatus,
          label: st.name.toUpperCase(),
          color: st.color || '#ea580c',
          badgeClass:
            st.name === 'In Progress'
              ? 'bg-orange-950/50 text-orange-400 border border-orange-500/30'
              : st.name === 'Done'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        }));
    }
    return [
      {
        id: 'in_progress',
        status: 'In Progress' as TaskStatus,
        label: 'IN PROGRESS',
        color: '#ea580c',
        badgeClass: 'bg-orange-950/50 text-orange-400 border border-orange-500/30',
      },
      {
        id: 'in_review',
        status: 'In Review' as TaskStatus,
        label: 'IN REVIEW',
        color: '#f59e0b',
        badgeClass: 'bg-amber-950/40 text-amber-400 border border-amber-500/30',
      },
      {
        id: 'blocked',
        status: 'Blocked' as TaskStatus,
        label: 'BLOCKED',
        color: '#ef4444',
        badgeClass: 'bg-red-950/40 text-red-400 border border-red-500/30',
      },
      {
        id: 'backlog',
        status: 'Backlog' as TaskStatus,
        label: 'BACKLOG',
        color: '#71717a',
        badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
      },
      {
        id: 'done',
        status: 'Done' as TaskStatus,
        label: 'DONE',
        color: '#10b981',
        badgeClass: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30',
      },
    ];
  }, [statuses]);

  const totalHours = tasks.reduce((acc, t) => acc + (t.estimation?.hours || 0), 0);
  const totalPoints = tasks.reduce((acc, t) => acc + (t.estimation?.points || 0), 0);

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
        {/* Parent Row */}
        <div
          onClick={() => onSelectTask(t)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Drag Handle Indicator */}
            {!isReadOnly && (
              <span
                className="material-symbols-outlined text-[15px] text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 select-none"
                title="Drag to reorder or move status"
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

          <div className="flex items-center gap-3 shrink-0">
            {t.estimation && (
              <span
                className="font-mono text-[10px] text-zinc-400 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[6px]"
                title={isPoints ? 'Story Points' : 'Estimated Hours'}
              >
                {formatEstimationValue(t.estimation, listSettings?.estimationUnit)}
              </span>
            )}
            {getPriorityBadge(t.priority)}
            <span className="w-16 text-center font-mono text-orange-400 font-semibold text-[11px]">
              {t.dueDate || 'Today'}
            </span>
            <div className="w-14 flex justify-center">
              <div
                className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-mono text-[10px] font-bold"
                style={{
                  backgroundColor:
                    t.assignee?.avatarBg && t.assignee.avatarBg !== '#9900c2'
                      ? t.assignee.avatarBg
                      : '#ea580c',
                }}
              >
                {t.assignee?.initials || 'OP'}
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

        {/* Dynamic Nested Subtask Checklist */}
        {hasSubtasks && isChecklistOpen && (
          <div className="pl-6 space-y-1.5 border-l border-[#27272a] ml-4 my-2.5 pt-1">
            {t.subtasks.map((st) => {
              const done = isSubtaskDone(st.id, st.done);
              return (
                <div
                  key={st.id}
                  onClick={(e) => handleToggleSubtask(st.id, st.done, e)}
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
                      className={done ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto select-none p-6 text-xs custom-scrollbar">
      {/* Header Summary Stats Strip */}
      <div className="flex items-center justify-between bg-[#121214] border border-[#27272a] rounded-[6px] px-4 py-2.5 shadow-sm mb-5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="font-bold text-zinc-100 font-headline">
            {tasks.length} Total Deliverables
          </span>
          {statusGroups.map(({ id, status, color }) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <React.Fragment key={id || status}>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                  {count} {status}
                </span>
              </React.Fragment>
            );
          })}
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 font-mono">
            {isPoints ? `Est: ${totalPoints} pts` : `Est: ${totalHours} hrs`}
          </span>
        </div>

        {/* Benchmark Badge */}
        <div className="flex items-center gap-2 bg-orange-950/40 border border-orange-500/30 px-2.5 py-1 rounded-[6px]">
          <span className="material-symbols-outlined text-[14px] text-orange-400">bolt</span>
          <span className="font-mono text-zinc-300 text-[10.5px]">
            Zero-Latency List View
          </span>
        </div>
      </div>

      {/* PRIMARY HIERARCHICAL CONTENT CARD */}
      <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-sm p-6 flex flex-col gap-6">
        {statusGroups.map(({ id, status, label, color, badgeClass }) => {
          const groupTasks = tasks.filter((t) => t.status === status);
          const isOpen = openSections[status] ?? true;
          const isSectionOver = dragOverSection === status;

          return (
            <div
              key={id || status}
              onDragOver={(e) => {
                if (isReadOnly || !draggingTaskId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverSection !== status) {
                  setDragOverSection(status);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverSection === status) {
                  setDragOverSection(null);
                }
              }}
              onDrop={(e) => {
                if (isReadOnly) return;
                e.preventDefault();
                const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                if (sourceTaskId) {
                  onMoveTaskStatus?.(sourceTaskId, status);
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
                  onClick={() => toggleSection(status)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">
                    {isOpen ? 'arrow_drop_down' : 'arrow_right'}
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                    {label}
                  </h3>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] ${badgeClass}`}>
                    {groupTasks.length} tasks
                  </span>
                </button>
                <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-mono">
                  <span className="w-16 text-center">PRIORITY</span>
                  <span className="w-16 text-center">DUE</span>
                  <span className="w-14 text-center">ASSIGNEE</span>
                  <span className="w-24 text-right">DEAL REF</span>
                </div>
              </div>

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
                      {isSectionOver ? `Drop to move deliverable to ${label}` : `No ${status.toLowerCase()} tasks in current space`}
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
