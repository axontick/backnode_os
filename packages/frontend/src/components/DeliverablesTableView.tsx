import React, { useState, useMemo } from 'react';
import { TaskItem, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export interface DeliverablesTableViewProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: () => void;
  onRequestDeleteTask: (task: TaskItem) => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  onEditTask?: (task: TaskItem) => void;
  onMoveTaskStatus?: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => void;
  activeStatusRoute?: string;
  onSelectStatusRoute?: (statusSlug: string) => void;
}

export const DeliverablesTableView: React.FC<DeliverablesTableViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onOpenCreateTask,
  onRequestDeleteTask,
  onNavigateToView,
  onEditTask,
  onMoveTaskStatus,
  activeStatusRoute,
  onSelectStatusRoute,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  const { listSettings, statuses } = useWorkspace();
  const isPoints = listSettings?.estimationUnit === 'Story Points';

  const [selectedIds, setSelectedIds] = useState<string[]>(['ENG-101', 'ENG-103']);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [filterQuery, setFilterQuery] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<string>('All');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverTabSlug, setDragOverTabSlug] = useState<string | null>(null);

  const sortedStatuses = useMemo(() => {
    const raw = (statuses && statuses.length > 0)
      ? statuses
      : [
          { id: 'in_progress', name: 'In Progress', order: 0 },
          { id: 'in_review', name: 'In Review', order: 1 },
          { id: 'done', name: 'Done', order: 2 },
          { id: 'blocked', name: 'Blocked', order: 3 },
          { id: 'backlog', name: 'Backlog', order: 4 },
        ];
    const seen = new Set<string>();
    return [...raw]
      .filter((st) => {
        const key = (st.name || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [statuses]);

  // Map route slug to TaskStatus dynamically
  const { statusSlugToStatus, statusToSlug } = useMemo(() => {
    const s2s: Record<string, string> = { all: 'All' };
    const st2s: Record<string, string> = { All: 'all' };
    sortedStatuses.forEach((st) => {
      const slug = st.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      s2s[slug] = st.name;
      st2s[st.name] = slug;
    });
    return { statusSlugToStatus: s2s, statusToSlug: st2s };
  }, [sortedStatuses]);

  const effectiveStatus = activeStatusRoute
    ? statusSlugToStatus[activeStatusRoute.toLowerCase()] || 'All'
    : localStatusFilter;

  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      filterQuery === '' ||
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.assignee.name.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = effectiveStatus === 'All' || t.status === effectiveStatus;
    return matchesQuery && matchesStatus;
  });

  const handleToggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t.id));
    }
  };

  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const inReviewCount = tasks.filter((t) => t.status === 'In Review').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const backlogCount = tasks.filter((t) => t.status === 'Backlog').length;

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-semibold bg-amber-950/40 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>In Review</span>
          </span>
        );
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Done</span>
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-semibold bg-red-950/40 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Blocked</span>
          </span>
        );
      case 'Backlog':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-semibold bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span>Backlog</span>
          </span>
        );
    }
  };

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
          <span className="font-mono text-[10px] text-amber-400 border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 rounded-[6px] font-semibold">
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
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden select-none text-xs">
      {/* Table Utility Controls Toolbar */}
      <div className="px-6 py-2 bg-[#121214] border-b border-[#27272a] flex items-center justify-between shrink-0 h-11">
        {/* Left Table Context */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-100 text-xs">Deliverables Spreadsheet</span>
          <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-[6px]">
            {filteredTasks.length} records
          </span>
        </div>

        {/* Right Table Scoped Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Filter Input */}
          <div className="relative w-48">
            <span className="material-symbols-outlined absolute left-2 top-2 text-[14px] text-zinc-500">
              filter_alt
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter deliverables..."
              className="w-full h-8 pl-7 pr-2 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={effectiveStatus}
            onChange={(e) => {
              const val = e.target.value;
              if (onSelectStatusRoute) {
                onSelectStatusRoute(statusToSlug[val] || 'all');
              } else {
                setLocalStatusFilter(val);
              }
            }}
            className="h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-200 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Statuses ({tasks.length})</option>
            <option value="In Progress">In Progress ({inProgressCount})</option>
            <option value="In Review">In Review ({inReviewCount})</option>
            <option value="Done">Done ({doneCount})</option>
            <option value="Backlog">Backlog ({backlogCount})</option>
          </select>

          {/* Density Toggle */}
          <div className="h-8 p-0.5 bg-[#18181b] rounded-[6px] border border-[#27272a] flex items-center font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded-[6px] transition-colors cursor-pointer ${
                density === 'compact' ? 'bg-[#27272a] text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-0.5 rounded-[6px] transition-colors cursor-pointer ${
                density === 'comfortable' ? 'bg-[#27272a] text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Comfortable
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={() => {
              const headers = ['ID', 'Title', 'Status', 'Priority', 'Assignee', 'Due Date'];
              const rows = filteredTasks.map((t) => [
                `"${t.id}"`,
                `"${t.title.replace(/"/g, '""')}"`,
                `"${t.status}"`,
                `"${t.priority}"`,
                `"${t.assignee.name}"`,
                `"${t.dueDate || ''}"`,
              ]);
              const csvContent =
                'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `deliverables_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="h-8 px-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 flex items-center gap-1 transition-colors text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Separate Route Views Strip */}
      <div className="px-6 py-1.5 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-2 shrink-0">
            Table View:
          </span>
          {[
            { label: 'All Records', slug: 'all', count: tasks.length, status: undefined },
            ...sortedStatuses.map((st) => ({
              label: st.name,
              slug: st.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              count: tasks.filter((t) => t.status === st.name).length,
              status: st.name as TaskStatus,
            })),
          ].map((tab) => {
            const isActive =
              (effectiveStatus === 'All' && tab.slug === 'all') ||
              effectiveStatus === tab.label;
            const isDragOverThisTab = dragOverTabSlug === tab.slug;

            return (
              <button
                key={tab.slug}
                type="button"
                onDragOver={(e) => {
                  if (!isReadOnly && draggingTaskId && tab.status) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTabSlug !== tab.slug) {
                      setDragOverTabSlug(tab.slug);
                    }
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverTabSlug === tab.slug) {
                    setDragOverTabSlug(null);
                  }
                }}
                onDrop={(e) => {
                  if (!isReadOnly && tab.status) {
                    e.preventDefault();
                    const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                    if (sourceTaskId) {
                      onMoveTaskStatus?.(sourceTaskId, tab.status);
                    }
                    setDraggingTaskId(null);
                    setDragOverTabSlug(null);
                    setDragOverTaskId(null);
                  }
                }}
                onClick={() => {
                  if (onSelectStatusRoute) {
                    onSelectStatusRoute(tab.slug);
                  } else {
                    setLocalStatusFilter(statusSlugToStatus[tab.slug] || 'All');
                  }
                }}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isDragOverThisTab
                    ? 'bg-orange-600 text-white font-bold ring-2 ring-orange-500 scale-105 shadow-md'
                    : isActive
                    ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-[6px] ${
                    isDragOverThisTab
                      ? 'bg-white/20 text-white'
                      : isActive
                      ? 'bg-orange-950 text-orange-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main High-Density Matrix View Canvas */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col justify-between">
        {/* Table Enclosure Card */}
        <div className="flex-1 bg-[#121214] rounded-[6px] border border-[#27272a] shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              {/* Header Row */}
              <thead>
                <tr className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredTasks.length && filteredTasks.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded-[6px] border-[#27272a] bg-[#18181b] text-orange-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="w-24 px-3 py-2.5 font-medium">
                    <div className="flex items-center gap-1 hover:text-zinc-200 cursor-pointer">
                      <span>ID</span>
                      <span className="material-symbols-outlined text-[13px]">unfold_more</span>
                    </div>
                  </th>
                  <th className="min-w-[340px] px-3 py-2.5 font-medium">Task Name &amp; Deliverable</th>
                  <th className="w-32 px-3 py-2.5 font-medium">Status</th>
                  <th className="w-28 px-3 py-2.5 font-medium">Priority</th>
                  <th className="w-28 px-3 py-2.5 font-medium">Due Date</th>
                  <th className="w-36 px-3 py-2.5 font-medium">Assignee</th>
                  <th className="w-48 px-3 py-2.5 font-medium">Linked CRM Deal</th>
                  <th className="w-24 px-3 py-2.5 text-right font-medium pr-4">
                    {isPoints ? 'Est. Points' : 'Est. Hours'}
                  </th>
                  <th className="w-16 px-3 py-2.5 text-center font-medium">Action</th>
                </tr>
              </thead>

              {/* High-Density Rows */}
              <tbody className="divide-y divide-[#27272a] text-xs">
                {filteredTasks.map((t) => {
                  const isChecked = selectedIds.includes(t.id);
                  const isRowActive = selectedTaskId === t.id;
                  const isDraggingThis = draggingTaskId === t.id;
                  const isDragOverThis = dragOverTaskId === t.id && !isDraggingThis;

                  return (
                    <tr
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
                        setDragOverTaskId(null);
                        setDragOverTabSlug(null);
                      }}
                      onDragOver={(e) => {
                        if (isReadOnly || !draggingTaskId || draggingTaskId === t.id) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverTaskId(t.id);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverTaskId === t.id) setDragOverTaskId(null);
                      }}
                      onDrop={(e) => {
                        if (isReadOnly) return;
                        e.preventDefault();
                        const sourceTaskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                        if (sourceTaskId && sourceTaskId !== t.id) {
                          onMoveTaskStatus?.(sourceTaskId, t.status, undefined, t.id, 'before');
                        }
                        setDraggingTaskId(null);
                        setDragOverTaskId(null);
                        setDragOverTabSlug(null);
                      }}
                      onClick={() => onSelectTask(t)}
                      className={`hover:bg-zinc-800/40 transition-colors group cursor-pointer ${
                        isDraggingThis
                          ? 'opacity-40 bg-orange-950/20'
                          : isRowActive
                          ? 'bg-orange-950/30 border-l-2 border-orange-500'
                          : ''
                      } ${
                        isDragOverThis ? 'border-t-2 border-t-orange-500 bg-orange-950/20' : ''
                      } ${density === 'comfortable' ? 'py-3' : 'py-2'}`}
                    >
                      {/* Checkbox */}
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectId(t.id);
                        }}
                        className="px-3 py-2 text-center"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectId(t.id)}
                          className="rounded-[6px] border-[#27272a] bg-[#18181b] text-orange-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>

                      {/* ID with drag indicator */}
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          {!isReadOnly && (
                            <span
                              className="material-symbols-outlined text-[14px] text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing select-none"
                              title="Drag deliverable"
                            >
                              drag_indicator
                            </span>
                          )}
                          <span>{t.id}</span>
                        </div>
                      </td>

                      {/* Task Name */}
                      <td className="px-3 py-2 font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'In Progress'
                                ? 'bg-orange-500'
                                : t.status === 'Done'
                                ? 'bg-emerald-500'
                                : t.status === 'In Review'
                                ? 'bg-amber-500'
                                : 'bg-zinc-500'
                            }`}
                          />
                          <span className={`truncate group-hover:text-orange-400 transition-colors ${t.status === 'Done' ? 'line-through text-zinc-500' : ''}`}>
                            {t.title}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        {getStatusBadge(t.status)}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-2">
                        {getPriorityBadge(t.priority)}
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-2 font-mono text-[11px] text-orange-400 font-semibold">
                        {t.dueDate || 'Today'}
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-zinc-200 bg-zinc-800 border border-zinc-700"
                            style={{
                              backgroundColor: t.assignee.avatarBg && t.assignee.avatarBg !== '#9900c2' ? t.assignee.avatarBg : '#27272a',
                            }}
                          >
                            {t.assignee.initials}
                          </div>
                          <span className="truncate text-zinc-300">{t.assignee.name}</span>
                        </div>
                      </td>

                      {/* Linked CRM Deal */}
                      <td className="px-3 py-2">
                        {t.linkedCrmDeal ? (
                          <span className="inline-block font-mono text-zinc-300 bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded-[6px] text-[10px] truncate max-w-[160px]">
                            {t.linkedCrmDeal.name}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Est. Effort */}
                      <td className="px-3 py-2 text-right font-mono text-zinc-400 pr-4">
                        {isPoints
                          ? `${t.estimation?.points ?? 0} pts`
                          : `${t.estimation?.hours ?? 0}h`}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-2 text-center">
                        {!isReadOnly ? (
                          <div className="flex items-center justify-center gap-1">
                            {onEditTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTask(t);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-orange-950/40 text-zinc-400 hover:text-orange-400 rounded-[6px] transition-all cursor-pointer"
                                title="Edit deliverable"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteTask(t);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded-[6px] transition-all cursor-pointer"
                              title="Delete deliverable"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-600">view-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination & Telemetry */}
          <div className="h-10 px-4 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span>Selected: <strong className="text-orange-400">{selectedIds.length}</strong></span>
              <span>•</span>
              <span>
                {isPoints ? 'Total Points: ' : 'Total Hours: '}
                <strong className="text-zinc-200">
                  {filteredTasks.reduce(
                    (acc, t) => acc + (isPoints ? (t.estimation?.points || 0) : (t.estimation?.hours || 0)),
                    0
                  )}
                  {isPoints ? ' pts' : 'h'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span>Data Store: <strong className="text-emerald-400">Synchronized</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
