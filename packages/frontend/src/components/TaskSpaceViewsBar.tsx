import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
  totalCount = 14,
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
  const { user } = useAuth();
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'Me';
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    title: true,
    priority: true,
    due: true,
    assignee: true,
    deal: true,
  });

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

  return (
    <section className="bg-white border-b border-[#d4c0d5]/30 px-6 py-1.5 flex flex-col gap-1.5 shrink-0 select-none z-10">
      {/* Top Row: View Switcher Tabs & Secondary Controls */}
      <div className="flex items-center justify-between h-9 text-xs">
        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-5 h-full font-medium">
          {/* List Tab */}
          <button
            onClick={() => onSelectView('list')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'list'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
            <span>List</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                currentView === 'list'
                  ? 'bg-[#9900c2]/10 text-[#9900c2] font-bold'
                  : 'bg-[#eeedf7] text-[#504252]'
              }`}
            >
              {taskCount}
            </span>
          </button>

          {/* Board Tab */}
          <button
            onClick={() => onSelectView('board')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'board'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_kanban</span>
            <span>Board</span>
          </button>

          {/* Table Tab */}
          <button
            onClick={() => onSelectView('table')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'table'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span>Table</span>
          </button>

          {/* Timeline Tab */}
          <button
            onClick={() => onSelectView('timeline')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'timeline'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">waterfall_chart</span>
            <span>Timeline</span>
          </button>

          {/* Calendar Tab */}
          <button
            onClick={() => onSelectView('calendar')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'calendar'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>Calendar</span>
          </button>

          {/* Docs Tab */}
          <button
            onClick={() => onSelectView('docs')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'docs'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Docs</span>
          </button>

          {/* List Settings Tab */}
          <button
            onClick={() => onSelectView('settings')}
            className={`py-1.5 h-full flex items-center gap-1.5 transition-colors relative ${
              currentView === 'settings'
                ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>List Settings</span>
          </button>
        </nav>

        {/* Right Secondary Matrix Toolbar with Working Dropdowns */}
        <div className="flex items-center gap-2.5 text-xs text-[#504252]">
          {/* Interactive Priority Dropdown */}
          <div ref={priorityRef} className="relative">
            <button
              onClick={() => setIsPriorityOpen(!isPriorityOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                filterPriority
                  ? 'bg-[#fbd7ff]/40 border-[#9900c2] text-[#9900c2] font-semibold'
                  : 'bg-[#f4f2fd] border-[#d4c0d5]/30 hover:border-[#9900c2]/40 text-[#504252]'
              }`}
              title="Filter tasks by priority"
            >
              <span className="material-symbols-outlined text-[14px] text-[#9900c2]">flag</span>
              <span className="text-[11px] font-mono">
                {filterPriority ? `Priority: ${filterPriority}` : 'Priority: All'}
              </span>
              <span className="material-symbols-outlined text-[13px] opacity-70">
                {isPriorityOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isPriorityOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#d4c0d5]/60 rounded-xl shadow-xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100 font-mono">
                <div className="px-3 py-1 text-[10px] uppercase text-[#837284] font-semibold">
                  Filter Priority
                </div>
                {['All', 'Urgent', 'High', 'Medium', 'Low'].map((p) => {
                  const isSelected = p === 'All' ? !filterPriority : filterPriority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setIsPriorityOpen(false);
                        onSelectFilterPriority?.(p === 'All' ? null : p);
                      }}
                      className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#f4f2fd] transition-colors ${
                        isSelected ? 'text-[#9900c2] font-bold bg-[#eeedf7]' : 'text-[#1a1b22]'
                      }`}
                    >
                      <span>{p}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px]">check</span>
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
              onClick={() => setIsGroupOpen(!isGroupOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f2fd] border border-[#d4c0d5]/30 hover:border-[#9900c2]/40 transition-colors text-[#504252]"
              title="Change grouping"
            >
              <span className="material-symbols-outlined text-[14px] text-[#5f5e61]">layers</span>
              <span className="text-[11px] capitalize">Group: {groupBy}</span>
              <span className="material-symbols-outlined text-[13px] opacity-70">
                {isGroupOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isGroupOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#d4c0d5]/60 rounded-xl shadow-xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-[#837284] font-semibold">
                  Group Tasks By
                </div>
                {[
                  { id: 'status' as const, label: 'Status' },
                  { id: 'priority' as const, label: 'Priority' },
                  { id: 'assignee' as const, label: 'Assignee' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsGroupOpen(false);
                      onSelectGroupBy?.(item.id);
                    }}
                    className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#f4f2fd] transition-colors ${
                      groupBy === item.id ? 'text-[#9900c2] font-bold bg-[#eeedf7]' : 'text-[#1a1b22]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {groupBy === item.id && (
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Columns Visibility Toggle */}
          <div ref={columnsRef} className="relative">
            <button
              onClick={() => setIsColumnsOpen(!isColumnsOpen)}
              className="flex items-center gap-1 text-[11px] text-[#5f5e61] hover:text-[#1a1b22] px-2 py-1 rounded hover:bg-[#f4f2fd] transition-colors"
              title="Column visibility"
            >
              <span className="material-symbols-outlined text-[14px]">view_column</span>
              <span>Columns ({Object.values(visibleColumns).filter(Boolean).length})</span>
            </button>

            {isColumnsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#d4c0d5]/60 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#837284] font-semibold">
                  Visible Columns
                </div>
                {[
                  { key: 'id', label: 'Task ID' },
                  { key: 'title', label: 'Title' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'due', label: 'Due Date' },
                  { key: 'assignee', label: 'Assignee' },
                  { key: 'deal', label: 'Linked Deal' },
                ].map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#f4f2fd] cursor-pointer text-[#1a1b22]"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key] ?? true}
                      onChange={() =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [col.key]: !prev[col.key],
                        }))
                      }
                      className="rounded border-[#d4c0d5] text-[#9900c2] focus:ring-[#9900c2]"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters CTA if active */}
          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 text-[11px] font-mono text-[#9900c2] hover:underline px-1 py-0.5"
              title="Clear all active task filters"
            >
              <span className="material-symbols-outlined text-[13px]">filter_alt_off</span>
              <span>Reset</span>
            </button>
          )}

          {onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#9900c2] hover:bg-[#b731e0] text-white font-semibold text-[11px] shadow-xs transition-colors ml-1"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Quick Actions Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 border-t border-[#d4c0d5]/20 text-xs no-scrollbar">
        <span className="font-mono text-[10px] uppercase font-semibold text-[#837284] shrink-0 mr-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-[#9900c2]">tune</span>
          <span>Quick:</span>
        </span>

        {/* All Tasks Pill */}
        <button
          onClick={() => {
            onSelectQuickFilter?.(null);
            onSelectFilterPriority?.(null);
            onSelectFilterStatus?.(null);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
            !quickFilter && !filterPriority && !filterStatus
              ? 'bg-[#9900c2] text-white border-[#9900c2] font-semibold shadow-xs'
              : 'bg-[#fafafc] border-[#d4c0d5]/40 text-[#504252] hover:bg-[#f4f2fd] hover:text-[#1a1b22]'
          }`}
        >
          <span>All Tasks</span>
          <span className="font-mono text-[10px] opacity-80">({totalCount})</span>
        </button>

        {/* Urgent Only Pill */}
        <button
          onClick={() => {
            const next = quickFilter === 'urgent' ? null : 'urgent';
            onSelectQuickFilter?.(next);
            onSelectFilterPriority?.(next ? 'Urgent' : null);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
            quickFilter === 'urgent' || filterPriority === 'Urgent'
              ? 'bg-[#9900c2] text-white border-[#9900c2] font-semibold shadow-xs'
              : 'bg-[#fafafc] border-[#d4c0d5]/40 text-[#504252] hover:bg-[#f4f2fd] hover:text-[#1a1b22]'
          }`}
        >
          <span className="material-symbols-outlined text-[13px] text-amber-500">bolt</span>
          <span>Urgent Only</span>
        </button>

        {/* My Tasks (Alex Wong) */}
        <button
          onClick={() => {
            const next = quickFilter === 'my-tasks' ? null : 'my-tasks';
            onSelectQuickFilter?.(next);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
            quickFilter === 'my-tasks'
              ? 'bg-[#9900c2] text-white border-[#9900c2] font-semibold shadow-xs'
              : 'bg-[#fafafc] border-[#d4c0d5]/40 text-[#504252] hover:bg-[#f4f2fd] hover:text-[#1a1b22]'
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">person</span>
          <span>My Tasks ({userInitials})</span>
        </button>

        {/* In Progress */}
        <button
          onClick={() => {
            const next = quickFilter === 'in-progress' ? null : 'in-progress';
            onSelectQuickFilter?.(next);
            onSelectFilterStatus?.(next ? 'In Progress' : null);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
            quickFilter === 'in-progress' || filterStatus === 'In Progress'
              ? 'bg-[#9900c2] text-white border-[#9900c2] font-semibold shadow-xs'
              : 'bg-[#fafafc] border-[#d4c0d5]/40 text-[#504252] hover:bg-[#f4f2fd] hover:text-[#1a1b22]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#c03ce9]"></span>
          <span>In Progress</span>
        </button>

        {/* In Review */}
        <button
          onClick={() => {
            const next = quickFilter === 'needs-review' ? null : 'needs-review';
            onSelectQuickFilter?.(next);
            onSelectFilterStatus?.(next ? 'In Review' : null);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
            quickFilter === 'needs-review' || filterStatus === 'In Review'
              ? 'bg-[#9900c2] text-white border-[#9900c2] font-semibold shadow-xs'
              : 'bg-[#fafafc] border-[#d4c0d5]/40 text-[#504252] hover:bg-[#f4f2fd] hover:text-[#1a1b22]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Needs Review</span>
        </button>

        {/* Due Soon */}
        <button
          onClick={() => {
            const next = quickFilter === 'due-soon' ? null : 'due-soon';
            onSelectQuickFilter?.(next);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0 ${
            quickFilter === 'due-soon'
              ? 'bg-[#9900c2] text-white border-[#9900c2] font-semibold shadow-xs'
              : 'bg-[#fafafc] border-[#d4c0d5]/40 text-[#504252] hover:bg-[#f4f2fd] hover:text-[#1a1b22]'
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          <span>Due Soon</span>
        </button>

        <span className="ml-auto font-mono text-[10px] text-[#837284] shrink-0">
          Showing {taskCount} items
        </span>
      </div>
    </section>
  );
};
