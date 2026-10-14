import React, { useState } from 'react';
import { SpaceFolder, TaskItem } from '../types';
import { ActionContextMenu } from './ActionContextMenu';
import { useWorkspace } from '../context/WorkspaceContext';

interface TaskSpaceDashboardViewProps {
  folders: SpaceFolder[];
  tasks: TaskItem[];
  onSelectSpace: (spaceId: string) => void;
  onOpenAddFolder: () => void;
  onOpenAddListToFolder?: (folder: SpaceFolder) => void;
  onOpenCreateTask: () => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar') => void;
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;
}

export const TaskSpaceDashboardView: React.FC<TaskSpaceDashboardViewProps> = ({
  folders,
  tasks,
  onSelectSpace,
  onOpenAddFolder,
  onOpenAddListToFolder,
  onOpenCreateTask,
  onNavigateToView,
  onEditFolder,
  onDeleteFolder,
}) => {
  const { listSettings, handleOpenSpaceImport, handleOpenSpaceExport } = useWorkspace();
  const isPoints = listSettings?.estimationUnit === 'Story Points';

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (folders && folders.length > 0) {
      folders.forEach((f) => {
        initial[f.id] = true;
      });
    }
    return initial;
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
  const totalPoints = tasks.reduce((acc, t) => acc + (t.estimation?.points || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b] text-zinc-100">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* 1. Dashboard Header Banner (Matched to OverviewView) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#27272a] pb-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-[6px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                WORKSPACE HUBS: ACTIVE
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-[11px] text-zinc-400">Local-First Synchronization</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight font-headline">
              Task Spaces &amp; Engineering Hub
            </h1>
            <p className="text-xs text-zinc-400 font-body">
              Multi-folder workspaces, sprint deliverables, test gates, and engineering pipeline execution.
            </p>
          </div>

          {/* Action Controls Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenSpaceImport(folders[0])}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Import tasks from CSV or JSON"
            >
              <span className="material-symbols-outlined text-[16px] text-orange-400">upload_file</span>
              <span>Import</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSpaceExport(folders[0])}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Export tasks from space"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddFolder}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px] text-orange-400">
                create_new_folder
              </span>
              <span>Add Folder</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateTask}
              className="px-3.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Deliverable</span>
            </button>
          </div>
        </div>

        {/* 2. Bento KPI Metric Cards Ribbon (Matched to OverviewView font sizes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Deliverables Overview */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Total Deliverables
              </span>
              <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.5 rounded-[6px] font-bold">
                Volume
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{totalTasks}</span>
              <span className="text-xs text-zinc-400">items logged</span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-orange-400 font-medium">{inProgressTasks.length} In Progress</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-medium">{doneTasks.length} Done</span>
              </div>
              <span className="block font-mono text-[10px] text-zinc-500 mt-2">
                Active sprint deliverables
              </span>
            </div>
          </div>

          {/* Card 2: Completion Velocity */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Cycle Completion
              </span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-[6px] font-bold">
                {completionRate}%
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{completionRate}%</span>
              <span className="text-xs text-zinc-400">{doneTasks.length} of {totalTasks} closed</span>
            </div>
            <div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <span className="block font-mono text-[10px] text-zinc-500 mt-2">
                Cycle velocity index
              </span>
            </div>
          </div>

          {/* Card 3: Active Task Folders */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Organized Folders
              </span>
              <span className="font-mono text-[10px] text-blue-400 bg-blue-950/40 border border-blue-500/30 px-1.5 py-0.5 rounded-[6px] font-bold">
                {folders.length} Spaces
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{folders.length}</span>
              <span className="text-xs text-zinc-400">workspace domains</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block truncate">
                Engineering, triage &amp; client scopes
              </span>
              <span className="block font-mono text-[10px] text-zinc-500 mt-2">
                Segregated project folders
              </span>
            </div>
          </div>

          {/* Card 4: Story Points & Workload */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                {isPoints ? 'Workload & Points' : 'Workload & Hours'}
              </span>
              <span className="font-mono text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded-[6px] font-bold">
                Sprint 14
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
                {isPoints ? `${totalPoints} pts` : `${totalHours}h`}
              </span>
              <span className="text-xs text-zinc-400">
                {isPoints ? 'estimated points' : 'estimated effort'}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block truncate">
                Across all active deliverables
              </span>
              <span className="block font-mono text-[10px] text-zinc-500 mt-2">
                Commitment capacity
              </span>
            </div>
          </div>
        </div>

        {/* 3. Interactive Task Folders Directory */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-[18px]">folder_open</span>
              <h2 className="text-sm font-semibold text-zinc-100 font-headline">Workspace Folders &amp; Cycles</h2>
              <span className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-[6px] font-semibold">
                {folders.length} active
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenAddFolder}
              className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Folder</span>
            </button>
          </div>

          {/* Folder Bento Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {folders.length === 0 ? (
              <div className="col-span-full bg-[#121214] border border-[#27272a] rounded-[6px] p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-[6px] bg-orange-950/40 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">folder_open</span>
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                  <h3 className="text-sm font-semibold text-zinc-100 font-headline">No Workspace Folders</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This workspace is completely clean with no folders or task spaces. Create your first folder to start organizing engineering sprints, client projects, or operational cycles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddFolder}
                  className="mt-2 h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
                  <span>Create First Folder</span>
                </button>
              </div>
            ) : (
              folders.map((folder) => {
              const hasItems = folder.items && folder.items.length > 0;
              const isExpanded = !!expandedFolderIds[folder.id];
              const folderTaskTotal = folder.items?.reduce((sum, item) => sum + (item.taskCount || 0), 0) || 0;
              const folderColor = folder.color && folder.color !== '#9900c2' ? folder.color : '#ea580c';

              return (
                <div
                  key={folder.id}
                  className={`bg-[#121214] rounded-[6px] border border-[#27272a] shadow-sm transition-all duration-200 hover:border-orange-500/50 flex flex-col ${
                    activeMenuId === folder.id ? 'overflow-visible z-20' : 'overflow-hidden'
                  }`}
                >
                  {/* Folder Card Header */}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: folderColor }}
                      >
                        <span className="material-symbols-outlined text-[20px]">{folder.icon || 'folder'}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-zinc-100 tracking-tight font-headline truncate">
                            {folder.name}
                          </h3>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] bg-zinc-800 text-zinc-400 font-semibold shrink-0">
                            {folder.items?.length || 0} {folder.items?.length === 1 ? 'list' : 'lists'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                          {folder.description || 'Workspace folder for deliverables.'}
                        </p>
                      </div>
                    </div>

                    {/* Right side controls: + Add List, Expand / Collapse + 3-dots actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenAddListToFolder && (
                        <button
                          type="button"
                          onClick={() => onOpenAddListToFolder(folder)}
                          className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-orange-950/40 text-zinc-300 hover:text-orange-400 border border-[#27272a] text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                          title="Add list under this folder"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span className="hidden sm:inline">Add List</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleFolderExpand(folder.id)}
                        className="p-1.5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all flex items-center gap-1 text-xs font-mono cursor-pointer"
                        title={isExpanded ? 'Collapse folder items' : 'Expand folder items'}
                      >
                        <span className="text-[10px] hidden sm:inline">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                        <span
                          className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-orange-400' : 'rotate-0'
                          }`}
                        >
                          expand_more
                        </span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                          }}
                          aria-haspopup="menu"
                          aria-expanded={activeMenuId === folder.id}
                          aria-label="Folder actions"
                          className={`w-7 h-7 rounded-[6px] hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                            activeMenuId === folder.id ? 'text-orange-400 bg-orange-950/40' : 'text-zinc-400 hover:text-zinc-100'
                          }`}
                          title="Folder actions"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">more_vert</span>
                        </button>
                        <ActionContextMenu
                          isOpen={activeMenuId === folder.id}
                          onClose={() => setActiveMenuId(null)}
                          onEdit={() => onEditFolder?.(folder)}
                          onDelete={() => onDeleteFolder?.(folder)}
                          onAddChild={onOpenAddListToFolder ? () => onOpenAddListToFolder(folder) : undefined}
                          addChildLabel="Add List"
                          addChildIcon="playlist_add"
                          editLabel="Edit Folder"
                          deleteLabel="Delete Folder"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expandable Sub-Items Drawer */}
                  <div
                    className={`transition-all duration-300 ease-in-out border-t border-[#27272a] bg-[#18181b] ${
                      isExpanded ? 'max-h-96 opacity-100 p-3' : 'max-h-0 opacity-0 p-0 overflow-hidden border-t-0'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase font-semibold text-zinc-500 px-1">
                        <span>Contains {folder.items?.length || 0} Lists ({folderTaskTotal} Tasks)</span>
                        {onOpenAddListToFolder && (
                          <button
                            type="button"
                            onClick={() => onOpenAddListToFolder(folder)}
                            className="text-orange-400 hover:text-orange-300 hover:underline cursor-pointer flex items-center gap-0.5 lowercase font-sans text-xs"
                          >
                            <span className="material-symbols-outlined text-[12px]">add</span>
                            <span>new list</span>
                          </button>
                        )}
                      </div>

                      {hasItems ? (
                        folder.items.map((subItem) => (
                          <div
                            key={subItem.id}
                            className="flex items-center justify-between p-2 rounded-[6px] bg-[#121214] border border-[#27272a] hover:border-orange-500/50 hover:bg-[#1f1f23] transition-all group cursor-pointer"
                            onClick={() => onSelectSpace(subItem.id)}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: subItem.color || (subItem.active ? '#ea580c' : '#71717a') }}
                              />
                              {subItem.icon && (
                                <span
                                  className="material-symbols-outlined text-[13px] shrink-0"
                                  style={{ color: subItem.color || '#ea580c' }}
                                >
                                  {subItem.icon}
                                </span>
                              )}
                              <span className="font-medium text-xs text-zinc-200 truncate group-hover:text-orange-400 transition-colors">
                                {subItem.name}
                              </span>
                              {subItem.status && (
                                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-[6px] bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/20">
                                  {subItem.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-[6px]">
                                {subItem.taskCount} tasks
                              </span>
                              <span className="material-symbols-outlined text-[16px] text-zinc-500 group-hover:text-orange-400 transition-colors">
                                chevron_right
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] text-center flex flex-col items-center justify-center gap-2">
                          <span className="text-xs text-zinc-500 italic">No deliverable lists in this folder yet</span>
                          {onOpenAddListToFolder && (
                            <button
                              type="button"
                              onClick={() => onOpenAddListToFolder(folder)}
                              className="px-3 py-1 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">add</span>
                              <span>Create First List</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
