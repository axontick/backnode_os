import React, { useState } from 'react';
import { SpaceFolder, CrmPipeline } from '../types';

interface SideNavBarProps {
  currentHub: string;
  onSelectHub: (hub: string) => void;
  activeSpace: string;
  onSelectSpace: (space: string) => void;
  onOpenNewItem: () => void;
  onOpenCommandPalette: () => void;
  folders?: SpaceFolder[];
  onOpenAddFolder?: () => void;
  currentView?: string;
  onSelectDashboard?: () => void;
  crmView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings';
  onSelectCrmDashboard?: () => void;
  onSelectCrmBoard?: () => void;
  pipelines?: CrmPipeline[];
  activePipelineId?: string;
  onSelectPipeline?: (pipelineId: string) => void;
  onOpenAddPipeline?: () => void;
  onSelectPipelineView?: (pipelineId: string, view: 'board' | 'analytics' | 'settings') => void;
  isEngineActive?: boolean;
  onToggleEngine?: () => void;
  latencyMs?: number;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentHub,
  onSelectHub,
  activeSpace,
  onSelectSpace,
  onOpenNewItem,
  onOpenCommandPalette,
  folders = [],
  onOpenAddFolder,
  currentView,
  onSelectDashboard,
  crmView = 'dashboard',
  onSelectCrmDashboard,
  onSelectCrmBoard,
  pipelines = [],
  activePipelineId = 'pipe-enterprise',
  onSelectPipeline,
  onOpenAddPipeline,
  onSelectPipelineView,
}) => {
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
  return (
    <aside className="fixed top-0 left-0 h-screen w-[280px] shrink-0 border-r border-[#d4c0d5]/30 bg-white flex flex-col justify-between p-4 z-30 select-none">
      <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {/* Workspace Brand Header */}
        <div className="flex items-center justify-between p-1 rounded-lg hover:bg-[#f4f2fd] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#9900c2] flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-[#9900c2]/20">
              B
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-[#1a1b22] tracking-tight leading-tight">
                Backnode OS
              </span>
              <span className="text-[11px] font-mono text-[#5f5e61]">
                Workspaces • Core
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#837284] text-[18px] opacity-70 group-hover:opacity-100">
            unfold_more
          </span>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onOpenNewItem}
          className="w-full bg-[#9900c2] hover:bg-[#b731e0] text-white font-medium text-sm py-2 px-3.5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Pipeline Item</span>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1">
          {/* Overview */}
          <button
            onClick={() => onSelectHub('overview')}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-full text-left transition-colors ${
              currentHub === 'overview'
                ? 'text-[#9900c2] bg-[#f4f2fd] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Overview</span>
          </button>

          {/* Task Spaces (Active Destination) */}
          <div className="flex flex-col">
            <div
              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-full text-left transition-colors ${
                currentHub === 'task-spaces'
                  ? 'text-[#9900c2] bg-[#f4f2fd] font-semibold'
                  : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (onSelectDashboard) {
                    onSelectDashboard();
                  } else {
                    onSelectHub('task-spaces');
                  }
                }}
                className="flex items-center gap-2.5 flex-1 text-left"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{
                    fontVariationSettings: currentHub === 'task-spaces' ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  folder_open
                </span>
                <span>Task Spaces</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenAddFolder && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddFolder();
                    }}
                    className="w-5 h-5 rounded-md hover:bg-[#9900c2]/15 text-[#9900c2] flex items-center justify-center transition-all hover:scale-105"
                    title="Add new folder"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#9900c2]/10 text-[#9900c2] font-semibold">
                  Active
                </span>
              </div>
            </div>

            {/* Sub-Spaces Tree (visible under Task Spaces) */}
            {currentHub === 'task-spaces' && (
              <div className="ml-3 pl-2.5 border-l border-[#d4c0d5]/40 my-1 flex flex-col gap-1 transition-all duration-300">
                {/* 1. Task Spaces Custom Dashboard Entry */}
                <button
                  onClick={() => {
                    if (onSelectDashboard) onSelectDashboard();
                  }}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-left text-xs transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-[#eeedf7] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-[15px] text-[#9900c2]">
                      space_dashboard
                    </span>
                    <span className="truncate">Spaces Dashboard</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-1 rounded bg-[#fbd7ff] text-[#330043] font-bold">
                    Hub
                  </span>
                </button>

                {/* 2. Dynamic Folders with Expandable Items */}
                <div className="pt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-[#837284] font-semibold tracking-wider">
                    <span>Folders ({folders.length})</span>
                    {onOpenAddFolder && (
                      <button
                        onClick={onOpenAddFolder}
                        className="hover:text-[#9900c2] transition-colors flex items-center gap-0.5 text-[10px] lowercase"
                        title="Add Folder"
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        <span>add</span>
                      </button>
                    )}
                  </div>

                  {folders.map((folder) => {
                    const hasItems = folder.items && folder.items.length > 0;
                    const isExpanded = !!expandedFolderIds[folder.id];

                    return (
                      <div key={folder.id} className="flex flex-col">
                        {/* Folder Header Item */}
                        <div
                          onClick={() => {
                            if (hasItems) {
                              toggleFolder(folder.id);
                            }
                          }}
                          className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-left text-xs text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd] transition-all cursor-pointer group select-none`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {hasItems ? (
                              <button
                                type="button"
                                onClick={(e) => toggleFolder(folder.id, e)}
                                className="w-3.5 h-3.5 flex items-center justify-center text-[#837284] group-hover:text-[#9900c2] transition-all"
                              >
                                <span
                                  className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
                                    isExpanded ? 'rotate-90 text-[#9900c2]' : 'rotate-0'
                                  }`}
                                >
                                  chevron_right
                                </span>
                              </button>
                            ) : (
                              <span className="w-3.5 h-3.5" />
                            )}
                            <span
                              className="material-symbols-outlined text-[14px] shrink-0"
                              style={{ color: folder.color }}
                            >
                              {folder.icon || 'folder'}
                            </span>
                            <span className="truncate font-medium">{folder.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#837284] shrink-0">
                            {folder.items?.length || 0}
                          </span>
                        </div>

                        {/* Expandable Folder Child Items */}
                        {hasItems && (
                          <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col gap-0.5 pl-4 ml-1 border-l border-[#d4c0d5]/30 ${
                              isExpanded ? 'max-h-60 opacity-100 py-0.5' : 'max-h-0 opacity-0 py-0'
                            }`}
                          >
                            {folder.items.map((subItem) => {
                              const isActive = activeSpace === subItem.id && currentView !== 'dashboard';
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => onSelectSpace(subItem.id)}
                                  className={`flex items-center justify-between py-1 px-2 rounded-md text-left text-[11px] transition-all ${
                                    isActive
                                      ? 'bg-[#eeedf7] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isActive ? 'bg-[#9900c2] animate-pulse' : 'bg-zinc-400'
                                      }`}
                                    />
                                    <span className="truncate">{subItem.name}</span>
                                  </div>
                                  <span className="text-[9.5px] font-mono text-[#837284] shrink-0 ml-1">
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
          </div>

          {/* Pipeline CRM */}
          <div className="flex flex-col">
            <div
              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-full text-left transition-colors ${
                currentHub === 'crm'
                  ? 'text-[#9900c2] bg-[#f4f2fd] font-semibold'
                  : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (onSelectCrmDashboard) onSelectCrmDashboard();
                  else onSelectHub('crm');
                }}
                className="flex items-center gap-2.5 flex-1 text-left"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{
                    fontVariationSettings: currentHub === 'crm' ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  view_kanban
                </span>
                <span>Pipeline CRM</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenAddPipeline && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddPipeline();
                    }}
                    className="w-5 h-5 rounded-md hover:bg-[#9900c2]/15 text-[#9900c2] flex items-center justify-center transition-all hover:scale-105"
                    title="Add new sales pipeline"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#9900c2]/10 text-[#9900c2] font-semibold">
                  Active
                </span>
              </div>
            </div>

            {/* Sub-items hierarchy for CRM */}
            {currentHub === 'crm' && (
              <div className="ml-3 pl-2.5 border-l border-[#d4c0d5]/40 my-1 flex flex-col gap-1 transition-all duration-300">
                {/* 1. CRM Overview Dashboard */}
                <button
                  onClick={() => {
                    if (onSelectCrmDashboard) onSelectCrmDashboard();
                    else onSelectHub('crm');
                  }}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-left text-xs transition-all ${
                    crmView === 'dashboard'
                      ? 'bg-[#eeedf7] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-[15px] text-[#9900c2]">
                      space_dashboard
                    </span>
                    <span className="truncate">CRM Dashboard</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-1 rounded bg-[#fbd7ff] text-[#330043] font-bold">
                    Hub
                  </span>
                </button>

                {/* 2. Pipelines Tree Header */}
                <div className="pt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-[#837284] font-semibold tracking-wider">
                    <span>Pipelines ({pipelines.length})</span>
                    {onOpenAddPipeline && (
                      <button
                        type="button"
                        onClick={onOpenAddPipeline}
                        className="hover:text-[#9900c2] transition-colors flex items-center gap-0.5 text-[10px] lowercase"
                        title="Add new pipeline"
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        <span>add</span>
                      </button>
                    )}
                  </div>

                  {pipelines.map((pipe) => {
                    const isSelected = activePipelineId === pipe.id && crmView !== 'dashboard';

                    return (
                      <div key={pipe.id} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPipeline) onSelectPipeline(pipe.id);
                          }}
                          className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-[#eeedf7] text-[#9900c2] font-semibold'
                              : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className="material-symbols-outlined text-[14px] shrink-0"
                              style={{ color: pipe.color || '#9900c2' }}
                            >
                              {pipe.icon || 'trending_up'}
                            </span>
                            <span className="truncate font-medium">{pipe.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#837284] shrink-0">
                            {pipe.dealCount}
                          </span>
                        </button>

                        {/* Pipeline-wise Views: Active Deals, Win/Loss Analytics, Pipeline Settings */}
                        {isSelected && (
                          <div className="flex flex-col gap-0.5 pl-4 ml-1 my-0.5 border-l border-[#d4c0d5]/30">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'board');
                                else if (onSelectCrmBoard) onSelectCrmBoard();
                              }}
                              className={`flex items-center justify-between py-1 px-2 rounded-md text-left text-[11px] transition-all ${
                                crmView === 'board'
                                  ? 'bg-[#eeedf7] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                                  : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
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
                              className={`flex items-center justify-between py-1 px-2 rounded-md text-left text-[11px] transition-all ${
                                crmView === 'analytics'
                                  ? 'bg-[#eeedf7] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                                  : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[13px] text-emerald-600">leaderboard</span>
                                <span className="truncate">Win/Loss Analytics</span>
                              </div>
                              <span className="text-[9.5px] font-mono text-emerald-600 font-semibold">68%</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'settings');
                              }}
                              className={`flex items-center justify-between py-1 px-2 rounded-md text-left text-[11px] transition-all ${
                                crmView === 'settings'
                                  ? 'bg-[#eeedf7] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                                  : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[13px]">tune</span>
                                <span className="truncate">Pipeline Settings</span>
                              </div>
                              <span className="text-[9px] font-mono uppercase px-1 rounded bg-[#fbd7ff] text-[#330043] font-bold">
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

          {/* Contacts */}
          <button
            onClick={() => onSelectHub('contacts')}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-full text-left transition-colors ${
              currentHub === 'contacts'
                ? 'text-[#9900c2] bg-[#f4f2fd] font-semibold'
                : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Contacts</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#d4c0d5]/30">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between px-2.5 py-1.5 text-xs text-[#837284] hover:text-[#1a1b22] hover:bg-[#f4f2fd] rounded-lg transition-colors font-mono"
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">bolt</span>
            <span>Quick Actions</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#d4c0d5]/50 text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  );
};
