import React, { useState } from 'react';
import { SpaceFolder, CrmPipeline } from '../types';
import { ActionContextMenu } from './ActionContextMenu';

export interface InnerSidebarProps {
  currentHub: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;

  // Task Spaces props
  folders?: SpaceFolder[];
  activeSpace?: string;
  currentView?: string;
  onSelectSpace?: (spaceId: string) => void;
  onSelectDashboard?: () => void;
  onOpenAddFolder?: () => void;
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;

  // CRM props
  pipelines?: CrmPipeline[];
  activePipelineId?: string;
  crmView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings';
  onSelectPipeline?: (pipelineId: string) => void;
  onSelectCrmDashboard?: () => void;
  onSelectCrmBoard?: () => void;
  onSelectPipelineView?: (pipelineId: string, view: 'board' | 'analytics' | 'settings') => void;
  onOpenAddPipeline?: () => void;
  onEditPipeline?: (pipeline: CrmPipeline) => void;
  onDeletePipeline?: (pipeline: CrmPipeline) => void;
}

export const InnerSidebar: React.FC<InnerSidebarProps> = ({
  currentHub,
  isCollapsed,
  onToggleCollapse,

  // Task Spaces
  folders = [],
  activeSpace,
  currentView,
  onSelectSpace,
  onSelectDashboard,
  onOpenAddFolder,
  onEditFolder,
  onDeleteFolder,

  // CRM
  pipelines = [],
  activePipelineId,
  crmView = 'dashboard',
  onSelectPipeline,
  onSelectCrmDashboard,
  onSelectCrmBoard,
  onSelectPipelineView,
  onOpenAddPipeline,
  onEditPipeline,
  onDeletePipeline,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({
    'fld-engineering': true,
    'fld-client-deliverables': true,
  });

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // If collapsed, display the slim 28px vertical ribbon
  if (isCollapsed) {
    const hubTitle = currentHub === 'crm' ? 'CRM PIPELINES' : 'TASK SPACES';
    return (
      <aside
        className="shrink-0 h-screen w-7 border-r border-[#27272a] bg-[#121214] text-zinc-100 flex flex-col items-center py-3 select-none z-20 transition-all duration-200"
        title={`Expand sub-navigation (⌘])`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-colors cursor-pointer"
          title="Expand sub-navigation (⌘])"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>

        <div
          onClick={onToggleCollapse}
          className="mt-6 [writing-mode:vertical-lr] text-[10px] font-mono font-bold tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer select-none uppercase"
        >
          {hubTitle}
        </div>
      </aside>
    );
  }

  // Filtered Task Space Folders
  const filteredFolders = folders.filter((folder) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const matchFolderName = folder.name.toLowerCase().includes(q);
    const matchSubItem = folder.items?.some((i) => i.name.toLowerCase().includes(q));
    return matchFolderName || matchSubItem;
  });

  // Filtered CRM Pipelines
  const filteredPipelines = pipelines.filter((pipe) => {
    if (!filterText.trim()) return true;
    return pipe.name.toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <aside className="shrink-0 h-screen w-[240px] border-r border-[#27272a] bg-[#121214] text-zinc-100 flex flex-col justify-between p-3 select-none z-20 transition-all duration-200">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="shrink-0 pb-2.5 border-b border-[#27272a] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                {currentHub === 'crm' ? 'CRM Pipelines' : 'Task Spaces'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 rounded-[6px] bg-zinc-800/80 font-semibold shrink-0">
                {currentHub === 'crm' ? pipelines.length : folders.length}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {currentHub === 'task-spaces' && onOpenAddFolder && (
                <button
                  type="button"
                  onClick={onOpenAddFolder}
                  className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-orange-400 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  title="Add Folder"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                </button>
              )}

              {currentHub === 'crm' && onOpenAddPipeline && (
                <button
                  type="button"
                  onClick={onOpenAddPipeline}
                  className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-orange-400 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  title="Add Pipeline"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                </button>
              )}

              {/* Collapse inner sidebar toggle */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Collapse sub-navigation (⌘])"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-zinc-500">
              search
            </span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={currentHub === 'crm' ? 'Filter pipelines...' : 'Filter spaces...'}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-[6px] pl-6 pr-6 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Tree and Views Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 flex flex-col gap-1.5">
          {/* TASK SPACES TREE */}
          {currentHub === 'task-spaces' && (
            <div className="flex flex-col gap-1">
              {/* 1. Spaces Dashboard Link */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectDashboard) onSelectDashboard();
                }}
                className={`flex items-center justify-between py-1.5 px-2 rounded-[6px] text-left text-xs transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-orange-400">
                    space_dashboard
                  </span>
                  <span className="truncate font-medium">Spaces Dashboard</span>
                </div>
                <span className="font-mono text-[9px] uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                  Hub
                </span>
              </button>

              <div className="h-px bg-[#27272a] my-1" />

              {/* Folders List */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                  <span>Folders ({filteredFolders.length})</span>
                </div>

                {filteredFolders.map((folder) => {
                  const hasItems = folder.items && folder.items.length > 0;
                  const isExpanded = !!expandedFolderIds[folder.id] || Boolean(filterText);

                  return (
                    <div key={folder.id} className="flex flex-col">
                      {/* Folder Item Header */}
                      <div
                        onClick={() => {
                          if (hasItems) toggleFolder(folder.id);
                        }}
                        className="flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all cursor-pointer group select-none"
                      >
                        <div className="flex items-center gap-1.5 truncate min-w-0">
                          {hasItems ? (
                            <button
                              type="button"
                              onClick={(e) => toggleFolder(folder.id, e)}
                              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 group-hover:text-orange-400 transition-all cursor-pointer shrink-0"
                            >
                              <span
                                className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90 text-orange-400' : 'rotate-0'
                                }`}
                              >
                                chevron_right
                              </span>
                            </button>
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0" />
                          )}

                          <span
                            className="material-symbols-outlined text-[14px] shrink-0"
                            style={{ color: folder.color || '#ea580c' }}
                          >
                            {folder.icon || 'folder'}
                          </span>
                          <span className="truncate font-medium">{folder.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {folder.items?.length || 0}
                          </span>
                          <div className="relative shrink-0 flex items-center">
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === `fld-${folder.id}` ? null : `fld-${folder.id}`);
                              }}
                              aria-haspopup="menu"
                              aria-expanded={activeMenuId === `fld-${folder.id}`}
                              className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                                activeMenuId === `fld-${folder.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Folder actions"
                            >
                              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">more_vert</span>
                            </button>
                            <ActionContextMenu
                              isOpen={activeMenuId === `fld-${folder.id}`}
                              onClose={() => setActiveMenuId(null)}
                              onEdit={() => onEditFolder?.(folder)}
                              onDelete={() => onDeleteFolder?.(folder)}
                              editLabel="Edit Folder"
                              deleteLabel="Delete Folder"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expandable Folder Child Items */}
                      {hasItems && isExpanded && (
                        <div className="flex flex-col gap-0.5 pl-4 ml-1.5 my-0.5 border-l border-[#27272a]">
                          {folder.items!.map((subItem) => {
                            const isActive = activeSpace === subItem.id && currentView !== 'dashboard';
                            return (
                              <button
                                key={subItem.id}
                                type="button"
                                onClick={() => onSelectSpace?.(subItem.id)}
                                className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isActive ? 'bg-orange-500 animate-pulse' : 'bg-zinc-500'
                                    }`}
                                  />
                                  <span className="truncate">{subItem.name}</span>
                                </div>
                                <span className="text-[9.5px] font-mono text-zinc-500 shrink-0 ml-1">
                                  {subItem.taskCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CRM PIPELINES TREE */}
          {currentHub === 'crm' && (
            <div className="flex flex-col gap-1">
              {/* 1. CRM Dashboard Link */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectCrmDashboard) onSelectCrmDashboard();
                }}
                className={`flex items-center justify-between py-1.5 px-2 rounded-[6px] text-left text-xs transition-all cursor-pointer ${
                  crmView === 'dashboard'
                    ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-orange-400">
                    space_dashboard
                  </span>
                  <span className="truncate font-medium">CRM Dashboard</span>
                </div>
                <span className="font-mono text-[9px] uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                  Hub
                </span>
              </button>

              <div className="h-px bg-[#27272a] my-1" />

              {/* Pipelines List */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                  <span>Pipelines ({filteredPipelines.length})</span>
                </div>

                {filteredPipelines.map((pipe) => {
                  const isSelected = activePipelineId === pipe.id && crmView !== 'dashboard';

                  return (
                    <div key={pipe.id} className="flex flex-col">
                      <div
                        className={`group flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-orange-950/40 text-orange-400 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPipeline) onSelectPipeline(pipe.id);
                          }}
                          className="flex items-center gap-1.5 truncate flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <span
                            className="material-symbols-outlined text-[14px] shrink-0"
                            style={{ color: pipe.color || '#ea580c' }}
                          >
                            {pipe.icon || 'trending_up'}
                          </span>
                          <span className="truncate font-medium">{pipe.name}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {pipe.dealCount}
                          </span>
                          <div className="relative shrink-0 flex items-center">
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === `pipe-${pipe.id}` ? null : `pipe-${pipe.id}`);
                              }}
                              aria-haspopup="menu"
                              aria-expanded={activeMenuId === `pipe-${pipe.id}`}
                              className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                                activeMenuId === `pipe-${pipe.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Pipeline actions"
                            >
                              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">more_vert</span>
                            </button>
                            <ActionContextMenu
                              isOpen={activeMenuId === `pipe-${pipe.id}`}
                              onClose={() => setActiveMenuId(null)}
                              onEdit={() => onEditPipeline?.(pipe)}
                              onDelete={() => onDeletePipeline?.(pipe)}
                              editLabel="Edit Pipeline"
                              deleteLabel="Delete Pipeline"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sub-views for selected pipeline */}
                      {isSelected && (
                        <div className="flex flex-col gap-0.5 pl-4 ml-1.5 my-0.5 border-l border-[#27272a]">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'board');
                              else if (onSelectCrmBoard) onSelectCrmBoard();
                            }}
                            className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                              crmView === 'board'
                                ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-[13px]">view_kanban</span>
                              <span className="truncate">Active Deals (Board)</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'analytics');
                            }}
                            className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                              crmView === 'analytics'
                                ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-[13px] text-emerald-400">leaderboard</span>
                              <span className="truncate">Win/Loss Analytics</span>
                            </div>
                            <span className="text-[9.5px] font-mono text-emerald-400 font-semibold">68%</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'settings');
                            }}
                            className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                              crmView === 'settings'
                                ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-[13px]">tune</span>
                              <span className="truncate">Pipeline Settings</span>
                            </div>
                            <span className="text-[9px] font-mono uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                              Edit
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
