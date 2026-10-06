import React, { useState } from 'react';
import { SpaceFolder, TaskItem } from '../types';

interface TaskSpaceDashboardViewProps {
  folders: SpaceFolder[];
  tasks: TaskItem[];
  onSelectSpace: (spaceId: string) => void;
  onOpenAddFolder: () => void;
  onOpenCreateTask: () => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar') => void;
}

export const TaskSpaceDashboardView: React.FC<TaskSpaceDashboardViewProps> = ({
  folders,
  tasks,
  onSelectSpace,
  onOpenAddFolder,
  onOpenCreateTask,
  onNavigateToView,
}) => {
  // Local state to track which folder cards have their item drawer expanded on the dashboard
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({
    'fld-engineering': true,
    'fld-client-deliverables': true,
  });

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const doneTasks = tasks.filter((t) => t.status === 'Done');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;
  const totalHours = tasks.reduce((acc, t) => acc + (t.estimation?.hours || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafc] overflow-y-auto select-none p-6 text-xs custom-scrollbar">
      {/* 1. Dashboard Header Banner */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#9900c2] bg-[#fbd7ff]/40 px-2 py-0.5 rounded-full border border-[#9900c2]/20">
              Workspace Overview
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] text-[#5f5e61]">Local-First Synchronization</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a1b22] tracking-tight">
            Task Spaces &amp; Engineering Hub
          </h1>
          <p className="text-xs text-[#504252] mt-1 max-w-2xl leading-relaxed">
            Multi-folder workspaces, sprint deliverables, test gates, and engineering pipeline execution.
          </p>
        </div>

        {/* Action Controls Cluster with Smooth Transitions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Add Folder Button */}
          <button
            onClick={onOpenAddFolder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d4c0d5]/50 bg-white hover:bg-[#f4f2fd] hover:border-[#9900c2]/40 text-[#1a1b22] font-semibold text-xs transition-all active:scale-[0.98] shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px] text-[#9900c2]">
              create_new_folder
            </span>
            <span>+ Add Folder</span>
          </button>

          {/* New Deliverable Primary CTA */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-sm shadow-[#9900c2]/25"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>+ New Deliverable</span>
          </button>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Deliverables Overview */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Total Deliverables
            </span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#9900c2] flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">task_alt</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">{totalTasks} tasks</div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#504252]">
              <span className="text-[#9900c2] font-semibold">{inProgressTasks.length} In Progress</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{doneTasks.length} Done</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completion Velocity */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Cycle Completion
            </span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
              {completionRate}%
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">{completionRate}% Completed</div>
            <div className="w-full h-1.5 bg-[#eeedf7] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Active Task Folders */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Organized Folders
            </span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">folder_copy</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">{folders.length} Spaces</div>
            <div className="text-[11px] text-[#504252] mt-1">
              Across engineering, triage &amp; operations
            </div>
          </div>
        </div>

        {/* Card 4: Story Points & Velocity */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Workload &amp; Hours
            </span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">{totalHours} hrs est.</div>
            <div className="text-[11px] text-[#504252] mt-1">Sprint 14 deliverable commitment</div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Task Folders Directory (Expandable Cards Grid) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9900c2] text-[18px]">folder_open</span>
            <h2 className="font-bold text-sm text-[#1a1b22]">Workspace Folders &amp; Cycles</h2>
            <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-2 py-0.5 rounded-full font-semibold">
              {folders.length} active
            </span>
          </div>

          <button
            onClick={onOpenAddFolder}
            className="flex items-center gap-1 text-xs font-semibold text-[#9900c2] hover:underline transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Folder</span>
          </button>
        </div>

        {/* Folder Bento Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {folders.map((folder) => {
            const hasItems = folder.items && folder.items.length > 0;
            const isExpanded = !!expandedFolderIds[folder.id];
            const folderTaskTotal = folder.items.reduce((sum, item) => sum + item.taskCount, 0);

            return (
              <div
                key={folder.id}
                className="bg-white rounded-xl border border-[#d4c0d5]/40 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[#9900c2]/40 flex flex-col"
              >
                {/* Folder Card Header */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: folder.color }}
                    >
                      <span className="material-symbols-outlined text-[20px]">{folder.icon}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1a1b22] tracking-tight">
                          {folder.name}
                        </h3>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#eeedf7] text-[#504252] font-semibold">
                          {folder.items.length} {folder.items.length === 1 ? 'list' : 'lists'}
                        </span>
                      </div>
                      <p className="text-xs text-[#504252] mt-0.5 line-clamp-1">
                        {folder.description || 'Workspace folder for deliverables.'}
                      </p>
                    </div>
                  </div>

                  {/* Expand / Collapse Action Button */}
                  {hasItems ? (
                    <button
                      onClick={() => toggleFolderExpand(folder.id)}
                      className="p-1.5 rounded-lg hover:bg-[#eeedf7] text-[#504252] hover:text-[#1a1b22] transition-all flex items-center gap-1 text-xs font-mono"
                      title={isExpanded ? 'Collapse folder items' : 'Expand folder items'}
                    >
                      <span className="text-[10px] hidden sm:inline">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[#9900c2]' : 'rotate-0'
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] text-[#837284] italic">Empty</span>
                  )}
                </div>

                {/* Expandable Sub-Items Drawer with Smooth Transition */}
                {hasItems && (
                  <div
                    className={`transition-all duration-300 ease-in-out border-t border-[#d4c0d5]/20 bg-[#fafafc] ${
                      isExpanded ? 'max-h-96 opacity-100 p-3' : 'max-h-0 opacity-0 p-0 overflow-hidden border-t-0'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="font-mono text-[10px] uppercase font-semibold text-[#837284] px-1">
                        Contains {folder.items.length} Lists ({folderTaskTotal} Tasks)
                      </div>

                      {folder.items.map((subItem) => (
                        <div
                          key={subItem.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#d4c0d5]/30 hover:border-[#9900c2]/50 hover:bg-[#f4f2fd]/40 transition-all group cursor-pointer"
                          onClick={() => onSelectSpace(subItem.id)}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                subItem.active ? 'bg-[#9900c2] animate-pulse' : 'bg-zinc-400'
                              }`}
                            />
                            <span className="font-medium text-xs text-[#1a1b22] truncate group-hover:text-[#9900c2] transition-colors">
                              {subItem.name}
                            </span>
                            {subItem.status && (
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-[#9900c2] font-semibold border border-purple-200">
                                {subItem.status}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-[#504252] bg-[#eeedf7] px-1.5 py-0.5 rounded">
                              {subItem.taskCount} tasks
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSpace(subItem.id);
                              }}
                              className="px-2 py-1 rounded bg-[#9900c2]/10 hover:bg-[#9900c2] hover:text-white text-[#9900c2] font-semibold text-[11px] transition-all flex items-center gap-1"
                            >
                              <span>Open List</span>
                              <span className="material-symbols-outlined text-[13px]">
                                arrow_forward
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Sprint 14 Focus Stream & Quick Views */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/20 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#9900c2] animate-pulse"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#1a1b22]">
              Active Sprint 14 Deliverables Snapshot
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => onNavigateToView('board')}
              className="px-2.5 py-1 rounded-md bg-[#eeedf7] hover:bg-[#9900c2] hover:text-white text-[#504252] transition-all"
            >
              Kanban Board
            </button>
            <button
              onClick={() => onNavigateToView('table')}
              className="px-2.5 py-1 rounded-md bg-[#eeedf7] hover:bg-[#9900c2] hover:text-white text-[#504252] transition-all"
            >
              Table View
            </button>
            <button
              onClick={() => onNavigateToView('timeline')}
              className="px-2.5 py-1 rounded-md bg-[#eeedf7] hover:bg-[#9900c2] hover:text-white text-[#504252] transition-all"
            >
              Timeline
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {tasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-[#d4c0d5]/30 hover:bg-[#f4f2fd]/50 transition-colors"
            >
              <div className="flex items-center gap-3 truncate">
                <span className="font-mono text-[11px] font-bold text-[#5f5e61]">{task.id}</span>
                <span className="font-semibold text-xs text-[#1a1b22] truncate">{task.title}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold ${
                    task.status === 'In Progress'
                      ? 'bg-purple-50 text-[#9900c2] border border-purple-200'
                      : task.status === 'Done'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                  }`}
                >
                  {task.status}
                </span>
                <span className="text-[#5f5e61]">{task.dueDate || 'Oct 24'}</span>
                <div className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[9px]">
                  {task.assignee.initials}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
