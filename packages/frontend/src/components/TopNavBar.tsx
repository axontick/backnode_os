import React, { useState, useRef, useEffect } from 'react';
import { TaskItem, CrmDeal } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { BacknodeLogo } from './BacknodeLogo';
import { findSpaceBreadcrumbs, findPipelineSubFolderPath } from '../utils/treeUtils';

interface TopNavBarProps {
  currentHub?: string;
  currentView?: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs';
  crmView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings';
  activePipelineName?: string;
  onSelectView?: (view: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateTask: () => void;
  onOpenCommandPalette: () => void;
  taskCount?: number;
  filterPriority?: string | null;
  onSelectFilterPriority?: (priority: string | null) => void;
  filterStatus?: string | null;
  onSelectFilterStatus?: (status: string | null) => void;
  filterAssignee?: string | null;
  onSelectFilterAssignee?: (assignee: string | null) => void;
  filterCrmStage?: string | null;
  onSelectFilterCrmStage?: (stage: string | null) => void;
  filterCrmOwner?: string | null;
  onSelectFilterCrmOwner?: (owner: string | null) => void;
  onClearFilters?: () => void;
  tasks?: TaskItem[];
  deals?: CrmDeal[];
  onSelectTask?: (task: TaskItem) => void;
  onSelectDeal?: (deal: CrmDeal) => void;
  syncStatus?: 'connected' | 'syncing' | 'offline';
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentHub = 'task-spaces',
  currentView = 'dashboard',
  crmView = 'dashboard',
  activePipelineName,
  searchQuery,
  onSearchChange,
  onOpenCreateTask,
  onOpenCommandPalette,
  filterPriority,
  onSelectFilterPriority,
  filterStatus,
  onSelectFilterStatus,
  filterAssignee,
  onSelectFilterAssignee,
  filterCrmStage,
  onSelectFilterCrmStage,
  filterCrmOwner,
  onSelectFilterCrmOwner,
  onClearFilters,
  tasks = [],
  deals = [],
  onSelectTask,
  onSelectDeal,
  syncStatus = 'connected',
}) => {
  const { user, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();
  const { activeUserSpace, activeSpace, folders, listSettings, activePipelineSubFolderId, activePipeline, pipelines } = useWorkspace();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setIsHelpOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFilterCount =
    (filterPriority ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (filterAssignee ? 1 : 0) +
    (filterCrmStage ? 1 : 0) +
    (filterCrmOwner ? 1 : 0);

  // Matching items for search auto-suggest
  const matchingTasks =
    searchQuery.trim().length > 0
      ? tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 4)
      : [];

  const matchingDeals =
    searchQuery.trim().length > 0
      ? deals.filter(
          (d) =>
            d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.company.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 3)
      : [];

  const workspaceName = activeUserSpace?.name || user?.account?.name || 'Workspace';

  const availableOwners = Array.from(
    new Set([
      ...deals.map((d) => d.owner).filter(Boolean),
      ...(user?.name ? [user.name] : []),
    ])
  );
  const ownersList = availableOwners.length > 0 ? availableOwners : [user?.name || 'Operator'];

  const availableAssignees = Array.from(
    new Set([
      ...tasks.map((t) => t.assignee?.name).filter(Boolean),
      ...(user?.name ? [user.name] : []),
    ])
  );
  const assigneesList = availableAssignees.length > 0 ? availableAssignees : [user?.name || 'Operator'];

  const renderBreadcrumbs = () => {
    switch (currentHub) {
      case 'crm':
        if (crmView === 'dashboard') {
          return (
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
              <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
                {workspaceName}
              </span>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">CRM Pipelines</span>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
                Dashboard
              </span>
            </div>
          );
        }
        const currentPipeline = activePipeline || pipelines.find((p) => p.name === activePipelineName);
        const subFolderTrail = activePipelineSubFolderId
          ? findPipelineSubFolderPath(currentPipeline?.subFolders, activePipelineSubFolderId)
          : null;
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="hover:text-zinc-200 cursor-pointer transition-colors">CRM Pipelines</span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              {activePipelineName || currentPipeline?.name || 'Enterprise Deals 2026'}
            </span>
            {subFolderTrail && subFolderTrail.map((sfName, idx) => (
              <React.Fragment key={idx}>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate max-w-[120px]">
                  {sfName}
                </span>
              </React.Fragment>
            ))}
            {crmView === 'analytics' && (
              <>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-[6px] border border-emerald-500/30 truncate">
                  Win/Loss Analytics
                </span>
              </>
            )}
            {crmView === 'settings' && (
              <>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
                  Pipeline Settings
                </span>
              </>
            )}
          </div>
        );
      case 'contacts':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="hover:text-zinc-200 cursor-pointer transition-colors">Directory</span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              Enterprise Contacts
            </span>
          </div>
        );
      case 'team':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              Team &amp; Access Control
            </span>
          </div>
        );
      case 'overview':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              Overall Dashboard
            </span>
          </div>
        );
      case 'telemetry':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              Replication Telemetry
            </span>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              Workspace Settings
            </span>
          </div>
        );
      case 'task-spaces':
      default: {
        if (currentView === 'dashboard') {
          return (
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
              <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
                {workspaceName}
              </span>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">Task Spaces</span>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
                Dashboard
              </span>
            </div>
          );
        }

        const breadcrumbInfo = findSpaceBreadcrumbs(folders, activeSpace);
        const folderName = breadcrumbInfo?.folderName;
        const subFolderNames = breadcrumbInfo?.subFolderNames || [];
        const spaceName = breadcrumbInfo?.spaceName || listSettings?.name || 'Sprint 14 - Q4 Infra';

        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 truncate">
            <span className="text-zinc-200 font-semibold hover:text-orange-400 cursor-pointer transition-colors">
              {workspaceName}
            </span>
            <span className="text-zinc-600 font-mono">/</span>
            <span className="hover:text-zinc-200 cursor-pointer transition-colors">Task Spaces</span>
            {folderName && (
              <>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="hover:text-zinc-200 cursor-pointer transition-colors truncate max-w-[120px]">
                  {folderName}
                </span>
              </>
            )}
            {subFolderNames.map((sfName, idx) => (
              <React.Fragment key={idx}>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="hover:text-zinc-200 cursor-pointer transition-colors truncate max-w-[120px]">
                  {sfName}
                </span>
              </React.Fragment>
            ))}
            <span className="text-zinc-600 font-mono">/</span>
            <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
              {spaceName}
            </span>
            {currentView === 'settings' && (
              <>
                <span className="text-zinc-600 font-mono">/</span>
                <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/30 truncate">
                  Space Settings
                </span>
              </>
            )}
          </div>
        );
      }
    }
  };

  return (
    <header className="sticky top-0 right-0 z-20 h-14 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between px-6 w-full shrink-0 select-none text-zinc-100">
      {/* Left: BacknodeLogo, Breadcrumbs & Search Bar */}
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <BacknodeLogo size="sm" showWordmark={true} />
        </div>

        <div className="h-4 w-px bg-[#27272a] shrink-0 hidden sm:block"></div>

        <div className="hidden md:flex items-center min-w-0">
          {renderBreadcrumbs()}
        </div>

        {/* Search input with Auto-Suggest and shortcut badge */}
        <div ref={searchRef} className="relative w-72 lg:w-80 max-w-sm ml-auto sm:ml-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-500">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsSearchFocused(true);
            }}
            placeholder="Search tasks, operators, deals..."
            className="w-full bg-[#18181b] border border-[#27272a] rounded-[6px] pl-9 pr-14 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans"
          />

          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[14px]">cancel</span>
            </button>
          ) : null}

          <button
            onClick={onOpenCommandPalette}
            className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-[6px] border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Open Command Palette (⌘K)"
          >
            ⌘K
          </button>

          {/* Live Search Auto-Suggest Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 top-full mt-2 w-96 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 uppercase font-semibold flex items-center justify-between border-b border-[#27272a] pb-1.5">
                <span>Matching Results</span>
                <span className="text-zinc-500">{matchingTasks.length + matchingDeals.length} found</span>
              </div>

              {matchingTasks.length > 0 && (
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="px-2.5 pt-1 text-[10px] font-mono text-orange-400 uppercase font-semibold">
                    Tasks &amp; Deliverables
                  </span>
                  {matchingTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setIsSearchFocused(false);
                        if (onSelectTask) onSelectTask(t);
                      }}
                      className="px-2.5 py-1.5 rounded-[6px] hover:bg-zinc-800/60 text-left flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] text-orange-400 font-semibold">
                          {t.id}
                        </span>
                        <span className="truncate group-hover:text-orange-400 font-medium text-zinc-200">
                          {t.title}
                        </span>
                      </div>
                      <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-[6px] bg-zinc-800 text-zinc-400 shrink-0 ml-1 border border-zinc-700/60">
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingDeals.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-1 border-t border-[#27272a] pt-1.5">
                  <span className="px-2.5 text-[10px] font-mono text-orange-400 uppercase font-semibold">
                    CRM Deals
                  </span>
                  {matchingDeals.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setIsSearchFocused(false);
                        if (onSelectDeal) onSelectDeal(d);
                      }}
                      className="px-2.5 py-1.5 rounded-[6px] hover:bg-zinc-800/60 text-left flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[14px] text-orange-400">
                          monetization_on
                        </span>
                        <span className="truncate group-hover:text-orange-400 font-medium text-zinc-200">
                          {d.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-zinc-100 shrink-0 ml-1">
                        {d.formattedValue}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingTasks.length === 0 && matchingDeals.length === 0 && (
                <div className="p-3 text-center text-zinc-500 text-[11px] font-mono">
                  No items matching &ldquo;{searchQuery}&rdquo;. Press Enter or ⌘K for commands.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trailing Action Cluster */}
      <div className="flex items-center gap-2.5">
        {/* Interactive Filter Button & Popover */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`px-3 py-1.5 rounded-[6px] border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilterCount > 0
                ? 'border-orange-500/50 bg-orange-950/40 text-orange-400 font-semibold'
                : 'border-[#27272a] bg-[#18181b] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>
              {activeFilterCount > 0
                ? filterPriority
                  ? `Priority: ${filterPriority}`
                  : filterStatus
                  ? `Status: ${filterStatus}`
                  : `${activeFilterCount} Filters`
                : 'Filter'}
            </span>
            <span className="material-symbols-outlined text-[13px] opacity-70">
              {isFilterDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Filter Popover Dropdown Panel */}
          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-3.5 flex flex-col gap-3 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                <span className="font-semibold text-xs text-zinc-100">Filter Options</span>
                {activeFilterCount > 0 && onClearFilters && (
                  <button
                    onClick={() => {
                      onClearFilters();
                      setIsFilterDropdownOpen(false);
                    }}
                    className="text-[11px] text-orange-400 hover:underline font-mono cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* CRM Mode Filters */}
              {currentHub === 'crm' ? (
                <>
                  {/* CRM Stage Filter Section */}
                  {onSelectFilterCrmStage && (
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                        By Stage
                      </span>
                      <div className="flex flex-col gap-1 text-[11px]">
                        {[
                          'Qualified Lead',
                          'Discovery & Demo',
                          'Proposal Submitted',
                          'Contract & Legal',
                          'Closed Won',
                        ].map((stage) => {
                          const isSelected = filterCrmStage === stage;
                          return (
                            <button
                              key={stage}
                              onClick={() => {
                                onSelectFilterCrmStage(isSelected ? null : stage);
                              }}
                              className={`px-2.5 py-1.5 rounded-[6px] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-600 text-white border-orange-500 font-semibold'
                                  : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span>{stage}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CRM Owner Filter Section */}
                  {onSelectFilterCrmOwner && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-[#27272a]">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                        By Owner
                      </span>
                      <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                        {ownersList.map((owner) => {
                          const isSelected = filterCrmOwner === owner;
                          return (
                            <button
                              key={owner}
                              onClick={() => {
                                onSelectFilterCrmOwner(isSelected ? null : owner);
                              }}
                              className={`px-2 py-1.5 rounded-[6px] border text-left flex items-center justify-between truncate transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-600 text-white border-orange-500 font-semibold'
                                  : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span className="truncate">{owner}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[13px] shrink-0">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Priority Filter Section */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      By Priority
                    </span>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                      {['Urgent', 'High', 'Medium', 'Low'].map((p) => {
                        const isSelected = filterPriority === p;
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              onSelectFilterPriority?.(isSelected ? null : p);
                            }}
                            className={`px-2.5 py-1.5 rounded-[6px] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-500 font-semibold'
                                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
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
                  </div>

                  {/* Status Filter Section */}
                  {onSelectFilterStatus && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-[#27272a]">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                        By Lifecycle Status
                      </span>
                      <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                        {['Backlog', 'In Progress', 'In Review', 'Done'].map((s) => {
                          const isSelected = filterStatus === s;
                          return (
                            <button
                              key={s}
                              onClick={() => {
                                onSelectFilterStatus(isSelected ? null : s);
                              }}
                              className={`px-2 py-1.5 rounded-[6px] border text-left flex items-center justify-between truncate transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-600 text-white border-orange-500 font-semibold'
                                  : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span className="truncate">{s}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[13px] shrink-0">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Operator / Assignee Filter Section */}
                  {onSelectFilterAssignee && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-[#27272a]">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                        By Assignee
                      </span>
                      <div className="flex flex-col gap-1 text-[11px]">
                        {assigneesList.map((op) => {
                          const isSelected = filterAssignee === op;
                          return (
                            <button
                              key={op}
                              onClick={() => {
                                onSelectFilterAssignee(isSelected ? null : op);
                              }}
                              className={`px-2.5 py-1.5 rounded-[6px] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-600 text-white border-orange-500 font-semibold'
                                  : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span>{op}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={onOpenCreateTask}
          className="px-3.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1 active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>{currentHub === 'crm' ? 'Add Deal' : 'Create Task'}</span>
        </button>

        {/* Telemetry Peer Node Sync Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'offline' ? 'Offline' : 'Connected'}</span>
        </div>

        <div className="h-4 w-px bg-[#27272a] mx-1"></div>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-3.5 flex flex-col gap-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                <span className="font-semibold text-xs text-zinc-100">Notifications</span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-[6px] border border-emerald-500/30">
                  Sync Nominal
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="p-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-orange-500 mt-0.5">cloud_done</span>
                  <div>
                    <div className="font-semibold text-[11px] text-zinc-100">Peer replication synced</div>
                    <div className="text-[10px] text-zinc-400">Active node: us-east-local (0.11ms latency)</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400 mt-0.5">check_circle</span>
                  <div>
                    <div className="font-semibold text-[11px] text-zinc-100">All filters operational</div>
                    <div className="text-[10px] text-zinc-400">Real-time index query responsive across spaces</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help & Docs Popover */}
        <div ref={helpRef} className="relative">
          <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Help & Shortcuts"
          >
            <span className="material-symbols-outlined text-[18px]">help_outline</span>
          </button>

          {isHelpOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-3.5 flex flex-col gap-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                <span className="font-semibold text-xs text-zinc-100">Keyboard Shortcuts</span>
                <span className="font-mono text-[10px] text-zinc-400">Backnode OS</span>
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-[#27272a]/60">
                  <span className="text-zinc-400">Command Palette</span>
                  <kbd className="px-1.5 py-0.5 bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-[6px] text-[10px]">⌘K</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#27272a]/60">
                  <span className="text-zinc-400">Quick Filter</span>
                  <kbd className="px-1.5 py-0.5 bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-[6px] text-[10px]">F</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Dismiss Popovers</span>
                  <kbd className="px-1.5 py-0.5 bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-[6px] text-[10px]">ESC</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Operator Avatar & Profile Popover */}
        <div ref={profileRef} className="relative ml-1">
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 rounded-[6px] bg-orange-950/40 hover:bg-orange-950/60 text-orange-400 border border-orange-500/30 text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
              >
                Login
              </button>
            )}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-[#18181b] text-zinc-100 border border-[#27272a] hover:border-orange-500/50 flex items-center justify-center text-xs font-bold font-mono shadow-sm cursor-pointer hover:ring-2 hover:ring-orange-500/30 transition-all relative"
              title={user ? `Operator: ${user.name} (${user.role})` : 'Operator Profile'}
            >
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'AW'}
              <span
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#121214] ${
                  isAuthenticated ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              ></span>
            </button>
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-4 flex flex-col gap-3 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-[#27272a]">
                <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'OP'}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="font-semibold text-sm text-zinc-100 truncate">
                    {user?.name || (isAuthenticated ? 'Operator' : 'Guest Operator')}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate font-mono">
                    {user?.email || (isAuthenticated ? 'operator@backnode.io' : 'guest@backnode.io')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                      {user?.role || (isAuthenticated ? 'MEMBER' : 'GUEST')}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      {user?.account?.name || (isAuthenticated ? 'My Workspace' : 'Local Workspace')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-orange-950/30 text-zinc-200 hover:text-orange-400 font-medium transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{isAuthenticated ? 'Switch Account / Login' : 'Login'}</span>
                  <span className="text-xs text-orange-400">→</span>
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[6px] hover:bg-red-950/40 text-red-400 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <span className="material-symbols-outlined text-[14px]">logout</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
