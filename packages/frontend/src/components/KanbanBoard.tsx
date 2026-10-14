import React, { useState, useMemo } from 'react';
import { Repeat } from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatEstimationValue } from '../utils/taskSpaceSettingsUtils';
import { PriorityDropdown } from './PriorityDropdown';
import { formatRecurrenceLabel } from '../utils/recurrenceUtils';

export interface KanbanBoardProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (task: TaskItem) => void;
  onAddTaskToColumn: (status: TaskStatus) => void;
  onMoveTaskStatus: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => void;
  onEditTask?: (task: TaskItem) => void;
  groupBy?: 'status' | 'priority' | 'assignee';
  visibleColumns?: Record<string, boolean>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTaskToColumn,
  onMoveTaskStatus,
  onEditTask,
  groupBy,
  visibleColumns,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  const { statuses, members, listSettings, handleUpdateTask } = useWorkspace();

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    taskId: string;
    position: 'before' | 'after';
    columnKey: string;
  } | null>(null);

  const activeCustomFields = useMemo(() => {
    if (!visibleColumns) return [];
    return Object.keys(visibleColumns)
      .filter((k) => k.startsWith('custom:') && visibleColumns[k])
      .map((k) => k.replace(/^custom:/, ''));
  }, [visibleColumns]);

  const showPriority = visibleColumns?.priority ?? true;
  const showDueDate = visibleColumns?.dueDate ?? true;
  const showAssignee = visibleColumns?.assignee ?? true;
  const showEstimation = visibleColumns?.estimation ?? true;

  const columns = useMemo(() => {
    if (groupBy === 'priority') {
      const priorityList: { id: TaskItem['priority']; title: string; color: string; badgeColor: string }[] = [
        { id: 'Urgent', title: 'Urgent', color: '#ef4444', badgeColor: 'bg-red-950/60 text-red-400 border border-red-500/30' },
        { id: 'High', title: 'High', color: '#f97316', badgeColor: 'bg-orange-950/60 text-orange-400 border border-orange-500/30' },
        { id: 'Medium', title: 'Medium', color: '#3b82f6', badgeColor: 'bg-blue-950/60 text-blue-400 border border-blue-500/30' },
        { id: 'Low', title: 'Low', color: '#71717a', badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700' },
      ];

      return priorityList.map((p) => ({
        key: p.id,
        id: p.id,
        title: p.title,
        color: p.color,
        countBadgeColor: p.badgeColor,
        status: undefined as TaskStatus | undefined,
        filter: (t: TaskItem) => {
          const norm = (t.priority as string) === 'Normal' ? 'Medium' : t.priority;
          return norm === p.id;
        },
        onDropTask: (taskId: string) => {
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            handleUpdateTask({ ...task, priority: p.id });
          }
        },
        onDropTargetCard: (sourceTaskId: string) => {
          const task = tasks.find((t) => t.id === sourceTaskId);
          if (task) {
            handleUpdateTask({ ...task, priority: p.id });
          }
        },
      }));
    }

    if (groupBy === 'assignee') {
      const colList = members.map((m) => ({
        key: m.id,
        id: m.id,
        title: m.name,
        color: m.avatarBg || '#ea580c',
        countBadgeColor: 'bg-orange-950/60 text-orange-400 border border-orange-500/30',
        status: undefined as TaskStatus | undefined,
        filter: (t: TaskItem) =>
          t.assigneeId === m.id ||
          t.assignee?.id === m.id ||
          (t.assignee?.name && t.assignee.name.toLowerCase() === m.name.toLowerCase()),
        onDropTask: (taskId: string) => {
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            handleUpdateTask({ ...task, assigneeId: m.id, assignee: m });
          }
        },
        onDropTargetCard: (sourceTaskId: string) => {
          const task = tasks.find((t) => t.id === sourceTaskId);
          if (task) {
            handleUpdateTask({ ...task, assigneeId: m.id, assignee: m });
          }
        },
      }));

      colList.push({
        key: 'unassigned',
        id: 'unassigned',
        title: 'Unassigned',
        color: '#71717a',
        countBadgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        status: undefined as TaskStatus | undefined,
        filter: (t: TaskItem) =>
          !members.some(
            (m) =>
              t.assigneeId === m.id ||
              t.assignee?.id === m.id ||
              (t.assignee?.name && t.assignee.name.toLowerCase() === m.name.toLowerCase())
          ),
        onDropTask: (taskId: string) => {
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            handleUpdateTask({ ...task, assigneeId: undefined, assignee: undefined as any });
          }
        },
        onDropTargetCard: (sourceTaskId: string) => {
          const task = tasks.find((t) => t.id === sourceTaskId);
          if (task) {
            handleUpdateTask({ ...task, assigneeId: undefined, assignee: undefined as any });
          }
        },
      });

      return colList;
    }

    // Default: Group by Status
    const baseStatuses = (statuses && statuses.length > 0)
      ? statuses
      : [
          { id: 'st-backlog', name: 'Backlog', order: 0, color: '#71717a' },
          { id: 'st-in-progress', name: 'In Progress', order: 1, color: '#ea580c' },
          { id: 'st-in-review', name: 'In Review', order: 2, color: '#f59e0b' },
          { id: 'st-blocked', name: 'Blocked', order: 3, color: '#ef4444' },
          { id: 'st-done', name: 'Done', order: 4, color: '#10b981' },
        ];

    const seen = new Set<string>();
    const cols = [...baseStatuses]
      .filter((st) => {
        const key = (st.name || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((st) => ({
        key: st.name,
        id: st.id,
        title: st.name,
        status: st.name as TaskStatus,
        color: st.color || '#ea580c',
        countBadgeColor:
          st.name.toLowerCase() === 'in progress'
            ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30'
            : st.name.toLowerCase() === 'done'
            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
            : undefined,
        filter: (t: TaskItem) => (t.status || '').trim().toLowerCase() === st.name.trim().toLowerCase(),
        onDropTask: (taskId: string) => onMoveTaskStatus(taskId, st.name as TaskStatus),
        onDropTargetCard: (sourceTaskId: string, targetTaskId: string, position: 'before' | 'after') => {
          onMoveTaskStatus(sourceTaskId, st.name as TaskStatus, undefined, targetTaskId, position);
        },
      }));

    // Dynamic unlisted statuses on tasks
    const known = new Set(cols.map((c) => c.key.toLowerCase()));
    for (const t of tasks) {
      const s = (t.status || 'Backlog').trim();
      if (!known.has(s.toLowerCase())) {
        known.add(s.toLowerCase());
        cols.push({
          key: s,
          id: s,
          title: s,
          status: s as TaskStatus,
          color: '#a1a1aa',
          countBadgeColor: undefined,
          filter: (task: TaskItem) => (task.status || '').trim().toLowerCase() === s.toLowerCase(),
          onDropTask: (taskId: string) => onMoveTaskStatus(taskId, s as TaskStatus),
          onDropTargetCard: (sourceTaskId: string, targetTaskId: string, position: 'before' | 'after') => {
            onMoveTaskStatus(sourceTaskId, s as TaskStatus, undefined, targetTaskId, position);
          },
        });
      }
    }

    return cols;
  }, [groupBy, statuses, tasks, members, onMoveTaskStatus, handleUpdateTask]);

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="font-mono text-[10px] text-red-400 border border-red-500/30 bg-red-950/40 px-2 py-0.5 rounded-[6px] font-semibold">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="font-mono text-[10px] text-orange-400 border border-orange-500/30 bg-orange-950/40 px-2 py-0.5 rounded-[6px] font-semibold">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="font-mono text-[10px] text-amber-400 border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 rounded-[6px] font-medium">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="font-mono text-[10px] text-zinc-400 border border-zinc-700/50 bg-zinc-800/60 px-2 py-0.5 rounded-[6px]">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="flex-1 p-6 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-5 bg-[#09090b]">
      {columns.map((col) => {
        const colTasks = tasks.filter(col.filter);
        const isColumnOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              if (isReadOnly) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== col.key) {
                setDragOverColumn(col.key);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === col.key) {
                setDragOverColumn(null);
              }
            }}
            onDrop={(e) => {
              if (isReadOnly) return;
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
              if (taskId) {
                col.onDropTask(taskId);
              }
              setDraggingTaskId(null);
              setDragOverColumn(null);
              setDropTarget(null);
            }}
            className={`w-[340px] shrink-0 flex flex-col h-full bg-[#121214] rounded-[6px] border transition-all duration-150 p-3.5 ${
              isColumnOver
                ? 'border-orange-500/80 bg-orange-950/20 ring-1 ring-orange-500/30'
                : 'border-[#27272a]'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }}></span>
                <h2 className="font-semibold text-xs font-mono uppercase tracking-wider text-zinc-100">{col.title}</h2>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded-[6px] font-medium ${
                    col.countBadgeColor || 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {colTasks.length}
                </span>
              </div>
              {!isReadOnly && (
                <div className="flex items-center gap-1 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => {
                      if (col.status) {
                        onAddTaskToColumn(col.status);
                      } else {
                        onAddTaskToColumn('In Progress');
                      }
                    }}
                    className="w-6 h-6 flex items-center justify-center hover:text-orange-400 hover:bg-zinc-800 rounded-[6px] transition-colors cursor-pointer"
                    title="Add task to column"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cards Stack */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
              {colTasks.length === 0 ? (
                <div className={`p-6 text-center text-xs text-zinc-500 font-mono border border-dashed rounded-[6px] transition-colors ${
                  isColumnOver ? 'border-orange-500/50 bg-orange-950/30 text-orange-400' : 'border-[#27272a]'
                }`}>
                  {isColumnOver ? `Drop to move to ${col.title}` : `No tasks in ${col.title}`}
                </div>
              ) : (
                colTasks.map((t) => {
                  const isSelected = t.id === selectedTaskId;
                  const isFeatured = t.id === 'ENG-094' || t.priority === 'Urgent';
                  const isDraggingThis = draggingTaskId === t.id;
                  const completedSubtasks = t.subtasks.filter((s) => s.done).length;
                  const hasSubtasks = t.subtasks.length > 0;
                  const progressPct = hasSubtasks
                    ? Math.round((completedSubtasks / t.subtasks.length) * 100)
                    : 0;

                  const isDropBefore =
                    dropTarget?.taskId === t.id &&
                    dropTarget.position === 'before' &&
                    draggingTaskId !== t.id;
                  const isDropAfter =
                    dropTarget?.taskId === t.id &&
                    dropTarget.position === 'after' &&
                    draggingTaskId !== t.id;

                  return (
                    <React.Fragment key={t.id}>
                      {isDropBefore && (
                        <div className="relative flex items-center -my-1 py-1 z-20 pointer-events-none transition-all">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#ea580c] -ml-1"></div>
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 shadow-[0_0_8px_#ea580c]"></div>
                        </div>
                      )}

                      <div
                        draggable={!isReadOnly}
                        onDragStart={(e) => {
                          if (isReadOnly) return;
                          e.dataTransfer.setData('text/plain', t.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingTaskId(t.id);
                        }}
                        onDragOver={(e) => {
                          if (isReadOnly) return;
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          const rect = e.currentTarget.getBoundingClientRect();
                          const offsetY = e.clientY - rect.top;
                          const isBefore = offsetY < rect.height / 2;
                          setDropTarget({
                            taskId: t.id,
                            position: isBefore ? 'before' : 'after',
                            columnKey: col.key,
                          });
                          if (dragOverColumn !== col.key) {
                            setDragOverColumn(col.key);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                          if (dropTarget?.taskId === t.id) {
                            setDropTarget(null);
                          }
                        }}
                        onDrop={(e) => {
                          if (isReadOnly) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                          if (sourceTaskId && sourceTaskId !== t.id) {
                            col.onDropTargetCard(sourceTaskId, t.id, dropTarget?.position || 'before');
                          }
                          setDraggingTaskId(null);
                          setDragOverColumn(null);
                          setDropTarget(null);
                        }}
                        onDragEnd={() => {
                          setDraggingTaskId(null);
                          setDragOverColumn(null);
                          setDropTarget(null);
                        }}
                        onClick={() => {
                          const sel = window.getSelection();
                          if (sel && sel.toString().trim().length > 0) return;
                          onSelectTask(t);
                        }}
                        className={`bg-[#18181b] transition-all duration-150 rounded-[6px] p-3.5 relative cursor-pointer group ${
                          isDraggingThis ? 'opacity-30 scale-[0.98] ring-2 ring-orange-500/40' : ''
                        } ${
                          isSelected
                            ? 'border-2 border-orange-500 shadow-md ring-1 ring-orange-500/20'
                            : isFeatured
                            ? 'border border-orange-500/40 hover:border-orange-500 shadow-sm'
                            : 'border border-[#27272a] hover:border-orange-500/50 hover:bg-[#1f1f23]'
                        }`}
                      >
                        {/* Top Meta: Priority & ID */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {showPriority && (
                              <PriorityDropdown
                                priority={t.priority}
                                disabled={isReadOnly}
                                onChange={(newPriority) => {
                                  handleUpdateTask({ ...t, priority: newPriority });
                                }}
                              />
                            )}
                            {t.isRecurring && (
                              <span
                                className="font-mono text-[9px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded-[4px] inline-flex items-center gap-1"
                                title={formatRecurrenceLabel(t.recurrenceRule)}
                              >
                                <Repeat className="w-2.5 h-2.5 text-orange-400" />
                                <span>Recurring</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!isReadOnly && (
                              <svg
                                className="w-3.5 h-3.5 text-zinc-500 hover:text-orange-400 opacity-60 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="9" cy="6" r="1.5" />
                                <circle cx="15" cy="6" r="1.5" />
                                <circle cx="9" cy="12" r="1.5" />
                                <circle cx="15" cy="12" r="1.5" />
                                <circle cx="9" cy="18" r="1.5" />
                                <circle cx="15" cy="18" r="1.5" />
                              </svg>
                            )}
                            {onEditTask && !isReadOnly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTask(t);
                                }}
                                className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-zinc-400 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                                title="Edit task in modal"
                              >
                                <span className="material-symbols-outlined text-[13px]">edit</span>
                              </button>
                            )}
                            <span
                              onMouseDown={(e) => e.stopPropagation()}
                              className="font-mono text-xs text-zinc-400 group-hover:text-orange-400 transition-colors cursor-text select-text"
                            >
                              {t.id}
                            </span>
                          </div>
                        </div>

                        {/* Card Title */}
                        <h3
                          onMouseDown={(e) => e.stopPropagation()}
                          className="text-[13px] font-semibold text-zinc-100 mb-1.5 group-hover:text-orange-400 transition-colors leading-snug cursor-text select-text"
                        >
                          {t.title}
                        </h3>

                        {/* Description Summary */}
                        <p
                          onMouseDown={(e) => e.stopPropagation()}
                          className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed cursor-text select-text"
                        >
                          {t.description}
                        </p>

                        {/* Mini Progress Bar for Urgent/In-Progress tasks with subtasks */}
                        {hasSubtasks && (isFeatured || t.status === 'In Progress') && (
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3 overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        )}

                        {/* Active Custom Fields Chips */}
                        {activeCustomFields.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            {activeCustomFields.map((cf) => {
                              const val = t.customLinks?.[cf] ?? (t as any).customFields?.[cf];
                              if (val === undefined || val === null || val === '') return null;
                              return (
                                <span
                                  key={cf}
                                  className="font-mono text-[9px] bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 px-1.5 py-0.5 rounded-[4px] truncate max-w-[120px]"
                                  title={`${cf}: ${String(val)}`}
                                >
                                  <strong className="text-zinc-500 font-normal">{cf}:</strong> {String(val)}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Card Footer: Tags, Subtask Counter, Due Date & Assignee */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#27272a] text-xs">
                          <div className="flex items-center gap-2">
                            {t.tags[0] && (
                              <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-[6px]">
                                {t.tags[0]}
                              </span>
                            )}
                            {hasSubtasks && (
                              <div
                                className={`flex items-center gap-1 font-mono text-[11px] ${
                                  completedSubtasks === t.subtasks.length
                                    ? 'text-emerald-400'
                                    : isFeatured
                                    ? 'text-orange-400 font-semibold'
                                    : 'text-zinc-500'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  check_circle
                                </span>
                                <span>
                                  {completedSubtasks}/{t.subtasks.length}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {showEstimation && t.estimation && (
                              <span
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-400 flex items-center gap-1"
                                title={listSettings?.estimationUnit === 'Story Points' ? 'Story Points' : 'Estimated Hours'}
                              >
                                <span className="material-symbols-outlined text-[11px] text-zinc-500">
                                  {listSettings?.estimationUnit === 'Story Points' ? 'tag' : 'schedule'}
                                </span>
                                <span>{formatEstimationValue(t.estimation, listSettings?.estimationUnit)}</span>
                              </span>
                            )}
                            {showDueDate && (
                              <span className="font-mono text-[11px] text-zinc-400">
                                {t.dueDate}
                              </span>
                            )}
                            {showAssignee && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ring-1 ring-zinc-700 text-zinc-100 bg-zinc-800"
                                style={{
                                  backgroundColor: t.assignee?.avatarBg && t.assignee.avatarBg !== '#9900c2' ? t.assignee.avatarBg : '#27272a',
                                }}
                                title={t.assignee?.name || 'Unassigned'}
                              >
                                {t.assignee?.initials || '??'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Move Helper on Hover (Hidden in read-only mode) */}
                        {!isReadOnly && (
                          <div
                            className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-[#121214]/90 backdrop-blur rounded-[6px] px-1 py-0.5 shadow-sm border border-[#27272a]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(() => {
                              const currentColIdx = columns.findIndex((c) => c.key === col.key);
                              const canMoveLeft = currentColIdx > 0;
                              const canMoveRight = currentColIdx >= 0 && currentColIdx < columns.length - 1;

                              return (
                                <>
                                  {canMoveLeft && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        columns[currentColIdx - 1].onDropTask(t.id);
                                      }}
                                      className="text-zinc-400 hover:text-orange-400 p-0.5 cursor-pointer"
                                      title={`Move to ${columns[currentColIdx - 1].title}`}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">arrow_back</span>
                                    </button>
                                  )}
                                  {canMoveRight && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        columns[currentColIdx + 1].onDropTask(t.id);
                                      }}
                                      className="text-zinc-400 hover:text-orange-400 p-0.5 cursor-pointer"
                                      title={`Move to ${columns[currentColIdx + 1].title}`}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {isDropAfter && (
                        <div className="relative flex items-center -my-1 py-1 z-20 pointer-events-none transition-all">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#ea580c] -ml-1"></div>
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 shadow-[0_0_8px_#ea580c]"></div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Bottom Add Task CTA */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  if (col.status) {
                    onAddTaskToColumn(col.status);
                  } else {
                    onAddTaskToColumn('In Progress');
                  }
                }}
                className="mt-2 w-full py-1.5 text-zinc-400 hover:text-orange-400 hover:bg-[#18181b] rounded-[6px] text-xs flex items-center justify-center gap-1 border border-dashed border-[#27272a] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Add Task</span>
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
};
