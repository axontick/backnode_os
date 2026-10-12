import React, { useState, useMemo } from 'react';
import { Repeat } from 'lucide-react';
import { TaskItem, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatEstimationValue } from '../utils/taskSpaceSettingsUtils';
import { PriorityDropdown } from './PriorityDropdown';
import { formatRecurrenceLabel } from '../utils/recurrenceUtils';

interface KanbanBoardProps {
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
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTaskToColumn,
  onMoveTaskStatus,
  onEditTask,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  const { statuses, listSettings, handleUpdateTask } = useWorkspace();

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    taskId: string;
    position: 'before' | 'after';
    status: TaskStatus;
  } | null>(null);

  const columns = useMemo(() => {
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
          status: st.name as TaskStatus,
          id: st.id,
          title: st.name,
          color: st.color || '#ea580c',
          countBadgeColor:
            st.name === 'In Progress'
              ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30'
              : st.name === 'Done'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
              : undefined,
        }));
    }
    return [
      { status: 'Backlog' as TaskStatus, title: 'Backlog', color: '#71717a' },
      {
        status: 'In Progress' as TaskStatus,
        title: 'In Progress',
        color: '#ea580c',
        countBadgeColor: 'bg-orange-950/60 text-orange-400 border border-orange-500/30',
      },
      { status: 'In Review' as TaskStatus, title: 'In Review', color: '#f59e0b' },
      { status: 'Blocked' as TaskStatus, title: 'Blocked', color: '#ef4444' },
      {
        status: 'Done' as TaskStatus,
        title: 'Done',
        color: '#10b981',
        countBadgeColor: 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30',
      },
    ];
  }, [statuses]);

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
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isColumnOver = dragOverColumn === col.status;

        return (
          <div
            key={col.id || col.status}
            onDragOver={(e) => {
              if (isReadOnly) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== col.status) {
                setDragOverColumn(col.status);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === col.status) {
                setDragOverColumn(null);
              }
            }}
            onDrop={(e) => {
              if (isReadOnly) return;
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
              if (taskId) {
                onMoveTaskStatus(taskId, col.status);
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
                    onClick={() => onAddTaskToColumn(col.status)}
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
                            status: col.status,
                          });
                          if (dragOverColumn !== col.status) {
                            setDragOverColumn(col.status);
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
                            onMoveTaskStatus(sourceTaskId, col.status, undefined, t.id, dropTarget?.position || 'before');
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
                        onClick={() => onSelectTask(t)}
                        className={`bg-[#18181b] transition-all duration-150 rounded-[6px] p-3.5 relative ${
                          isReadOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                        } group ${
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
                            <PriorityDropdown
                              priority={t.priority}
                              disabled={isReadOnly}
                              onChange={(newPriority) => {
                                handleUpdateTask({ ...t, priority: newPriority });
                              }}
                            />
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
                          <span className="font-mono text-xs text-zinc-400 group-hover:text-orange-400 transition-colors">
                            {t.id}
                          </span>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-[13px] font-semibold text-zinc-100 mb-1.5 group-hover:text-orange-400 transition-colors leading-snug">
                        {t.title}
                      </h3>

                      {/* Description Summary */}
                      <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
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
                          {t.estimation && (
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
                          <span className="font-mono text-[11px] text-zinc-400">
                            {t.dueDate}
                          </span>
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ring-1 ring-zinc-700 text-zinc-100 bg-zinc-800"
                            style={{
                              backgroundColor: t.assignee.avatarBg && t.assignee.avatarBg !== '#9900c2' ? t.assignee.avatarBg : '#27272a',
                            }}
                            title={t.assignee.name}
                          >
                            {t.assignee.initials}
                          </div>
                        </div>
                      </div>

                      {/* Quick Move Helper on Hover (Hidden in read-only mode) */}
                      {!isReadOnly && (
                        <div
                          className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-[#121214]/90 backdrop-blur rounded-[6px] px-1 py-0.5 shadow-sm border border-[#27272a]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(() => {
                            const currentColIdx = columns.findIndex((c) => c.status === col.status);
                            const canMoveLeft = currentColIdx > 0;
                            const canMoveRight = currentColIdx >= 0 && currentColIdx < columns.length - 1;

                            return (
                              <>
                                {canMoveLeft && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onMoveTaskStatus(t.id, columns[currentColIdx - 1].status);
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
                                      onMoveTaskStatus(t.id, columns[currentColIdx + 1].status);
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
                onClick={() => onAddTaskToColumn(col.status)}
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
