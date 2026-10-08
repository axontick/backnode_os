import React, { useState } from 'react';
import {
  CrmDeal,
  CrmPipeline,
  CrmPipelineSettings as CrmPipelineSettingsType,
  CrmStageDefinition,
} from '../types';
import { initialCrmPipelineSettings, initialCrmStages } from '../mockData';
import { PipelineWinLossView } from './PipelineWinLossView';
import { CrmPipelineSettings } from './CrmPipelineSettings';
import { findPipelineSubFolder } from '../utils/treeUtils';

interface PipelineCrmViewProps {
  deals: CrmDeal[];
  pipeline?: CrmPipeline;
  pipelines?: CrmPipeline[];
  onSelectPipeline?: (pipelineId: string) => void;
  onOpenAddPipeline?: () => void;
  selectedDealId: string | null;
  onSelectDeal: (deal: CrmDeal) => void;
  onOpenNewDeal: (stage?: CrmDeal['stage']) => void;
  onOpenSettings?: (tab?: 'general' | 'stages') => void;
  currentView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings';
  onSelectView?: (view: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings') => void;
  crmSettings?: CrmPipelineSettingsType;
  crmStages?: CrmStageDefinition[];
  onUpdateCrmSettings?: (newSettings: CrmPipelineSettingsType) => void;
  onUpdateCrmStages?: (newStages: CrmStageDefinition[]) => void;
  settingsInitialTab?: 'general' | 'stages';
  globalSearchQuery?: string;
  globalStageFilter?: string | null;
  globalOwnerFilter?: string | null;
  onClearGlobalFilters?: () => void;
  activePipelineSubFolderId?: string | null;
  onClearSubFolderFilter?: () => void;
}

export const PipelineCrmView: React.FC<PipelineCrmViewProps> = ({
  deals,
  pipeline,
  pipelines = [],
  onSelectPipeline,
  onOpenAddPipeline,
  selectedDealId,
  onSelectDeal,
  onOpenNewDeal,
  onOpenSettings,
  currentView = 'board',
  onSelectView,
  crmSettings,
  crmStages,
  onUpdateCrmSettings,
  onUpdateCrmStages,
  settingsInitialTab = 'general',
  globalSearchQuery,
  globalStageFilter,
  globalOwnerFilter,
  onClearGlobalFilters,
  activePipelineSubFolderId,
  onClearSubFolderFilter,
}) => {
  const [isPipelinePickerOpen, setIsPipelinePickerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [quickActionFilter, setQuickActionFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'stage' | 'owner' | 'probability'>('stage');
  const [sortBy, setSortBy] = useState<'value-desc' | 'value-asc' | 'date' | 'prob' | 'name'>('value-desc');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStageFilterOpen, setIsStageFilterOpen] = useState(false);
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);

  // Fallback pipeline object if not provided
  const activePipeline: CrmPipeline = pipeline || {
    id: 'pipe-enterprise',
    name: 'Enterprise Deals 2026',
    description: 'High ARR strategic software licenses and cloud migration contracts.',
    icon: 'leaderboard',
    color: '#ea580c',
    dealCount: deals.length,
    totalValue: deals.reduce((sum, d) => sum + d.value, 0),
  };

  const stages: {
    name: CrmDeal['stage'];
    title: string;
    dotColor: string;
    totalFormatted: string;
    isHighlighted?: boolean;
  }[] = [
    {
      name: 'Qualified Lead',
      title: 'Qualified Lead',
      dotColor: 'bg-zinc-500',
      totalFormatted: '$85k',
    },
    {
      name: 'Discovery & Demo',
      title: 'Discovery & Demo',
      dotColor: 'bg-blue-500',
      totalFormatted: '$145k',
    },
    {
      name: 'Proposal Submitted',
      title: 'Proposal Submitted',
      dotColor: 'bg-orange-500',
      totalFormatted: '$160k',
      isHighlighted: true,
    },
    {
      name: 'Contract & Legal',
      title: 'Contract Review',
      dotColor: 'bg-amber-500',
      totalFormatted: '$110k',
    },
    {
      name: 'Closed Won',
      title: 'Closed Won',
      dotColor: 'bg-emerald-500',
      totalFormatted: '$40k',
    },
  ];

  // Pipeline matching deals
  const pipelineDeals = deals.filter(
    (d) =>
      !activePipeline.id ||
      d.pipelineId === activePipeline.id ||
      (!d.pipelineId && activePipeline.id === 'pipe-enterprise')
  );

  // Unique owners for owner filter and owner grouping
  const allOwners = Array.from(new Set(pipelineDeals.map((d) => d.owner)));

  // Active CRM Sub-folder if filtered (recursively resolved at any depth)
  const activePipelineSubFolder = findPipelineSubFolder(
    activePipeline.subFolders,
    activePipelineSubFolderId
  );

  // Filter deals
  const filteredDeals = pipelineDeals.filter((d) => {
    // Search query: checks internal search or top bar global search
    const activeSearch = searchFilter.trim() || globalSearchQuery?.trim() || '';
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      const matchesSearch =
        d.title.toLowerCase().includes(q) ||
        d.company.toLowerCase().includes(q) ||
        d.contact.name.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q) ||
        (d.tags && d.tags.some((tg) => tg.toLowerCase().includes(q)));
      if (!matchesSearch) return false;
    }

    // Stage filter: checks internal stage filter or top bar global stage filter
    const activeStage = stageFilter || globalStageFilter || null;
    if (activeStage && d.stage !== activeStage) return false;

    // Owner filter: checks internal owner filter or top bar global owner filter
    const activeOwner = ownerFilter || globalOwnerFilter || null;
    if (activeOwner && d.owner !== activeOwner) return false;

    // Sub-folder filter
    if (activePipelineSubFolderId && d.subFolderId !== activePipelineSubFolderId) return false;

    // Quick action filter
    if (quickActionFilter === 'high-value' && d.value < 100000) return false;
    if (quickActionFilter === 'closing-soon' && !d.targetCloseDate.includes('Oct')) return false;
    if (quickActionFilter === 'proposal' && d.stage !== 'Proposal Submitted' && d.stage !== 'Discovery & Demo') return false;
    if (quickActionFilter === 'won' && d.stage !== 'Closed Won') return false;

    return true;
  });

  // Sort deals
  const displayedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === 'value-desc') return b.value - a.value;
    if (sortBy === 'value-asc') return a.value - b.value;
    if (sortBy === 'prob') return b.probability - a.probability;
    if (sortBy === 'date') return a.targetCloseDate.localeCompare(b.targetCloseDate);
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  const totalPipeline = displayedDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedForecast = Math.round(
    displayedDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
  );
  const wonCount = displayedDeals.filter((d) => d.stage === 'Closed Won').length;
  const winRate = displayedDeals.length > 0 ? ((wonCount / displayedDeals.length) * 100).toFixed(1) : '68.4';

  const hasActiveCrmFilters = Boolean(
    searchFilter.trim() !== '' ||
    Boolean(globalSearchQuery && globalSearchQuery.trim()) ||
    quickActionFilter ||
    stageFilter ||
    globalStageFilter ||
    ownerFilter ||
    globalOwnerFilter ||
    activePipelineSubFolderId
  );

  const handleClearCrmFilters = () => {
    setSearchFilter('');
    setQuickActionFilter(null);
    setStageFilter(null);
    setOwnerFilter(null);
    if (onClearSubFolderFilter) {
      onClearSubFolderFilter();
    }
    if (onClearGlobalFilters) {
      onClearGlobalFilters();
    }
  };

  // Dynamic Board Columns depending on groupBy ('stage' | 'owner' | 'probability')
  const boardColumns =
    groupBy === 'owner'
      ? allOwners.map((ownerName, idx) => ({
          key: ownerName,
          title: ownerName,
          dotColor:
            idx === 0
              ? 'bg-orange-500'
              : idx === 1
              ? 'bg-blue-500'
              : idx === 2
              ? 'bg-amber-500'
              : 'bg-emerald-500',
          isHighlighted: idx === 0,
          filterDeals: (d: CrmDeal) => d.owner === ownerName,
          defaultStage: 'Proposal Submitted' as CrmDeal['stage'],
        }))
      : groupBy === 'probability'
      ? [
          {
            key: 'high-prob',
            title: 'High Prob (80-100%)',
            dotColor: 'bg-emerald-500',
            isHighlighted: true,
            filterDeals: (d: CrmDeal) => d.probability >= 80,
            defaultStage: 'Contract & Legal' as CrmDeal['stage'],
          },
          {
            key: 'strong-prob',
            title: 'Strong Opp (60-79%)',
            dotColor: 'bg-orange-500',
            isHighlighted: false,
            filterDeals: (d: CrmDeal) => d.probability >= 60 && d.probability < 80,
            defaultStage: 'Proposal Submitted' as CrmDeal['stage'],
          },
          {
            key: 'mid-prob',
            title: 'Mid Prob (40-59%)',
            dotColor: 'bg-blue-500',
            isHighlighted: false,
            filterDeals: (d: CrmDeal) => d.probability >= 40 && d.probability < 60,
            defaultStage: 'Discovery & Demo' as CrmDeal['stage'],
          },
          {
            key: 'early-prob',
            title: 'Early Stage (<40%)',
            dotColor: 'bg-zinc-500',
            isHighlighted: false,
            filterDeals: (d: CrmDeal) => d.probability < 40,
            defaultStage: 'Qualified Lead' as CrmDeal['stage'],
          },
        ]
      : stages.map((stg) => ({
          key: stg.name,
          title: stg.title,
          dotColor: stg.dotColor,
          isHighlighted: stg.isHighlighted,
          filterDeals: (d: CrmDeal) => d.stage === stg.name,
          defaultStage: stg.name,
        }));

  // When viewing Win/Loss Analytics for this specific pipeline
  if (currentView === 'analytics') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] text-zinc-100">
        {/* Navigation Sub-Bar */}
        <div className="px-6 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between shrink-0 h-11 text-xs">
          <div className="flex items-center gap-4 h-full">
            {/* Active Pipeline Identifier */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] text-xs font-semibold text-zinc-100">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ color: activePipeline.color && activePipeline.color !== '#9900c2' ? activePipeline.color : '#ea580c' }}
              >
                {!activePipeline.icon || activePipeline.icon === 'building' ? 'leaderboard' : activePipeline.icon}
              </span>
              <span className="truncate max-w-[140px]">{activePipeline.name}</span>
            </div>

            {onOpenAddPipeline && (
              <button
                type="button"
                onClick={onOpenAddPipeline}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold transition-all shadow-xs"
                title="Create new sales pipeline"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>New Pipeline</span>
              </button>
            )}

            <div className="h-4 w-px bg-[#27272a] my-auto"></div>

            <button
              onClick={() => onSelectView?.('board')}
              className="py-2.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors h-full"
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>Board</span>
            </button>
            <button
              onClick={() => onSelectView?.('analytics')}
              className="py-2.5 flex items-center gap-1.5 border-b-2 border-orange-500 text-orange-400 font-semibold transition-colors h-full"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">leaderboard</span>
              <span>Win/Loss Analytics</span>
            </button>
            <button
              onClick={() => onSelectView?.('settings')}
              className="py-2.5 flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 transition-colors h-full"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Pipeline Settings</span>
            </button>
          </div>
        </div>

        {/* Pipeline-wise Win/Loss Analytics Component */}
        <PipelineWinLossView
          pipeline={activePipeline}
          deals={deals}
          onBackToBoard={() => onSelectView?.('board')}
          onOpenNewDeal={() => onOpenNewDeal()}
          onSelectDeal={onSelectDeal}
        />
      </div>
    );
  }

  // When viewing Pipeline Settings for this specific pipeline (no global route!)
  if (currentView === 'settings') {
    return (
      <CrmPipelineSettings
        pipeline={activePipeline}
        settings={crmSettings || initialCrmPipelineSettings}
        stages={crmStages || initialCrmStages}
        onUpdateSettings={onUpdateCrmSettings || (() => {})}
        onUpdateStages={onUpdateCrmStages || (() => {})}
        onBackToBoard={() => onSelectView?.('board')}
        initialTab={settingsInitialTab}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] select-none text-zinc-100">
      {/* Internal Navigation Sub-Bar */}
      <div className="px-6 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between shrink-0 h-11 text-xs">
        {/* Left Side: Pipeline Selector & Add Pipeline CTA + View Tabs */}
        <div className="flex items-center gap-4 h-full">
          {/* Active Pipeline Selector & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPipelinePickerOpen(!isPipelinePickerOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] hover:border-orange-500/50 text-xs font-semibold text-zinc-100 transition-all"
              title="Current Pipeline (Click to switch)"
            >
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ color: activePipeline.color && activePipeline.color !== '#9900c2' ? activePipeline.color : '#ea580c' }}
              >
                {!activePipeline.icon || activePipeline.icon === 'building' ? 'leaderboard' : activePipeline.icon}
              </span>
              <span className="truncate max-w-[130px]">{activePipeline.name}</span>
              <span className="material-symbols-outlined text-[13px] text-zinc-400">
                {isPipelinePickerOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Pipeline Picker Dropdown Menu */}
            {isPipelinePickerOpen && pipelines.length > 0 && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-xl z-50 py-1.5 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                  Select Pipeline ({pipelines.length})
                </div>
                {pipelines.map((p) => {
                  const isCurrent = p.id === activePipeline.id;
                  const pColor = p.color && p.color !== '#9900c2' ? p.color : '#ea580c';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setIsPipelinePickerOpen(false);
                        if (onSelectPipeline) onSelectPipeline(p.id);
                      }}
                      className={`px-3 py-2 flex items-center justify-between text-left text-xs transition-colors hover:bg-[#18181b] ${
                        isCurrent ? 'bg-orange-950/40 font-semibold text-orange-400' : 'text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="material-symbols-outlined text-[15px] shrink-0"
                          style={{ color: pColor }}
                        >
                          {!p.icon || p.icon === 'building' ? 'leaderboard' : p.icon}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {p.dealCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* + Button to Add New Pipeline */}
          {onOpenAddPipeline && (
            <button
              type="button"
              onClick={onOpenAddPipeline}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold transition-all shadow-xs shrink-0"
              title="Create new sales pipeline"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span className="hidden sm:inline">New Pipeline</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#27272a] my-auto"></div>

          {/* Segmented View Tabs */}
          <div className="flex items-center gap-5 h-full">
            <button
              onClick={() => onSelectView && onSelectView('board')}
              className={`py-2.5 flex items-center gap-1.5 transition-colors h-full ${
                currentView === 'board'
                  ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>Board</span>
            </button>
            <button
              onClick={() => onSelectView && onSelectView('list')}
              className={`py-2.5 flex items-center gap-1.5 transition-colors h-full ${
                currentView === 'list'
                  ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              <span>List</span>
            </button>
            <button
              onClick={() => onSelectView && onSelectView('table')}
              className={`py-2.5 flex items-center gap-1.5 transition-colors h-full ${
                currentView === 'table'
                  ? 'border-b-2 border-orange-500 text-orange-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              <span>Table</span>
            </button>
            <button
              onClick={() => onSelectView && onSelectView('analytics')}
              className="py-2.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors h-full"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">leaderboard</span>
              <span>Win/Loss Analytics</span>
            </button>
            <button
              onClick={() => {
                if (onSelectView) onSelectView('settings');
                else if (onOpenSettings) onOpenSettings('general');
              }}
              className="py-2.5 flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 transition-colors h-full"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Pipeline Settings</span>
            </button>
          </div>
        </div>

        {/* Sub-controls Right Side with Interactive Dropdowns */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          {/* Group By Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="h-7 px-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-200 font-semibold flex items-center gap-1 hover:border-orange-500/40 transition-colors cursor-pointer"
              title="Group deals"
            >
              <span className="text-zinc-400 leading-none">Group by:</span>
              <span className="capitalize leading-none">{groupBy}</span>
              <span className="material-symbols-outlined text-[12px] opacity-70 leading-none shrink-0">
                {isGroupDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isGroupDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                  Group Deals By
                </div>
                {[
                  { id: 'stage' as const, label: 'Sales Stage' },
                  { id: 'owner' as const, label: 'Deal Owner' },
                  { id: 'probability' as const, label: 'Probability Tier' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setGroupBy(item.id);
                      setIsGroupDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#18181b] transition-colors ${
                      groupBy === item.id ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-zinc-200'
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

          {/* Sort By Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="h-7 px-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-200 font-semibold flex items-center gap-1 hover:border-orange-500/40 transition-colors cursor-pointer"
              title="Sort deals"
            >
              <span className="text-zinc-400 leading-none">Sort:</span>
              <span className="leading-none">
                {sortBy === 'value-desc'
                  ? 'Value ↓'
                  : sortBy === 'value-asc'
                  ? 'Value ↑'
                  : sortBy === 'prob'
                  ? 'Probability'
                  : sortBy === 'date'
                  ? 'Close Date'
                  : 'Account'}
              </span>
              <span className="material-symbols-outlined text-[12px] opacity-70 leading-none shrink-0">
                {isSortDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                  Sort Order
                </div>
                {[
                  { id: 'value-desc' as const, label: 'Deal Value (High to Low)' },
                  { id: 'value-asc' as const, label: 'Deal Value (Low to High)' },
                  { id: 'prob' as const, label: 'Probability (High to Low)' },
                  { id: 'date' as const, label: 'Target Close Date' },
                  { id: 'name' as const, label: 'Deal Title (A to Z)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSortBy(item.id);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#18181b] transition-colors ${
                      sortBy === item.id ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-zinc-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    {sortBy === item.id && (
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (onSelectView) onSelectView('settings');
              else if (onOpenSettings) onOpenSettings('stages');
            }}
            className="h-7 px-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-orange-400 font-semibold hover:bg-zinc-800 transition-colors ml-1 cursor-pointer flex items-center leading-none"
          >
            Edit Stages
          </button>
        </div>
      </div>

      {/* CRM Filter & Quick Actions Bar */}
      <div className="px-6 min-h-[40px] py-1.5 bg-[#121214] border-b border-[#27272a] flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0 select-none">
        {/* Left: Quick Actions Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase font-semibold text-zinc-400 shrink-0 mr-1 flex items-center gap-1.5 h-7">
            <span className="material-symbols-outlined text-[14px] text-orange-400 leading-none shrink-0">tune</span>
            <span className="leading-none">Filters:</span>
          </span>

          {/* All Deals Pill */}
          <button
            onClick={handleClearCrmFilters}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors cursor-pointer ${
              !hasActiveCrmFilters
                ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <span className="leading-none">All Deals</span>
            <span className="font-mono text-[10px] opacity-80 leading-none">({pipelineDeals.length})</span>
          </button>

          {/* Active Sub-Folder Pill */}
          {activePipelineSubFolder && (
            <div className="h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-semibold bg-orange-950/50 text-orange-400 border border-orange-500/40 shadow-xs">
              <span className="material-symbols-outlined text-[13px] leading-none shrink-0">{activePipelineSubFolder.icon || 'folder'}</span>
              <span className="leading-none">Sub-folder: {activePipelineSubFolder.name}</span>
              {onClearSubFolderFilter && (
                <button
                  type="button"
                  onClick={onClearSubFolderFilter}
                  className="text-orange-400/80 hover:text-orange-200 ml-0.5 cursor-pointer leading-none text-xs"
                  title="Remove sub-folder filter"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* High Value (>$100k) */}
          <button
            onClick={() => {
              setQuickActionFilter(quickActionFilter === 'high-value' ? null : 'high-value');
            }}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors cursor-pointer ${
              quickActionFilter === 'high-value'
                ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-amber-400 leading-none shrink-0">payments</span>
            <span className="leading-none">High Value (&gt;$100k)</span>
          </button>

          {/* Proposal / Demo */}
          <button
            onClick={() => {
              setQuickActionFilter(quickActionFilter === 'proposal' ? null : 'proposal');
            }}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors cursor-pointer ${
              quickActionFilter === 'proposal'
                ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-blue-400 leading-none shrink-0">present_to_all</span>
            <span className="leading-none">Proposal & Demo</span>
          </button>

          {/* Closing Soon */}
          <button
            onClick={() => {
              setQuickActionFilter(quickActionFilter === 'closing-soon' ? null : 'closing-soon');
            }}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors cursor-pointer ${
              quickActionFilter === 'closing-soon'
                ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-amber-400 leading-none shrink-0">alarm</span>
            <span className="leading-none">Closing Soon</span>
          </button>

          {/* Closed Won */}
          <button
            onClick={() => {
              setQuickActionFilter(quickActionFilter === 'won' ? null : 'won');
            }}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-[6px] text-[11px] font-medium border transition-colors cursor-pointer ${
              quickActionFilter === 'won'
                ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-emerald-400 leading-none shrink-0">verified</span>
            <span className="leading-none">Closed Won</span>
          </button>

          {/* Filter by Stage Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsStageFilterOpen(!isStageFilterOpen)}
              className={`h-7 flex items-center gap-1 px-2.5 rounded-[6px] text-[11px] border transition-colors cursor-pointer ${
                stageFilter
                  ? 'bg-orange-950/40 border-orange-500/30 text-orange-400 font-semibold'
                  : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="leading-none">{stageFilter ? `Stage: ${stageFilter}` : 'Stage: All'}</span>
              <span className="material-symbols-outlined text-[12px] opacity-70 leading-none shrink-0">
                {isStageFilterOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isStageFilterOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                  Filter by Stage
                </div>
                {['All', 'Qualified Lead', 'Discovery & Demo', 'Proposal Submitted', 'Contract & Legal', 'Closed Won'].map((stg) => {
                  const isSelected = stg === 'All' ? !stageFilter : stageFilter === stg;
                  return (
                    <button
                      key={stg}
                      onClick={() => {
                        setStageFilter(stg === 'All' ? null : stg);
                        setIsStageFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#18181b] transition-colors ${
                        isSelected ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-zinc-200'
                      }`}
                    >
                      <span>{stg}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter by Owner Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
              className={`h-7 flex items-center gap-1 px-2.5 rounded-[6px] text-[11px] border transition-colors cursor-pointer ${
                ownerFilter
                  ? 'bg-orange-950/40 border-orange-500/30 text-orange-400 font-semibold'
                  : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="leading-none">{ownerFilter ? `Owner: ${ownerFilter}` : 'Owner: All'}</span>
              <span className="material-symbols-outlined text-[12px] opacity-70 leading-none shrink-0">
                {isOwnerFilterOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isOwnerFilterOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-xl z-50 py-1 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                  Filter by Owner
                </div>
                {['All', ...allOwners].map((ow) => {
                  const isSelected = ow === 'All' ? !ownerFilter : ownerFilter === ow;
                  return (
                    <button
                      key={ow}
                      onClick={() => {
                        setOwnerFilter(ow === 'All' ? null : ow);
                        setIsOwnerFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#18181b] transition-colors ${
                        isSelected ? 'text-orange-400 font-bold bg-orange-950/40' : 'text-zinc-200'
                      }`}
                    >
                      <span>{ow}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset Filters Button */}
          {hasActiveCrmFilters && (
            <button
              onClick={handleClearCrmFilters}
              className="h-7 flex items-center gap-1 text-[11px] font-mono text-orange-400 hover:underline px-2 cursor-pointer"
              title="Reset all filters"
            >
              <span className="material-symbols-outlined text-[14px] leading-none shrink-0">filter_alt_off</span>
              <span className="leading-none">Reset</span>
            </button>
          )}
        </div>

        {/* Right: Search Input & Add Deal CTA */}
        <div className="flex items-center gap-3">
          {/* CRM Deal Search Bar */}
          <div className="relative w-60">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-zinc-400 leading-none shrink-0">
              search
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search deals, accounts, owners..."
              className="w-full h-7 bg-[#18181b] border border-[#27272a] rounded-[6px] pl-8 pr-7 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Deal Primary CTA Button */}
          <button
            onClick={() => onOpenNewDeal('Proposal Submitted')}
            className="h-7 flex items-center gap-1.5 px-3 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] leading-none shrink-0">add</span>
            <span className="leading-none">Deal</span>
          </button>
        </div>
      </div>

      {/* Metric Ribbon / KPI Strip */}
      <section className="px-6 py-2.5 bg-[#121214] border-b border-[#27272a] flex flex-wrap items-center gap-x-6 gap-y-2.5 shrink-0 overflow-x-hidden text-xs w-full max-w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Total Pipeline
          </div>
          <div className="font-mono text-base font-bold text-zinc-100">
            ${totalPipeline.toLocaleString()}
          </div>
        </div>

        <div className="hidden lg:block h-4 w-px bg-[#27272a] shrink-0"></div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Weighted Forecast
          </div>
          <div className="font-mono text-base font-bold text-orange-400">
            ${weightedForecast.toLocaleString()}
          </div>
        </div>

        <div className="hidden lg:block h-4 w-px bg-[#27272a] shrink-0"></div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Active Deals
          </div>
          <div className="font-mono text-base font-bold text-zinc-100">
            {displayedDeals.length} of {pipelineDeals.length} deals
          </div>
        </div>

        <div className="hidden lg:block h-4 w-px bg-[#27272a] shrink-0"></div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Win Rate
          </div>
          <div className="font-mono text-base font-bold text-emerald-400">{winRate}%</div>
        </div>

        <div className="hidden lg:block h-4 w-px bg-[#27272a] shrink-0"></div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Avg Cycle
          </div>
          <div className="font-mono text-base font-bold text-zinc-100">16 days</div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>Replication Active (Peer: us-east-local)</span>
          </span>
        </div>
      </section>

      {/* Main Content Area: Kanban Board, List View, or Table View */}
      {displayedDeals.length === 0 ? (
        <div className="flex-1 p-12 flex flex-col items-center justify-center text-center bg-[#09090b]">
          <div className="w-12 h-12 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-3 text-orange-400">
            <span className="material-symbols-outlined text-[24px]">filter_alt_off</span>
          </div>
          <h3 className="font-semibold text-sm text-zinc-100 mb-1">No deals match your criteria</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            Try adjusting your search query or clearing quick filters to view active opportunities.
          </p>
          <button
            onClick={handleClearCrmFilters}
            className="px-3.5 py-1.5 bg-orange-600 text-white rounded-[6px] text-xs font-semibold hover:bg-orange-500 transition-colors shadow-xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : currentView === 'list' ? (
        <div className="flex-1 p-6 overflow-y-auto bg-[#09090b] custom-scrollbar">
          <div className="bg-[#121214] rounded-[6px] border border-[#27272a] overflow-hidden shadow-xs divide-y divide-[#27272a]">
            {displayedDeals.map((deal) => {
              const isSelected = deal.id === selectedDealId;
              return (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/40 transition-colors ${
                    isSelected ? 'bg-orange-950/30 border-l-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#18181b] border border-[#27272a] text-zinc-200 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                      {deal.contact.initials}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-zinc-100 truncate">{deal.title}</div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {deal.company} • {deal.contact.name} • {deal.owner}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-[6px] bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/30">
                      {deal.stage}
                    </span>
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-zinc-100">{deal.formattedValue}</div>
                      <div className="font-mono text-[10px] text-zinc-400">{deal.probability}% prob</div>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 hidden md:inline">
                      {deal.targetCloseDate}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-zinc-400">chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : currentView === 'table' ? (
        <div className="flex-1 p-6 overflow-auto bg-[#09090b] custom-scrollbar">
          <div className="bg-[#121214] rounded-[6px] border border-[#27272a] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#18181b] border-b border-[#27272a] font-mono text-[11px] text-zinc-400">
                  <th className="p-3 font-semibold">Deal Title</th>
                  <th className="p-3 font-semibold">Account</th>
                  <th className="p-3 font-semibold">Value</th>
                  <th className="p-3 font-semibold">Stage</th>
                  <th className="p-3 font-semibold">Probability</th>
                  <th className="p-3 font-semibold">Close Date</th>
                  <th className="p-3 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-sans">
                {displayedDeals.map((deal) => {
                  const isSelected = deal.id === selectedDealId;
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className={`cursor-pointer hover:bg-zinc-800/40 transition-colors ${
                        isSelected ? 'bg-orange-950/30' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-zinc-100">{deal.title}</td>
                      <td className="p-3 text-zinc-400">{deal.company}</td>
                      <td className="p-3 font-mono font-bold text-zinc-100">{deal.formattedValue}</td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/30">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-400">{deal.probability}%</td>
                      <td className="p-3 font-mono text-zinc-400">{deal.targetCloseDate}</td>
                      <td className="p-3 text-zinc-400">{deal.owner}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Content Area: Deal Pipeline Board (Columns grouped by groupBy) */
        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden bg-[#09090b]">
          <div className="flex gap-4 min-w-[1540px] h-full items-start">
            {boardColumns.map((col) => {
              const colDeals = displayedDeals.filter(col.filterDeals);
              const colValueSum = colDeals.reduce((sum, d) => sum + d.value, 0);

              return (
                <div
                  key={col.key}
                  className={`w-[292px] shrink-0 flex flex-col max-h-full rounded-[6px] p-3 transition-all relative ${
                    col.isHighlighted
                      ? 'bg-[#121214] border border-orange-500/50 shadow-sm'
                      : 'bg-[#121214] border border-[#27272a]'
                  }`}
                >
                  {/* Top Orange Accent Strip on highlighted column */}
                  {col.isHighlighted && (
                    <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-orange-500 rounded-t-[6px]"></div>
                  )}

                  {/* Column Header */}
                  <div
                    className={`flex items-center justify-between pb-2.5 mb-2.5 border-b px-1 text-xs ${
                      col.isHighlighted ? 'border-orange-500/30' : 'border-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${col.dotColor} ${
                          col.isHighlighted ? 'animate-pulse' : ''
                        }`}
                      ></span>
                      <span
                        className={`font-semibold ${
                          col.isHighlighted ? 'text-orange-400' : 'text-zinc-100'
                        }`}
                      >
                        {col.title}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] font-bold ${
                          col.isHighlighted
                            ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                            : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                        }`}
                      >
                        {colDeals.length}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        col.isHighlighted ? 'text-orange-400' : 'text-zinc-400'
                      }`}
                    >
                      ${Math.round(colValueSum / 1000)}k
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {colDeals.map((deal) => {
                      const isSelected = deal.id === selectedDealId;
                      const isFeatured = deal.id === 'DEAL-402';

                      return (
                        <div
                          key={deal.id}
                          onClick={() => onSelectDeal(deal)}
                          className={`p-3.5 bg-[#18181b] rounded-[6px] transition-all cursor-pointer group relative text-xs ${
                            isSelected
                              ? 'border-2 border-orange-500 shadow-md ring-2 ring-orange-500/10'
                              : isFeatured
                              ? 'border border-orange-500/40 shadow-xs hover:border-orange-500'
                              : 'border border-[#27272a] hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-semibold text-xs text-zinc-100 leading-tight group-hover:text-orange-400 transition-colors">
                              {deal.title}
                            </span>
                            {!isFeatured && (
                              <span className="font-mono text-xs font-bold text-zinc-100 shrink-0">
                                {deal.formattedValue}
                              </span>
                            )}
                          </div>

                          {/* Featured Deal Big Price Row */}
                          {isFeatured && (
                            <div className="font-mono text-xl font-bold text-orange-400 mb-2">
                              {deal.formattedValue}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-[#121214] border border-[#27272a] text-zinc-200 font-mono text-[9px] flex items-center justify-center font-bold">
                                {deal.contact.initials}
                              </span>
                              <span className="text-zinc-300 font-medium truncate">
                                {deal.contact.name}
                              </span>
                            </div>
                            <span
                              className={`font-mono text-[10px] ${
                                isFeatured ? 'text-orange-400 font-semibold' : 'text-zinc-500'
                              }`}
                            >
                              {deal.targetCloseDate.split(',')[0]}
                            </span>
                          </div>

                          {deal.nextStep && (
                            <div className="bg-[#121214] border border-[#27272a] p-1.5 rounded-[6px] font-mono text-[10px] text-zinc-400 mb-2">
                              <span className="font-semibold text-orange-400">Next step:</span>{' '}
                              {deal.nextStep}
                            </div>
                          )}

                          {/* Tags */}
                          {deal.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              {deal.tags.map((tg) => (
                                <span
                                  key={tg}
                                  className={`font-mono text-[10px] px-2 py-0.5 rounded-[6px] border ${
                                    isFeatured
                                      ? 'bg-orange-950/40 text-orange-400 border-orange-500/30 font-medium'
                                      : 'bg-[#121214] border-[#27272a] text-zinc-400'
                                  }`}
                                >
                                  {tg}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Card Footer: Deliverables countdown */}
                          {deal.linkedTasks.length > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-[#27272a] text-zinc-400 font-mono text-[10px]">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-orange-400">
                                  assignment_turned_in
                                </span>
                                <span>{deal.linkedTasks.length} deliverables linked</span>
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                arrow_forward
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Deal Ghost Button */}
                  <button
                    onClick={() => onOpenNewDeal(col.defaultStage)}
                    className={`mt-2.5 w-full py-1.5 rounded-[6px] border border-dashed text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors ${
                      col.isHighlighted
                        ? 'border-orange-500/40 hover:border-orange-500 text-orange-400 bg-orange-950/20'
                        : 'border-[#27272a] hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 bg-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Add Deal</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
