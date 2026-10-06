import React from 'react';
import { TaskItem, TaskStatus } from '../types';

interface KanbanBoardProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (task: TaskItem) => void;
  onAddTaskToColumn: (status: TaskStatus) => void;
  onMoveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTaskToColumn,
  onMoveTaskStatus,
}) => {
  const columns: {
    status: TaskStatus;
    title: string;
    dotColor: string;
    countBadgeColor?: string;
  }[] = [
    {
      status: 'Backlog',
      title: 'Backlog',
      dotColor: 'bg-[#5f5e61]',
    },
    {
      status: 'In Progress',
      title: 'In Progress',
      dotColor: 'bg-[#9900c2] animate-pulse',
      countBadgeColor: 'bg-[#fbd7ff] text-[#330043]',
    },
    {
      status: 'In Review',
      title: 'In Review',
      dotColor: 'bg-[#835000]',
    },
    {
      status: 'Done',
      title: 'Done',
      dotColor: 'bg-[#837284]',
    },
  ];

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="font-mono text-[10px] text-[#9900c2] border border-[#b731e0]/60 bg-[#fbd7ff]/40 px-2 py-0.5 rounded font-semibold">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="font-mono text-[10px] text-[#835000] border border-[#ffddba] bg-[#ffddba]/30 px-2 py-0.5 rounded font-medium">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="font-mono text-[10px] text-[#5f5e61] border border-[#d4c0d5]/40 bg-[#eeedf7] px-2 py-0.5 rounded">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="font-mono text-[10px] text-[#5f5e61] border border-[#d4c0d5]/40 bg-[#eeedf7] px-2 py-0.5 rounded">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="flex-1 p-6 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-6 bg-[#fafafc]">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="w-[340px] shrink-0 flex flex-col h-full bg-[#f4f2fd]/50 rounded-2xl border border-[#d4c0d5]/30 p-3.5"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></span>
                <h2 className="font-semibold text-sm text-[#1a1b22]">{col.title}</h2>
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded-full font-medium ${
                    col.countBadgeColor || 'bg-[#eeedf7] text-[#5f5e61]'
                  }`}
                >
                  {colTasks.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#837284]">
                <button
                  onClick={() => onAddTaskToColumn(col.status)}
                  className="p-1 hover:text-[#1a1b22] hover:bg-[#eeedf7] rounded transition-colors"
                  title="Add task to column"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <button
                  onClick={() => alert(`Column settings for ${col.title}`)}
                  className="p-1 hover:text-[#1a1b22] hover:bg-[#eeedf7] rounded transition-colors"
                  title="More actions"
                >
                  <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                </button>
              </div>
            </div>

            {/* Cards Stack */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {colTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#837284] border border-dashed border-[#d4c0d5]/40 rounded-xl">
                  No tasks in {col.title}
                </div>
              ) : (
                colTasks.map((t) => {
                  const isSelected = t.id === selectedTaskId;
                  const isFeatured = t.id === 'ENG-094' || t.priority === 'Urgent';
                  const completedSubtasks = t.subtasks.filter((s) => s.done).length;
                  const hasSubtasks = t.subtasks.length > 0;
                  const progressPct = hasSubtasks
                    ? Math.round((completedSubtasks / t.subtasks.length) * 100)
                    : 0;

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`bg-white transition-all duration-150 rounded-xl p-3.5 cursor-pointer group select-none relative ${
                        isSelected
                          ? 'border-2 border-[#9900c2] shadow-md ring-2 ring-[#9900c2]/10'
                          : isFeatured
                          ? 'border-2 border-[#9900c2]/40 hover:border-[#9900c2] shadow-sm'
                          : 'border border-[#d4c0d5]/30 hover:border-[#9900c2]/50 shadow-none'
                      }`}
                    >
                      {/* Top Meta: Priority & ID */}
                      <div className="flex items-center justify-between mb-2">
                        {getPriorityBadge(t.priority)}
                        <span className="font-mono text-xs text-[#837284] group-hover:text-[#9900c2] transition-colors">
                          {t.id}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-sm font-semibold text-[#1a1b22] mb-1.5 group-hover:text-[#9900c2] transition-colors leading-snug">
                        {t.title}
                      </h3>

                      {/* Description Summary */}
                      <p className="text-xs text-[#504252] mb-3 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>

                      {/* Mini Progress Bar for Urgent/In-Progress tasks with subtasks */}
                      {hasSubtasks && (isFeatured || t.status === 'In Progress') && (
                        <div className="w-full bg-[#eeedf7] rounded-full h-1.5 mb-3 overflow-hidden">
                          <div
                            className="bg-[#9900c2] h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      )}

                      {/* Card Footer: Tags, Subtask Counter, Due Date & Assignee */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#d4c0d5]/20 text-xs">
                        <div className="flex items-center gap-2">
                          {t.tags[0] && (
                            <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-2 py-0.5 rounded">
                              {t.tags[0]}
                            </span>
                          )}
                          {hasSubtasks && (
                            <div
                              className={`flex items-center gap-1 font-mono text-[11px] ${
                                completedSubtasks === t.subtasks.length
                                  ? 'text-emerald-600'
                                  : isFeatured
                                  ? 'text-[#9900c2] font-semibold'
                                  : 'text-[#837284]'
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
                          <span className="font-mono text-[11px] text-[#837284]">
                            {t.dueDate}
                          </span>
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ring-1 ring-white"
                            style={{
                              backgroundColor: t.assignee.avatarBg || '#e4e1e6',
                              color: t.assignee.avatarColor || '#1b1b1e',
                            }}
                            title={t.assignee.name}
                          >
                            {t.assignee.initials}
                          </div>
                        </div>
                      </div>

                      {/* Quick Move Helper on Hover */}
                      <div
                        className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur rounded px-1 py-0.5 shadow-sm border border-[#d4c0d5]/40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.status !== 'Backlog' && (
                          <button
                            onClick={() => {
                              const prevMap: Record<TaskStatus, TaskStatus> = {
                                'In Progress': 'Backlog',
                                'In Review': 'In Progress',
                                'Blocked': 'In Progress',
                                'Done': 'In Review',
                                'Backlog': 'Backlog',
                              };
                              onMoveTaskStatus(t.id, prevMap[t.status]);
                            }}
                            className="text-[#837284] hover:text-[#9900c2] p-0.5"
                            title="Move left"
                          >
                            <span className="material-symbols-outlined text-[13px]">arrow_back</span>
                          </button>
                        )}
                        {col.status !== 'Done' && (
                          <button
                            onClick={() => {
                              const nextMap: Record<TaskStatus, TaskStatus> = {
                                'Backlog': 'In Progress',
                                'In Progress': 'In Review',
                                'In Review': 'Done',
                                'Blocked': 'In Review',
                                'Done': 'Done',
                              };
                              onMoveTaskStatus(t.id, nextMap[t.status]);
                            }}
                            className="text-[#837284] hover:text-[#9900c2] p-0.5"
                            title="Move right"
                          >
                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Add Task CTA */}
            <button
              onClick={() => onAddTaskToColumn(col.status)}
              className="mt-2 w-full py-1.5 text-[#837284] hover:text-[#1a1b22] hover:bg-white rounded-lg text-xs flex items-center justify-center gap-1 border border-dashed border-[#d4c0d5]/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Add Task</span>
            </button>
          </div>
        );
      })}
    </section>
  );
};
