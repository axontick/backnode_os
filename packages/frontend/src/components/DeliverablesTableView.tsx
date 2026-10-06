import React, { useState } from 'react';
import { TaskItem, TaskStatus } from '../types';

interface DeliverablesTableViewProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: () => void;
  onRequestDeleteTask: (task: TaskItem) => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
}

export const DeliverablesTableView: React.FC<DeliverablesTableViewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onOpenCreateTask,
  onRequestDeleteTask,
  onNavigateToView,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['ENG-101', 'ENG-103']);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      filterQuery === '' ||
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.assignee.name.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafc] overflow-hidden select-none text-xs">
      {/* Table Utility Controls Toolbar */}
      <div className="px-6 py-2 bg-white/80 border-b border-[#d4c0d5]/30 flex items-center justify-between shrink-0 h-11">
        {/* Left Table Context */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1a1b22] text-xs">Deliverables Spreadsheet</span>
          <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-2 py-0.5 rounded-full">
            {filteredTasks.length} records
          </span>
        </div>

        {/* Right Table Scoped Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Filter Input */}
          <div className="relative w-48">
            <span className="material-symbols-outlined absolute left-2 top-2 text-[14px] text-[#5f5e61]">
              filter_alt
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter deliverables..."
              className="w-full h-8 pl-7 pr-2 bg-[#f4f2fd] border border-[#d4c0d5]/30 rounded-md text-xs text-[#1a1b22] placeholder:text-[#5f5e61] focus:outline-none focus:border-[#9900c2]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 rounded-md border border-[#d4c0d5]/30 bg-white text-[#504252] text-xs focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses ({tasks.length})</option>
            <option value="In Progress">In Progress ({inProgressCount})</option>
            <option value="In Review">In Review ({inReviewCount})</option>
            <option value="Done">Done ({doneCount})</option>
            <option value="Backlog">Backlog ({backlogCount})</option>
          </select>

          {/* Density Toggle */}
          <div className="h-8 px-1 bg-[#f4f2fd] rounded-md border border-[#d4c0d5]/30 flex items-center font-mono text-[10px]">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded transition-colors ${
                density === 'compact' ? 'bg-white text-[#1a1b22] shadow-xs font-bold' : 'text-[#504252]'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-0.5 rounded transition-colors ${
                density === 'comfortable' ? 'bg-white text-[#1a1b22] shadow-xs font-bold' : 'text-[#504252]'
              }`}
            >
              Comfortable
            </button>
          </div>

          {/* Export CSV */}
          <button
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
            className="h-8 px-2.5 rounded-md border border-[#d4c0d5]/30 bg-white hover:bg-[#eeedf7] text-[#504252] hover:text-[#1a1b22] flex items-center gap-1 transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Main High-Density Matrix View Canvas */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col justify-between">
        {/* Table Enclosure Card */}
        <div className="flex-1 bg-white rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              {/* Header Row */}
              <thead>
                <tr className="bg-[#f4f2fd]/80 border-b border-[#d4c0d5]/30 text-[#5f5e61] font-mono text-[11px] uppercase tracking-wider select-none">
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredTasks.length && filteredTasks.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded border-zinc-300 text-[#9900c2] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="w-24 px-3 py-2.5 font-medium">
                    <div className="flex items-center gap-1 hover:text-[#1a1b22] cursor-pointer">
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
                  <th className="w-24 px-3 py-2.5 text-right font-medium pr-4">Est. Hours</th>
                  <th className="w-16 px-3 py-2.5 text-center font-medium">Action</th>
                </tr>
              </thead>

              {/* High-Density Rows */}
              <tbody className="divide-y divide-[#d4c0d5]/20 text-xs">
                {filteredTasks.map((t) => {
                  const isChecked = selectedIds.includes(t.id);
                  const isRowActive = selectedTaskId === t.id;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`hover:bg-[#f4f2fd]/50 transition-colors group cursor-pointer ${
                        isRowActive ? 'bg-[#9900c2]/5 font-medium' : ''
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
                          className="rounded border-zinc-300 text-[#9900c2] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>

                      {/* ID */}
                      <td className="px-3 py-2 font-mono text-[11px] text-[#5f5e61] font-semibold">
                        {t.id}
                      </td>

                      {/* Task Name */}
                      <td className="px-3 py-2 font-medium text-[#1a1b22]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'In Progress'
                                ? 'bg-[#9900c2]'
                                : t.status === 'Done'
                                ? 'bg-emerald-500'
                                : t.status === 'In Review'
                                ? 'bg-indigo-500'
                                : 'bg-zinc-400'
                            }`}
                          />
                          <span className={`truncate ${t.status === 'Done' ? 'line-through text-zinc-400' : ''}`}>
                            {t.title}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-medium ${
                            t.status === 'In Progress'
                              ? 'bg-[#fbd7ff]/40 text-[#9900c2] border border-[#9900c2]/30'
                              : t.status === 'Done'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'In Review'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'In Progress'
                                ? 'bg-[#9900c2] animate-pulse'
                                : t.status === 'Done'
                                ? 'bg-emerald-500'
                                : t.status === 'In Review'
                                ? 'bg-indigo-500'
                                : 'bg-zinc-400'
                            }`}
                          />
                          {t.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                            t.priority === 'Urgent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : t.priority === 'High'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : t.priority === 'Medium'
                              ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-2 font-mono text-[11px] text-[#5f5e61]">
                        {t.dueDate || 'Oct 24, 2026'}
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#eeedf7] text-[#9900c2] flex items-center justify-center font-mono text-[9px] font-bold border border-[#d4c0d5]/40">
                            {t.assignee.initials}
                          </div>
                          <span className="text-[11px] text-[#1a1b22]">{t.assignee.name}</span>
                        </div>
                      </td>

                      {/* Linked CRM Deal */}
                      <td className="px-3 py-2">
                        {t.linkedCrmDeal?.name ? (
                          <div className="inline-flex items-center gap-1 text-[11px] text-[#9900c2] hover:underline">
                            <span className="material-symbols-outlined text-[13px]">link</span>
                            <span>{t.linkedCrmDeal.name} ({t.linkedCrmDeal.value})</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#837284]">—</span>
                        )}
                      </td>

                      {/* Est. Hours */}
                      <td className="px-3 py-2 text-right pr-4 font-mono text-[11px] text-[#5f5e61]">
                        {t.estimation.hours}h
                      </td>

                      {/* Action Menu (Delete, Inspect) */}
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-2 text-center"
                      >
                        <button
                          onClick={() => onRequestDeleteTask(t)}
                          title="Delete deliverable permanently..."
                          className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Inline Quick Add Row Placeholder */}
                <tr
                  onClick={onOpenCreateTask}
                  className="hover:bg-[#f4f2fd]/30 cursor-pointer group transition-colors border-t border-dashed border-[#d4c0d5]/50"
                >
                  <td className="px-3 py-2 text-center text-[#837284]">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </td>
                  <td colSpan={9} className="px-3 py-2 text-xs text-[#504252] italic group-hover:text-[#9900c2]">
                    + Add new deliverable or press Enter...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pinned Summary Footer Bar Inside Card */}
          <div className="h-10 bg-[#f4f2fd]/60 border-t border-[#d4c0d5]/30 px-4 flex items-center justify-between font-mono text-[11px] text-[#5f5e61] select-none">
            <div className="flex items-center gap-3">
              <span className="font-medium text-[#1a1b22]">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
              <span className="text-[#d4c0d5]">·</span>
              <span className="text-[#9900c2] font-medium">{inProgressCount} In Progress</span>
              <span className="text-indigo-600 font-medium">{inReviewCount} In Review</span>
              <span className="text-emerald-600 font-medium">{doneCount} Done</span>
              <span className="text-zinc-600 font-medium">{backlogCount} Backlog</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>⚡ SQLite Query Time:</span>
                <span className="font-semibold">0.12ms</span>
              </div>
              <div className="text-[#1a1b22] font-semibold text-xs">
                Total Est:{' '}
                <span className="text-[#9900c2]">
                  {tasks.reduce((acc, t) => acc + (t.estimation?.hours || 0), 0)} hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Command HUD Pill / Micro-Status Dock */}
        <div className="mt-4 flex items-center justify-between px-1 text-xs text-[#5f5e61]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-[11px]">IndexedDB Cache: Synchronized</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">lock_reset</span>
              <span className="font-mono text-[11px]">E2E Encryption: AES-256-GCM</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Shortcuts: <kbd className="px-1 py-0.5 bg-white border border-[#d4c0d5]/40 rounded text-[10px]">C</kbd>{' '}
              New Task, <kbd className="px-1 py-0.5 bg-white border border-[#d4c0d5]/40 rounded text-[10px]">J</kbd>/
              <kbd className="px-1 py-0.5 bg-white border border-[#d4c0d5]/40 rounded text-[10px]">K</kbd> Navigate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
