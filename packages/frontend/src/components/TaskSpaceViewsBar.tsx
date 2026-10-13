import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface TaskSpaceViewsBarProps {
  currentView: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs';
  onSelectView: (view: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  taskCount: number;
  totalCount?: number;
  filterPriority?: string | null;
  onSelectFilterPriority?: (p: string | null) => void;
  filterStatus?: string | null;
  onSelectFilterStatus?: (s: string | null) => void;
  quickFilter?: string | null;
  onSelectQuickFilter?: (q: string | null) => void;
  groupBy?: 'status' | 'priority' | 'assignee';
  onSelectGroupBy?: (g: 'status' | 'priority' | 'assignee') => void;
  onClearFilters?: () => void;
  onOpenCreateTask?: () => void;
}

export const TaskSpaceViewsBar: React.FC<TaskSpaceViewsBarProps> = ({
  currentView,
  onSelectView,
  taskCount,
  totalCount = 0,
  filterPriority = null,
  onSelectFilterPriority,
  filterStatus = null,
  onSelectFilterStatus,
  quickFilter = null,
  onSelectQuickFilter,
  groupBy = 'status',
  onSelectGroupBy,
  onClearFilters,
  onOpenCreateTask,
}) => {
  const { user, effectiveRole } = useAuth();
  const { visibleColumns, setVisibleColumns, tasks } = useWorkspace();
  const isReadOnly = effectiveRole === 'VIEWER';
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ME';

  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);

  const priorityRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setIsPriorityOpen(false);
      }
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setIsGroupOpen(false);
      }
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setIsColumnsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = Boolean(filterPriority || filterStatus || quickFilter);

  // Discover custom fields dynamically from tasks in the workspace
  const availableCustomFields = useMemo(() => {
    const keys = new Set<string>();
    for (const t of tasks) {
      if (t.customLinks && typeof t.customLinks === 'object') {
        for (const k of Object.keys(t.customLinks)) {
          if (k && !k.startsWith('crm-') && k !== 'dependencies') {
            keys.add(k);
          }
        }
      }
    }
    return Array.from(keys);
  }, [tasks]);

  const allColumnsList = useMemo(() => {
    const standard = [
      { key: 'id', label: 'Task ID' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'due', label: 'Due Date' },
      { key: 'start', label: 'Start Date' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'deal', label: 'Linked Deal' },
      { key: 'estimation', label: 'Estimation' },
    ];
    const custom = availableCustomFields.map((field) => ({
      key: `custom:${field}`,
      label: field.charAt(0).toUpperCase() + field.slice(1).replace(/[-_]/g, ' '),
      isCustom: true,
    }));
    return [...standard, ...custom];
  }, [availableCustomFields]);

  const activeColumnsCount = useMemo(() => {
    return allColumnsList.filter((col) => visibleColumns[col.key] ?? !col.key.startsWith('custom:')).length;
  }, [allColumnsList, visibleColumns]);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: prev[key] !== undefined ? !prev[key] : false,
    }));
  };

  return (
    <section className="bg-[#121214] border-b border-[#27272a] px-6 flex flex-col shrink-0 z-10">
      {/* Top Row: View Switcher Tabs & Primary Action CTA */}
      <div className="flex items-center justify-between h-10 text-xs">
        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1.5 h-full font-medium">
          {/* List Tab */}
          <button
            type="button"
            onClick={() => onSelectView('list')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'list'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
            <span>List</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] ${
                currentView === 'list'
                  ? 'bg-orange-950/60 text-orange-400 font-bold border border-orange-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {taskCount}
            </span>
          </button>

          {/* Board Tab */}
          <button
            type="button"
            onClick={() => onSelectView('board')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'board'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_kanban</span>
            <span>Board</span>
          </button>

          {/* Table Tab */}
          <button
            type="button"
            onClick={() => onSelectView('table')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'table'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span>Table</span>
          </button>

          {/* Timeline Tab */}
          <button
            type="button"
            onClick={() => onSelectView('timeline')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'timeline'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">waterfall_chart</span>
            <span>Timeline</span>
          </button>

          {/* Calendar Tab */}
          <button
            type="button"
            onClick={() => onSelectView('calendar')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'calendar'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>Calendar</span>
          </button>

          {/* Docs Tab */}
          <button
            type="button"
            onClick={() => onSelectView('docs')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'docs'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Docs</span>
          </button>

          {/* List Settings Tab */}
          <button
            type="button"
            onClick={() => onSelectView('settings')}
            className={`px-3 py-1.5 h-full flex items-center gap-1.5 transition-colors cursor-pointer rounded-t-[6px] ${
              currentView === 'settings'
                ? 'text-orange-400 font-semibold border-b-2 border-orange-500 bg-orange-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>List Settings</span>
          </button>
        </nav>

        {/* Right Action Controls: Reset & Create Task */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {/* Reset Filters CTA if active */}
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="h-7 flex items-center gap-1 px-2.5 rounded-[6px] bg-orange-950/40 border border-orange-500/30 text-[11px] font-mono text-orange-400 hover:bg-orange-950/60 transition-colors cursor-pointer"
              title="Clear all active task filters"
            >
              <span className="material-symbols-outlined text-[13px] leading-none shrink-0">filter_alt_off</span>
              <span className="leading-none">Reset Filters</span>
            </button>
          )}

          {!isReadOnly && onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="h-7 flex items-center gap-1 px-3 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white font-semibold text-[11px] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px] leading-none shrink-0">add</span>
              <span className="leading-none">Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Secondary Toolbar (Quick Filters + Priority, Group, and Columns Controls) */}
      <div className="h-10 flex items-center justify-between gap-3 overflow-x-auto border-t border-[#27272a] text-xs no-scrollbar">
        {/* Left: Quick Filter Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase font-semibold text-zinc-500 shrink-0 mr-1 flex items-center gap-1.5 h-7">
            <span className="material-symbols-outlined text-[14px] text-orange-400 leading-none shrink-0">tune</span>
            <span className="leading-none">Quick:</span>
          </span>

          {/* All Tasks Pill */}
          <button
            type="button"
            onClick={() => {
              onSelectQuickFilter?.(null);
              onSelectFilterPriority?.(null);
              onSelectFilterStatus?.(null);
            }}
            className={`h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors shrink-0 cursor-pointer ${
              !quickFilter && !filterPriority && !filterStatus
                ? 'bg-orange-950/50 text-orange-400 border-orange-500/40 font-semibold'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="leading-none">All Tasks</span>
            <span className="font-mono text-[10px] opacity-80 leading-none">({totalCount})</span>
          </button>

          {/* Urgent Only Pill */}
          <button
            type="button"
            onClick={() => {
              const next = quickFilter === 'urgent' ? null : 'urgent';
              onSelectQuickFilter?.(next);
              onSelectFilterPriority?.(next ? 'Urgent' : null);
            }}
            className={`h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors shrink-0 cursor-pointer ${
              quickFilter === 'urgent' || filterPriority === 'Urgent'
                ? 'bg-orange-950/50 text-orange-400 border-orange-500/40 font-semibold'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-amber-400 leading-none shrink-0">bolt</span>
            <span className="leading-none">Urgent Only</span>
          </button>

          {/* My Tasks */}
          <button
            type="button"
            onClick={() => {
              const next = quickFilter === 'my-tasks' ? null : 'my-tasks';
              onSelectQuickFilter?.(next);
            }}
            className={`h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors shrink-0 cursor-pointer ${
              quickFilter === 'my-tasks'
                ? 'bg-orange-950/50 text-orange-400 border-orange-500/40 font-semibold'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] leading-none shrink-0">person</span>
            <span className="leading-none">My Tasks ({userInitials})</span>
          </button>

          {/* Due Soon */}
          <button
            type="button"
            onClick={() => {
              const next = quickFilter === 'due-soon' ? null : 'due-soon';
              onSelectQuickFilter?.(next);
            }}
            className={`h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors shrink-0 cursor-pointer ${
              quickFilter === 'due-soon'
                ? 'bg-orange-950/50 text-orange-400 border-orange-500/40 font-semibold'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] leading-none shrink-0">schedule</span>
            <span className="leading-none">Due Soon</span>
          </button>
        </div>

        {/* Right: Secondary Toolbar Matrix Controls (Priority, Group, Columns) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Interactive Priority Dropdown */}
          <div ref={priorityRef} className="relative">
            <button
              type="button"
              onClick={() => setIsPriorityOpen(!isPriorityOpen)}
              className={`h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] border transition-colors cursor-pointer ${
                filterPriority
                  ? 'bg-orange-950/50 border-orange-500/40 text-orange-400 font-semibold'
                  : 'bg-[#18181b] border-[#27272a] hover:border-zinc-700 text-zinc-300'
              }`}
              title="Filter tasks by priority"
            >
              <span className="material-symbols-outlined text-[14px] text-orange-400 leading-none shrink-0">flag</span>
              <span className="text-[11px] font-mono leading-none">
                {filterPriority ? `Priority: ${filterPriority}` : 'Priority: All'}
              </span>
              <span className="material-symbols-outlined text-[13px] opacity-70 leading-none shrink-0">
                {isPriorityOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isPriorityOpen && (
              <div className="absolute right-0 top-full mt-1.5 min-w-full w-max max-w-xs ui-dropdown-menu bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100 font-mono">
                <div className="px-3 py-1 text-[10px] uppercase text-zinc-500 font-semibold">
                  Filter Priority
                </div>
                {['All', 'Urgent', 'High', 'Medium', 'Low'].map((p) => {
                  const isSelected = p === 'All' ? !filterPriority : filterPriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setIsPriorityOpen(false);
                        onSelectFilterPriority?.(p === 'All' ? null : p);
                      }}
                      className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-orange-950/30 hover:text-orange-400 transition-colors cursor-pointer ${
                        isSelected ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-zinc-300'
                      }`}
                    >
                      <span>{p}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] text-orange-400">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Group By Dropdown */}
          <div ref={groupRef} className="relative">
            <button
              type="button"
              onClick={() => setIsGroupOpen(!isGroupOpen)}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] hover:border-zinc-700 transition-colors text-zinc-300 cursor-pointer"
              title="Change grouping"
            >
              <span className="material-symbols-outlined text-[14px] text-zinc-400 leading-none shrink-0">layers</span>
              <span className="text-[11px] capitalize leading-none">Group: {groupBy}</span>
              <span className="material-symbols-outlined text-[13px] opacity-70 leading-none shrink-0">
                {isGroupOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isGroupOpen && (
              <div className="absolute right-0 top-full mt-1.5 min-w-full w-max max-w-xs ui-dropdown-menu bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                  Group Tasks By
                </div>
                {[
                  { id: 'status' as const, label: 'Status' },
                  { id: 'priority' as const, label: 'Priority' },
                  { id: 'assignee' as const, label: 'Assignee' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsGroupOpen(false);
                      onSelectGroupBy?.(item.id);
                    }}
                    className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-orange-950/30 hover:text-orange-400 transition-colors cursor-pointer ${
                      groupBy === item.id ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-zinc-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    {groupBy === item.id && (
                      <span className="material-symbols-outlined text-[13px] text-orange-400">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Columns Visibility Toggle with Custom Fields */}
          <div ref={columnsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsColumnsOpen(!isColumnsOpen)}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-zinc-300 text-[11px] transition-colors cursor-pointer"
              title="Column visibility"
            >
              <span className="material-symbols-outlined text-[14px] leading-none shrink-0">view_column</span>
              <span className="leading-none">Columns ({activeColumnsCount})</span>
              <span className="material-symbols-outlined text-[13px] opacity-70 leading-none shrink-0">
                {isColumnsOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isColumnsOpen && (
              <div className="absolute right-0 top-full mt-1.5 min-w-[200px] w-max max-w-xs ui-dropdown-menu bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold border-b border-[#27272a]">
                  Standard Columns
                </div>
                {allColumnsList
                  .filter((col) => !col.key.startsWith('custom:'))
                  .map((col) => {
                    const isChecked = visibleColumns[col.key] ?? true;
                    return (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#18181b] cursor-pointer text-zinc-300 hover:text-zinc-100 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded-[4px] border-[#27272a] bg-[#18181b] text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}

                {availableCustomFields.length > 0 && (
                  <>
                    <div className="px-2 py-1 mt-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold border-b border-[#27272a]">
                      Custom Fields
                    </div>
                    {allColumnsList
                      .filter((col) => col.key.startsWith('custom:'))
                      .map((col) => {
                        const isChecked = visibleColumns[col.key] ?? false;
                        return (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#18181b] cursor-pointer text-zinc-300 hover:text-zinc-100 select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumn(col.key)}
                              className="rounded-[4px] border-[#27272a] bg-[#18181b] text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                              <span>{col.label}</span>
                            </span>
                          </label>
                        );
                      })}
                  </>
                )}
              </div>
            )}
          </div>

          <span className="font-mono text-[10px] text-zinc-500 shrink-0 hidden sm:inline ml-1">
            {taskCount} items
          </span>
        </div>
      </div>
    </section>
  );
};
