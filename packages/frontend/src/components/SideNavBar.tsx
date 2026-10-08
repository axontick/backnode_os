import React, { useState, useRef, useEffect } from 'react';
import { SpaceFolder, CrmPipeline } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { ActionContextMenu } from './ActionContextMenu';

interface SideNavBarProps {
  currentHub: string;
  onSelectHub: (hub: string) => void;
  activeSpace: string;
  onSelectSpace: (space: string) => void;
  onOpenNewItem: () => void;
  onOpenCommandPalette: () => void;
  folders?: SpaceFolder[];
  onOpenAddFolder?: () => void;
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;
  currentView?: string;
  onSelectDashboard?: () => void;
  crmView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings';
  onSelectCrmDashboard?: () => void;
  onSelectCrmBoard?: () => void;
  pipelines?: CrmPipeline[];
  activePipelineId?: string;
  onSelectPipeline?: (pipelineId: string) => void;
  onOpenAddPipeline?: () => void;
  onEditPipeline?: (pipeline: CrmPipeline) => void;
  onDeletePipeline?: (pipeline: CrmPipeline) => void;
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
  onEditFolder,
  onDeleteFolder,
  currentView,
  onSelectDashboard,
  crmView = 'dashboard',
  onSelectCrmDashboard,
  onSelectCrmBoard,
  pipelines = [],
  activePipelineId = 'pipe-enterprise',
  onSelectPipeline,
  onOpenAddPipeline,
  onEditPipeline,
  onDeletePipeline,
  onSelectPipelineView,
}) => {
  const { user } = useAuth();
  const {
    userSpaces,
    activeUserSpace,
    handleSelectUserSpace,
    handleCreateUserSpace,
    members,
  } = useWorkspace();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({
    'fld-engineering': true,
    'fld-client-deliverables': true,
  });

  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceColor, setNewSpaceColor] = useState('#ea580c');
  const spaceDropdownRef = useRef<HTMLDivElement>(null);

  // Close space dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(e.target as Node)) {
        setIsSpaceDropdownOpen(false);
        setIsCreatingSpace(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const initialLetter = activeUserSpace?.name ? activeUserSpace.name.charAt(0).toUpperCase() : 'B';
  const accountName = user?.account?.name || 'Backnode Operations';
  const operatorName = user?.name ? user.name.split(' ')[0] : 'Operator';

  return (
    <aside className="fixed top-0 left-0 h-screen w-[280px] shrink-0 border-r border-[#27272a] bg-[#0c0a09] text-zinc-100 flex flex-col justify-between p-4 z-30 select-none">
      {/* Top Header & Workspace Switcher */}
      <div className="shrink-0 flex flex-col gap-3 relative pb-2">
        {/* Workspace Brand Header & Space Dropdown */}
        <div ref={spaceDropdownRef} className="relative w-full">
          <div
            onClick={() => setIsSpaceDropdownOpen((prev) => !prev)}
            className="flex items-center justify-between p-2 rounded-[6px] hover:bg-zinc-800/40 transition-colors cursor-pointer group border border-transparent hover:border-[#27272a]"
            title="Switch or create workspace"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white font-semibold text-sm shadow-sm shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: activeUserSpace?.color || '#ea580c' }}
              >
                {initialLetter}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-zinc-100 tracking-tight leading-tight truncate font-headline">
                  {activeUserSpace?.name || accountName}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 truncate">
                  {operatorName} • {activeUserSpace?.role || 'Workspace'}
                </span>
              </div>
            </div>
            <span
              className={`material-symbols-outlined text-zinc-400 text-[18px] transition-transform duration-200 ${
                isSpaceDropdownOpen ? 'rotate-180 text-orange-400' : 'opacity-70 group-hover:opacity-100'
              }`}
            >
              unfold_more
            </span>
          </div>

          {/* User Spaces Dropdown - Full width aligned with sidebar content */}
          {isSpaceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 w-full mt-2 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-2.5 flex flex-col gap-2 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-1.5 py-1 flex items-center justify-between border-b border-[#27272a]">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Workspaces ({userSpaces.length})
                </span>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.5 rounded-[6px] font-semibold">
                  Active
                </span>
              </div>

              {/* Spaces List */}
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto custom-scrollbar">
                {userSpaces.map((space) => {
                  const isActive = space.id === activeUserSpace?.id;
                  return (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        handleSelectUserSpace(space.id);
                        setIsSpaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-[6px] text-left transition-all ${
                        isActive
                          ? 'bg-orange-950/40 border border-orange-500/30 text-orange-400'
                          : 'hover:bg-zinc-800/40 border border-transparent text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: space.color || '#ea580c' }}
                        >
                          {space.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-xs font-semibold truncate ${isActive ? 'text-orange-400' : 'text-zinc-200'}`}>
                            {space.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono truncate">
                            {space.role || 'Owner'} • {space.memberCount || 1} {space.memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="material-symbols-outlined text-[16px] text-orange-400 shrink-0 ml-1.5">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-[#27272a] my-0.5"></div>

              {/* Create New Space Area */}
              {!isCreatingSpace ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingSpace(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-orange-400 border border-dashed border-orange-500/40 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Create New Space</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-200">New Workspace</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSpace(false)}
                      className="text-zinc-400 hover:text-zinc-100 text-xs font-bold px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="e.g. Mobile Apps"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSpaceName.trim()) {
                        handleCreateUserSpace({ name: newSpaceName, color: newSpaceColor });
                        setNewSpaceName('');
                        setIsCreatingSpace(false);
                        setIsSpaceDropdownOpen(false);
                      }
                    }}
                  />
                  {/* Color chips */}
                  <div className="flex items-center justify-between px-0.5 pt-0.5">
                    {['#ea580c', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#6366f1'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSpaceColor(c)}
                        className={`w-5 h-5 rounded-[6px] transition-transform ${
                          newSpaceColor === c ? 'scale-125 ring-2 ring-orange-500' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (newSpaceName.trim()) {
                          handleCreateUserSpace({ name: newSpaceName, color: newSpaceColor });
                          setNewSpaceName('');
                          setIsCreatingSpace(false);
                          setIsSpaceDropdownOpen(false);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSpace(false)}
                      className="px-2.5 py-1.5 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-400 hover:bg-zinc-800 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          onClick={onOpenNewItem}
          className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs py-2 px-3.5 rounded-[6px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Item</span>
        </button>
      </div>

      {/* Scrollable Navigation Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar my-2 pr-0.5">
        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1">
          {/* Overview */}
          <button
            onClick={() => onSelectHub('overview')}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[6px] text-left transition-colors cursor-pointer ${
              currentHub === 'overview'
                ? 'text-orange-400 bg-orange-950/40 border-l-2 border-orange-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Overview</span>
          </button>

          {/* Task Spaces (Active Destination) */}
          <div className="flex flex-col">
            <div
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-[6px] text-left transition-colors ${
                currentHub === 'task-spaces'
                  ? 'text-orange-400 bg-orange-950/40 border-l-2 border-orange-500 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
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
                className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
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
                    className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-orange-400 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                    title="Add new folder"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                )}
                {currentHub === 'task-spaces' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 font-semibold">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Sub-Spaces Tree (visible under Task Spaces) */}
            {currentHub === 'task-spaces' && (
              <div className="ml-3 pl-2.5 border-l border-[#27272a] my-1 flex flex-col gap-1 transition-all duration-300">
                {/* 1. Task Spaces Custom Dashboard Entry */}
                <button
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
                    <span className="truncate">Spaces Dashboard</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                    Hub
                  </span>
                </button>

                {/* 2. Dynamic Folders with Expandable Items */}
                <div className="pt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    <span>Folders ({folders.length})</span>
                    {onOpenAddFolder && (
                      <button
                        onClick={onOpenAddFolder}
                        className="hover:text-orange-400 transition-colors flex items-center gap-0.5 text-[10px] lowercase cursor-pointer"
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
                          className={`flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all cursor-pointer group select-none`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {hasItems ? (
                              <button
                                type="button"
                                onClick={(e) => toggleFolder(folder.id, e)}
                                className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 group-hover:text-orange-400 transition-all cursor-pointer"
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
                          <div className="flex items-center gap-1 shrink-0">
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
                                aria-label="Folder actions"
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
                        {hasItems && (
                          <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col gap-0.5 pl-4 ml-1 border-l border-[#27272a] ${
                              isExpanded ? 'max-h-60 opacity-100 py-0.5' : 'max-h-0 opacity-0 py-0'
                            }`}
                          >
                            {folder.items.map((subItem) => {
                              const isActive = activeSpace === subItem.id && currentView !== 'dashboard';
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => onSelectSpace(subItem.id)}
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
          </div>

          {/* Pipeline CRM */}
          <div className="flex flex-col">
            <div
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-[6px] text-left transition-colors ${
                currentHub === 'crm'
                  ? 'text-orange-400 bg-orange-950/40 border-l-2 border-orange-500 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (onSelectCrmDashboard) onSelectCrmDashboard();
                  else onSelectHub('crm');
                }}
                className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
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
                    className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-orange-400 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                    title="Add new sales pipeline"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                )}
                {currentHub === 'crm' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 font-semibold">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Sub-items hierarchy for CRM */}
            {currentHub === 'crm' && (
              <div className="ml-3 pl-2.5 border-l border-[#27272a] my-1 flex flex-col gap-1 transition-all duration-300">
                {/* 1. CRM Overview Dashboard */}
                <button
                  onClick={() => {
                    if (onSelectCrmDashboard) onSelectCrmDashboard();
                    else onSelectHub('crm');
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
                    <span className="truncate">CRM Dashboard</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                    Hub
                  </span>
                </button>

                {/* 2. Pipelines Tree Header */}
                <div className="pt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    <span>Pipelines ({pipelines.length})</span>
                    {onOpenAddPipeline && (
                      <button
                        type="button"
                        onClick={onOpenAddPipeline}
                        className="hover:text-orange-400 transition-colors flex items-center gap-0.5 text-[10px] lowercase cursor-pointer"
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
                                aria-label="Pipeline actions"
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

                        {/* Pipeline-wise Views: Active Deals, Win/Loss Analytics, Pipeline Settings */}
                        {isSelected && (
                          <div className="flex flex-col gap-0.5 pl-4 ml-1 my-0.5 border-l border-[#27272a]">
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

          {/* Contacts */}
          <button
            onClick={() => onSelectHub('contacts')}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[6px] text-left transition-colors cursor-pointer ${
              currentHub === 'contacts'
                ? 'text-orange-400 bg-orange-950/40 border-l-2 border-orange-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Contacts</span>
          </button>

          {/* Team & Access */}
          <button
            onClick={() => onSelectHub('team')}
            className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-[6px] text-left transition-colors cursor-pointer ${
              currentHub === 'team'
                ? 'text-orange-400 bg-orange-950/40 border-l-2 border-orange-500 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{
                  fontVariationSettings: currentHub === 'team' ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                shield_person
              </span>
              <span>Team &amp; Access</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-zinc-800 text-zinc-300 font-semibold">
              {members.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#27272a]">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-[6px] transition-colors font-mono cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">bolt</span>
            <span>Quick Actions</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-[10px] text-zinc-400">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  );
};
