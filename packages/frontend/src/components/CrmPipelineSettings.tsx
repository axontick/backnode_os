import React, { useState } from 'react';
import { CrmPipelineSettings as CrmPipelineSettingsType, CrmStageDefinition, CrmPipeline } from '../types';

interface CrmPipelineSettingsProps {
  settings: CrmPipelineSettingsType;
  stages: CrmStageDefinition[];
  pipeline?: CrmPipeline;
  onUpdateSettings: (newSettings: CrmPipelineSettingsType) => void;
  onUpdateStages: (newStages: CrmStageDefinition[]) => void;
  onBackToBoard: () => void;
  initialTab?: 'general' | 'stages';
}

export const CrmPipelineSettings: React.FC<CrmPipelineSettingsProps> = ({
  settings,
  stages,
  pipeline,
  onUpdateSettings,
  onUpdateStages,
  onBackToBoard,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'stages' | 'fields' | 'automations' | 'danger'>(
    initialTab === 'stages' ? 'stages' : 'general'
  );
  const [localSettings, setLocalSettings] = useState<CrmPipelineSettingsType>(settings);
  const [localStages, setLocalStages] = useState<CrmStageDefinition[]>(stages);

  // Edit Stage Drawer state (focused on Proposal Submitted by default as per HTML 4)
  const [editingStageId, setEditingStageId] = useState<string>('stage-3');
  const activeEditingStage = localStages.find((s) => s.id === editingStageId) || localStages[2];

  const [drawerStageName, setDrawerStageName] = useState(activeEditingStage?.name || 'Proposal Submitted');
  const [drawerStageColor, setDrawerStageColor] = useState(activeEditingStage?.color || '#ea580c');
  const [drawerStageProb, setDrawerStageProb] = useState(activeEditingStage?.winProbability || 60);
  const [drawerStageLimit, setDrawerStageLimit] = useState(activeEditingStage?.daysLimit || 14);
  const [drawerGates, setDrawerGates] = useState(activeEditingStage?.requiredGates || []);
  const [drawerWebhook, setDrawerWebhook] = useState<boolean>(activeEditingStage?.webhookEnabled ?? true);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [stageFilter, setStageFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [stageSearch, setStageSearch] = useState('');
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [isAddingGate, setIsAddingGate] = useState(false);
  const [newGateText, setNewGateText] = useState('');

  const colorPresets = [
    { name: 'Electric Orange', hex: '#ea580c' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Rose', hex: '#ef4444' },
    { name: 'Slate', hex: '#64748b' },
  ];

  const handleSelectEditingStage = (stage: CrmStageDefinition) => {
    setEditingStageId(stage.id);
    setDrawerStageName(stage.name);
    setDrawerStageColor(stage.color);
    setDrawerStageProb(stage.winProbability);
    setDrawerStageLimit(stage.daysLimit);
    setDrawerGates(stage.requiredGates);
    setDrawerWebhook(stage.webhookEnabled);
  };

  const handleSaveStageDrawer = () => {
    const updatedStages = localStages.map((s) =>
      s.id === editingStageId
        ? {
            ...s,
            name: drawerStageName,
            color: drawerStageColor,
            winProbability: drawerStageProb,
            daysLimit: drawerStageLimit,
            requiredGates: drawerGates,
            webhookEnabled: drawerWebhook,
          }
        : s
    );
    setLocalStages(updatedStages);
    setHasUnsavedChanges(true);
  };

  const handleToggleGate = (gateId: string) => {
    setDrawerGates((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, checked: !g.checked } : g))
    );
    setHasUnsavedChanges(true);
  };

  const handleAddGate = () => {
    if (!newGateText.trim()) return;
    const newG = { id: `g-${Date.now()}`, text: newGateText.trim(), checked: false };
    setDrawerGates([...drawerGates, newG]);
    setNewGateText('');
    setIsAddingGate(false);
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    onUpdateSettings(localSettings);
    onUpdateStages(localStages);
    setHasUnsavedChanges(false);
  };

  const filteredStages = localStages.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(stageSearch.toLowerCase());
    if (stageFilter === 'open') return matchesSearch && !s.isTerminal;
    if (stageFilter === 'closed') return matchesSearch && s.isTerminal;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Top Breadcrumb & App Bar */}
      <header className="sticky top-0 z-20 bg-[#0c0a09] border-b border-[#27272a] h-14 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-zinc-100 font-headline">Backnode</span>
          <span className="text-zinc-500">/</span>
          <span className="text-zinc-400">Pipeline CRM</span>
          <span className="text-zinc-500">/</span>
          <span className="text-zinc-300">{pipeline?.name || localSettings.name}</span>
          <span className="text-zinc-500">/</span>
          <span className="text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/20">
            Pipeline Settings
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoard}
            className="h-8 px-3 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Back to Deals Board</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="h-8 px-3.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">check</span>
            <span>Save Changes</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Canvas */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[1580px] mx-auto flex flex-col gap-6">
          {/* Node Context Banner */}
          <section className="bg-[#121214] rounded-[6px] border border-[#27272a] p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-950/40 text-orange-400 font-mono text-[10px] font-semibold rounded-[6px] border border-orange-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    PIPELINE CONFIGURATION NODE • ID: {localSettings.code}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">history</span>
                    Last sync 18s ago
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mt-0.5 font-headline">
                  CRM Pipeline Settings: {localSettings.name}
                </h1>
                <p className="text-xs text-zinc-400 max-w-3xl">
                  {localSettings.description}
                </p>
              </div>

              {/* Quick Telemetry Micro-Cards */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">Active Deals</span>
                  <span className="text-sm font-bold text-zinc-100">42 Contracts</span>
                </div>
                <div className="px-3.5 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">Pipeline ARR</span>
                  <span className="text-sm font-bold text-orange-400 font-mono">$4.82M USD</span>
                </div>
                <div className="px-3.5 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">Lock State</span>
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lock_open</span>
                    Unlocked
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Strip */}
            <div className="mt-5 pt-3 border-t border-[#27272a] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'general'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>General</span>
                </button>

                <button
                  onClick={() => setActiveTab('stages')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'stages'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">alt_route</span>
                  <span>Stages &amp; Lifecycle</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] font-semibold ${
                      activeTab === 'stages'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#18181b] text-zinc-400 border border-[#27272a]'
                    }`}
                  >
                    5 stages
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('fields')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'fields'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_column</span>
                  <span>Deal Fields &amp; Properties</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#18181b] text-zinc-400 border border-[#27272a]">
                    12 fields
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('automations')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'automations'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Automations &amp; SLA Hooks</span>
                </button>

                <button
                  onClick={() => setActiveTab('danger')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-semibold text-rose-400 hover:bg-rose-950/20 transition-colors ml-2 whitespace-nowrap shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Danger Zone</span>
                </button>
              </div>

              <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Changes propagate instantly across workspace store</span>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* TAB 1: GENERAL                                                 */}
          {/* ============================================================== */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column (8 Cols) */}
              <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                {/* Card 1: Pipeline Identity & Commercial Scope */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-orange-950/40 flex items-center justify-center text-orange-400">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-zinc-100 font-headline">
                          Pipeline Identity &amp; Commercial Scope
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Core identification tags, localized nomenclature, and interface colorway.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#18181b] text-zinc-400 border border-[#27272a]">
                      Core Metadata
                    </span>
                  </div>

                  {/* Pipeline Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-zinc-200">
                        Pipeline Name <span className="text-orange-500">*</span>
                      </label>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {localSettings.name.length}/64 characters
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={localSettings.name}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, name: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full h-9 px-3 bg-[#18181b] text-xs text-zinc-100 border border-[#27272a] rounded-[6px] focus:outline-none focus:border-orange-500"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-orange-500">
                        verified
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-200">
                      Description &amp; Commercial Scope
                    </label>
                    <textarea
                      rows={3}
                      value={localSettings.description}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, description: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full p-2.5 bg-[#18181b] text-xs text-zinc-100 border border-[#27272a] rounded-[6px] focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>

                  {/* Color Swatch & Accent System */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-zinc-200">
                        Pipeline Accent Color
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {colorPresets.map((cp) => (
                          <button
                            key={cp.hex}
                            type="button"
                            onClick={() => {
                              setLocalSettings({ ...localSettings, accentColor: cp.hex });
                              setHasUnsavedChanges(true);
                            }}
                            className={`w-7 h-7 rounded-[6px] transition-all flex items-center justify-center text-white cursor-pointer ${
                              localSettings.accentColor.toLowerCase() === cp.hex.toLowerCase()
                                ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#121214]'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: cp.hex }}
                            title={cp.name}
                          >
                            {localSettings.accentColor.toLowerCase() === cp.hex.toLowerCase() && (
                              <span className="material-symbols-outlined text-[15px]">check</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">
                            #
                          </span>
                          <input
                            type="text"
                            value={localSettings.accentColor.replace('#', '')}
                            onChange={(e) => {
                              setLocalSettings({ ...localSettings, accentColor: `#${e.target.value}` });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full h-8 pl-6 pr-2 bg-[#18181b] font-mono text-xs uppercase border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <span className="text-xs text-zinc-400">Active Accent</span>
                      </div>
                    </div>

                    {/* Badge Icon Picker */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-zinc-200">
                        Interface Badge Icon
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {['leaderboard', 'monetization_on', 'handshake', 'domain', 'table_chart', 'verified'].map(
                          (ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => {
                                setLocalSettings({ ...localSettings, icon: ic });
                                setHasUnsavedChanges(true);
                              }}
                              className={`h-8 rounded-[6px] border flex items-center justify-center transition-all ${
                                localSettings.icon === ic
                                  ? 'border-orange-500 bg-orange-950/40 text-orange-400'
                                  : 'border-[#27272a] hover:border-zinc-700 text-zinc-400 hover:text-zinc-100'
                              }`}
                              title={ic}
                            >
                              <span className="material-symbols-outlined text-[17px]">{ic}</span>
                            </button>
                          )
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Rendered next to pipeline headers &amp; kanban stage breadcrumbs.
                      </span>
                    </div>
                  </div>

                  {/* Currency & Display Format */}
                  <div className="pt-3 border-t border-[#27272a] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-zinc-200">
                        Base Commercial Currency
                      </label>
                      <select
                        value={localSettings.currency}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, currency: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="h-9 px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option>USD ($) - United States Dollar</option>
                        <option>EUR (€) - European Euro</option>
                        <option>GBP (£) - British Pound Sterling</option>
                        <option>JPY (¥) - Japanese Yen</option>
                        <option>CHF (Fr) - Swiss Franc</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-zinc-200">Number Notation Format</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`flex items-center gap-2 p-2 rounded-[6px] border cursor-pointer ${
                            localSettings.formatNotation === 'Compact'
                              ? 'border-orange-500 bg-orange-950/20'
                              : 'border-[#27272a] bg-[#18181b]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="formatNotation"
                            checked={localSettings.formatNotation === 'Compact'}
                            onChange={() => {
                              setLocalSettings({ ...localSettings, formatNotation: 'Compact' });
                              setHasUnsavedChanges(true);
                            }}
                            className="accent-orange-500"
                          />
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-zinc-100">Compact</span>
                            <span className="font-mono text-[10px] text-zinc-500">$540k ARR</span>
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-2 p-2 rounded-[6px] border cursor-pointer ${
                            localSettings.formatNotation === 'Standard'
                              ? 'border-orange-500 bg-orange-950/20'
                              : 'border-[#27272a] bg-[#18181b]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="formatNotation"
                            checked={localSettings.formatNotation === 'Standard'}
                            onChange={() => {
                              setLocalSettings({ ...localSettings, formatNotation: 'Standard' });
                              setHasUnsavedChanges(true);
                            }}
                            className="accent-orange-500"
                          />
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-zinc-100">Standard</span>
                            <span className="font-mono text-[10px] text-zinc-500">$540,000.00</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Default Forecasting & Quota Defaults */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-orange-950/40 flex items-center justify-center text-orange-400">
                        <span className="material-symbols-outlined text-[18px]">query_stats</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-zinc-100 font-headline">
                          Default Forecasting &amp; Quota Defaults
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Configure velocity parameters, stage weight formulas, and target revenue gates.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#18181b] text-zinc-400 border border-[#27272a]">
                      Revenue Intelligence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-zinc-200">
                        Default Target Close Cycle
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={localSettings.defaultCloseCycleDays}
                          onChange={(e) => {
                            setLocalSettings({
                              ...localSettings,
                              defaultCloseCycleDays: Number(e.target.value),
                            });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full h-9 px-3 pr-14 bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-zinc-500">
                          days
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Triggers SLA amber indicators when opportunity age exceeds this baseline.
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-zinc-200">
                        Win Probability Algorithm
                      </label>
                      <select
                        value={localSettings.winProbabilityAlgorithm}
                        onChange={(e) => {
                          setLocalSettings({
                            ...localSettings,
                            winProbabilityAlgorithm: e.target.value,
                          });
                          setHasUnsavedChanges(true);
                        }}
                        className="h-9 px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option>Dynamic Stage Weighting (Deterministic)</option>
                        <option>Manual Sales Rep Override</option>
                        <option>Machine-Learned Historical Regression</option>
                      </select>
                      <span className="text-[11px] text-zinc-500">
                        Derives forecast values by multiplying pipeline values with stage confidence %.
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-zinc-200">
                        Quarterly Target Revenue (Q4 2026)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">
                          $
                        </span>
                        <input
                          type="text"
                          value={localSettings.targetQuarterlyRevenue.toLocaleString()}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                            setLocalSettings({ ...localSettings, targetQuarterlyRevenue: val });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full h-9 pl-7 pr-12 bg-[#18181b] border border-[#27272a] rounded-[6px] font-mono text-xs font-semibold text-zinc-100 focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500">
                          USD
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-zinc-200">
                        Minimum Deal Value Gate (ARR Threshold)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">
                          $
                        </span>
                        <input
                          type="text"
                          value={localSettings.minDealValueGate.toLocaleString()}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                            setLocalSettings({ ...localSettings, minDealValueGate: val });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full h-9 pl-7 pr-12 bg-[#18181b] border border-[#27272a] rounded-[6px] font-mono text-xs font-semibold text-zinc-100 focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500">
                          USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Default Layout & Deal Card Display */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] bg-orange-950/40 flex items-center justify-center text-orange-400">
                        <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-zinc-100 font-headline">
                          Default Layout &amp; Deal Card Display
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Default starting view and surface density for team members accessing this pipeline.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#18181b] text-zinc-400 border border-[#27272a]">
                      Interface Preferences
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-200">
                      Primary Default View Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {(
                        [
                          { id: 'Kanban Board', icon: 'view_kanban', desc: 'Stages & cards' },
                          { id: 'Spreadsheet', icon: 'table_rows', desc: 'Dense matrix' },
                          { id: 'Forecast Matrix', icon: 'view_column', desc: 'Weighted ARR' },
                          { id: 'Timeline', icon: 'timeline', desc: 'Gantt tracks' },
                          { id: 'Analytics', icon: 'analytics', desc: 'Executive HUD' },
                        ] as const
                      ).map((mode) => {
                        const isSelected = localSettings.defaultView === mode.id;

                        return (
                          <div
                            key={mode.id}
                            onClick={() => {
                              setLocalSettings({ ...localSettings, defaultView: mode.id });
                              setHasUnsavedChanges(true);
                            }}
                            className={`p-3 rounded-[6px] border flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-2 border-orange-500 bg-orange-950/20 shadow-sm'
                                : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  isSelected ? 'text-orange-400' : 'text-zinc-500'
                                }`}
                              >
                                {mode.icon}
                              </span>
                              {isSelected ? (
                                <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[11px]">check</span>
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-zinc-700"></span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-xs text-zinc-100">{mode.id}</h3>
                              <p className="font-mono text-[10px] text-zinc-500 leading-tight mt-0.5">
                                {mode.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Visual Toggles */}
                  <div className="pt-3 border-t border-[#27272a] flex flex-col gap-3">
                    <label className="text-xs font-semibold text-zinc-200">
                      Deal Card Visual Properties (Kanban)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-start gap-2.5 p-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.cardProps.displayDealAge}
                          onChange={(e) => {
                            setLocalSettings({
                              ...localSettings,
                              cardProps: {
                                ...localSettings.cardProps,
                                displayDealAge: e.target.checked,
                              },
                            });
                            setHasUnsavedChanges(true);
                          }}
                          className="rounded-[6px] mt-0.5 accent-orange-500 cursor-pointer"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-zinc-100">Display Deal Age</span>
                          <span className="text-[11px] text-zinc-500">
                            Flags deals in stage &gt; 30 days
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.cardProps.primaryContactAvatar}
                          onChange={(e) => {
                            setLocalSettings({
                              ...localSettings,
                              cardProps: {
                                ...localSettings.cardProps,
                                primaryContactAvatar: e.target.checked,
                              },
                            });
                            setHasUnsavedChanges(true);
                          }}
                          className="rounded-[6px] mt-0.5 accent-orange-500 cursor-pointer"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-zinc-100">Primary Contact Avatar</span>
                          <span className="text-[11px] text-zinc-500">
                            Shows champion &amp; buyer chips
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.cardProps.nextMilestonePill}
                          onChange={(e) => {
                            setLocalSettings({
                              ...localSettings,
                              cardProps: {
                                ...localSettings.cardProps,
                                nextMilestonePill: e.target.checked,
                              },
                            });
                            setHasUnsavedChanges(true);
                          }}
                          className="rounded-[6px] mt-0.5 accent-orange-500 cursor-pointer"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-zinc-100">Next Milestone Pill</span>
                          <span className="text-[11px] text-zinc-500">
                            Embeds upcoming task countdown
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (4 Cols): Governance & Local Engine */}
              <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-5 flex flex-col gap-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-400 text-[20px]">
                        admin_panel_settings
                      </span>
                      <h3 className="font-semibold text-xs text-zinc-100 font-headline">Team Governance</h3>
                    </div>
                    <span className="font-mono text-[10px] text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 rounded-[6px] border border-orange-500/20">
                      6 Members
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    The following operators hold write authority over deals in this pipeline.
                  </p>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#18181b] border border-[#27272a]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                          OP
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-100">Operator Prime (You)</span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            Pipeline Owner • Admin
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-orange-500">
                        verified_user
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#18181b] border border-[#27272a]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] flex items-center justify-center">
                          SL
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-100">Sarah Lin</span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            Commercial Lead • Write
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">RevOps</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRoleManager(!showRoleManager)}
                    className="w-full py-2 bg-[#18181b] hover:bg-zinc-800 text-orange-400 text-xs font-semibold rounded-[6px] border border-[#27272a] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">group_add</span>
                    <span>{showRoleManager ? 'Hide Pipeline Roles' : 'Manage Pipeline Roles'}</span>
                  </button>

                  {showRoleManager && (
                    <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold text-orange-400">Pipeline Access Matrix</span>
                        <span className="font-mono text-[9px] text-zinc-500">RBAC / ABAC</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between p-1.5 rounded-[6px] bg-[#121214] border border-[#27272a]">
                          <span className="text-zinc-200 font-medium">Enterprise Admin</span>
                          <span className="font-mono text-[9px] text-emerald-400">Full Rights</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-[6px] bg-[#121214] border border-[#27272a]">
                          <span className="text-zinc-200 font-medium">Commercial Lead</span>
                          <span className="font-mono text-[9px] text-orange-400">Stage &amp; Deal Write</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-[6px] bg-[#121214] border border-[#27272a]">
                          <span className="text-zinc-200 font-medium">Member / Analyst</span>
                          <span className="font-mono text-[9px] text-zinc-400">Read &amp; Note Only</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: STAGES & LIFECYCLE                                      */}
          {/* ============================================================== */}
          {activeTab === 'stages' && (
            <div className="flex gap-6 items-start">
              {/* Left Section (65%) */}
              <section className="w-[65%] flex flex-col gap-4">
                {/* Architecture Callout */}
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-3.5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-[6px] bg-orange-950/40 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-100">
                        Stage Pipeline Architecture
                      </span>
                      <span className="font-mono text-[9px] bg-[#18181b] text-zinc-400 border border-[#27272a] px-1.5 py-0.2 rounded-[6px]">
                        System Rule
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Drag handles to reorder pipeline stages in Kanban and Forecast views. Deals in active stages require migration before stage deletion.
                    </p>
                  </div>
                </div>

                {/* Filter & Add Stage Action Bar */}
                <div className="flex items-center justify-between gap-4 bg-[#121214] p-2.5 border border-[#27272a] rounded-[6px]">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-60">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[15px]">
                        filter_list
                      </span>
                      <input
                        type="text"
                        value={stageSearch}
                        onChange={(e) => setStageSearch(e.target.value)}
                        placeholder="Search stages..."
                        className="w-full h-8 pl-8 pr-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <button
                        onClick={() => setStageFilter('all')}
                        className={`h-7 px-2.5 rounded-[6px] font-semibold transition-colors ${
                          stageFilter === 'all'
                            ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                            : 'text-zinc-400 hover:bg-[#18181b]'
                        }`}
                      >
                        All ({localStages.length})
                      </button>
                      <button
                        onClick={() => setStageFilter('open')}
                        className={`h-7 px-2.5 rounded-[6px] font-semibold transition-colors ${
                          stageFilter === 'open'
                            ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                            : 'text-zinc-400 hover:bg-[#18181b]'
                        }`}
                      >
                        Open Pipeline ({localStages.filter((s) => !s.isTerminal).length})
                      </button>
                      <button
                        onClick={() => setStageFilter('closed')}
                        className={`h-7 px-2.5 rounded-[6px] font-semibold transition-colors ${
                          stageFilter === 'closed'
                            ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                            : 'text-zinc-400 hover:bg-[#18181b]'
                        }`}
                      >
                        Closed Won/Lost ({localStages.filter((s) => s.isTerminal).length})
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newName = `New Stage 0${localStages.length + 1}`;
                      const newSt: CrmStageDefinition = {
                        id: `stage-${Date.now()}`,
                        order: localStages.length + 1,
                        name: newName,
                        description: 'Custom CRM validation stage',
                        color: '#ea580c',
                        winProbability: 50,
                        daysLimit: 14,
                        activeDealsCount: 0,
                        pipelineArr: 0,
                        requiredGates: [],
                        webhookEnabled: false,
                        webhookThreshold: 50000,
                      };
                      setLocalStages([...localStages, newSt]);
                      handleSelectEditingStage(newSt);
                      setHasUnsavedChanges(true);
                    }}
                    className="h-8 px-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-[6px] flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Add New Stage</span>
                  </button>
                </div>

                {/* Stages Table */}
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#18181b] border-b border-[#27272a] font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">Order</th>
                        <th className="py-2.5 px-3">Stage Name &amp; Description</th>
                        <th className="py-2.5 px-3 w-28 text-right">Default Win %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Active Deals</th>
                        <th className="py-2.5 px-3 w-32 text-right">Pipeline ARR</th>
                        <th className="py-2.5 px-3 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {filteredStages.map((st, idx) => {
                        const isSelected = st.id === editingStageId;

                        return (
                          <tr
                            key={st.id}
                            onClick={() => handleSelectEditingStage(st)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-orange-950/20 border-l-4 border-l-orange-500'
                                : 'hover:bg-[#18181b]/50'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <div className="cursor-grab text-zinc-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">
                                  drag_indicator
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-start gap-2.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-4 ring-black/40"
                                  style={{ backgroundColor: st.color }}
                                ></span>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-semibold text-xs ${
                                        isSelected ? 'text-orange-400' : 'text-zinc-100'
                                      }`}
                                    >
                                      {st.name}
                                    </span>
                                    <span className="font-mono text-[9px] text-zinc-500 border border-[#27272a] px-1 rounded-[6px]">
                                      {st.isTerminal ? 'TERMINAL' : `STAGE 0${idx + 1}`}
                                    </span>
                                    {isSelected && (
                                      <span className="font-mono text-[9px] bg-orange-950/40 text-orange-400 border border-orange-500/30 px-1 rounded-[6px] font-semibold">
                                        EDITING
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-zinc-500 truncate">
                                    {st.description}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-[11px]">
                              <span
                                className={`px-1.5 py-0.5 rounded-[6px] ${
                                  isSelected
                                    ? 'bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/20'
                                    : 'bg-[#18181b] text-zinc-300 border border-[#27272a]'
                                }`}
                              >
                                {st.winProbability}%
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-300">
                              {st.activeDealsCount} deals
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-xs font-bold text-zinc-100">
                              ${st.pipelineArr.toLocaleString()}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectEditingStage(st);
                                  }}
                                  className={`p-1 rounded-[6px] transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-orange-600 text-white shadow-xs'
                                      : 'hover:bg-[#18181b] text-zinc-400'
                                  }`}
                                  title="Edit stage"
                                >
                                  <span className="material-symbols-outlined text-[15px]">edit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Stage Governance & Guardrails */}
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col gap-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-400 text-[18px]">
                        security
                      </span>
                      <span className="font-semibold text-xs text-zinc-100 font-headline">
                        Stage Governance &amp; Guardrails
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Policy Engine v1.2
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <label className="flex items-start gap-2.5 p-2 rounded-[6px] hover:bg-[#18181b] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.governance.strictForwardMotion}
                        onChange={(e) => {
                          setLocalSettings({
                            ...localSettings,
                            governance: {
                              ...localSettings.governance,
                              strictForwardMotion: e.target.checked,
                            },
                          });
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-0.5 w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-100">Strict Forward Motion</span>
                        <span className="text-[11px] text-zinc-400">
                          Disallow skipping stages without executive override. Deals must traverse through each validation gate.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-[6px] hover:bg-[#18181b] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.governance.stalledDealAlert}
                        onChange={(e) => {
                          setLocalSettings({
                            ...localSettings,
                            governance: {
                              ...localSettings.governance,
                              stalledDealAlert: e.target.checked,
                            },
                          });
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-0.5 w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-100">Mandatory Stalled Deal Alert</span>
                        <span className="text-[11px] text-zinc-400">
                          Flag deals inactive for &gt; 14 days in any active stage and notify the lead deal owner and workspace admin.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-[6px] hover:bg-[#18181b] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.governance.autoLinkDeliverables}
                        onChange={(e) => {
                          setLocalSettings({
                            ...localSettings,
                            governance: {
                              ...localSettings.governance,
                              autoLinkDeliverables: e.target.checked,
                            },
                          });
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-0.5 w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-100">Auto-Link Engineering Deliverables</span>
                        <span className="text-[11px] text-zinc-400">
                          Require at least 1 linked sprint deliverable before moving to Contract &amp; Legal.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Right Section (35%): Edit Pipeline Stage Drawer */}
              <aside className="w-[35%] bg-[#121214] border border-[#27272a] rounded-[6px] flex flex-col h-fit sticky top-20 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#27272a] bg-[#18181b] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span className="font-semibold text-xs text-zinc-100 font-headline">Edit Pipeline Stage</span>
                  </div>
                  <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-[6px] font-semibold">
                    {drawerStageName}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-4 text-xs">
                  {/* Stage Name */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Stage Name</span>
                      <span>Max 40 chars</span>
                    </label>
                    <input
                      type="text"
                      value={drawerStageName}
                      onChange={(e) => setDrawerStageName(e.target.value)}
                      className="h-9 px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Stage Color Token */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-zinc-400 font-medium">Stage Color Token</label>
                    <div className="flex items-center gap-2 p-2 bg-[#18181b] border border-[#27272a] rounded-[6px]">
                      {colorPresets.map((cp) => (
                        <button
                          key={cp.hex}
                          type="button"
                          onClick={() => setDrawerStageColor(cp.hex)}
                          className={`w-6 h-6 rounded-[6px] transition-all flex items-center justify-center text-white cursor-pointer ${
                            drawerStageColor.toLowerCase() === cp.hex.toLowerCase()
                              ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-zinc-900 scale-105'
                              : 'hover:opacity-80'
                          }`}
                          style={{ backgroundColor: cp.hex }}
                        >
                          {drawerStageColor.toLowerCase() === cp.hex.toLowerCase() && (
                            <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                          )}
                        </button>
                      ))}
                      <div className="h-4 w-px bg-zinc-800 mx-1"></div>
                      <span className="font-mono text-[11px] text-orange-400 font-semibold">{drawerStageColor}</span>
                    </div>
                  </div>

                  {/* Win Probability Slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-zinc-400 font-medium">Win Probability Default</span>
                      <span className="font-bold text-orange-400 bg-orange-950/40 border border-orange-500/20 px-2 py-0.5 rounded-[6px]">
                        {drawerStageProb}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={drawerStageProb}
                        onChange={(e) => setDrawerStageProb(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-orange-500"
                      />
                      <input
                        type="text"
                        value={`${drawerStageProb}%`}
                        onChange={(e) => {
                          const val = Number(e.target.value.replace('%', ''));
                          if (!isNaN(val)) setDrawerStageProb(val);
                        }}
                        className="w-16 h-8 text-center bg-[#18181b] border border-[#27272a] rounded-[6px] font-mono text-xs font-semibold text-zinc-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Velocity Limit */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-zinc-400 font-medium">
                      Target Velocity / Days in Stage Limit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={drawerStageLimit}
                        onChange={(e) => setDrawerStageLimit(Number(e.target.value))}
                        className="w-full h-9 px-3 pr-16 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500">
                        days limit
                      </span>
                    </div>
                  </div>

                  {/* Required Gate Checklist */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#27272a]">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[10px] font-semibold text-zinc-200 uppercase">
                        Required Gate Checklist ({drawerGates.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingGate(!isAddingGate)}
                        className="font-mono text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5 font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isAddingGate ? 'close' : 'add'}
                        </span>
                        <span>{isAddingGate ? 'Cancel' : 'Add Gate'}</span>
                      </button>
                    </div>

                    {isAddingGate && (
                      <div className="flex items-center gap-1.5 p-1.5 bg-[#18181b] border border-[#27272a] rounded-[6px]">
                        <input
                          type="text"
                          value={newGateText}
                          onChange={(e) => setNewGateText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddGate();
                            }
                          }}
                          placeholder="e.g. Legal signoff received"
                          className="flex-1 h-7 px-2 text-xs bg-[#121214] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddGate}
                          className="h-7 px-2.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 bg-[#18181b] border border-[#27272a] rounded-[6px] p-2">
                      {drawerGates.map((gate) => (
                        <label
                          key={gate.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-[#121214] rounded-[6px] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={gate.checked}
                            onChange={() => handleToggleGate(gate.id)}
                            className="w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                          />
                          <span
                            className={`text-xs ${
                              gate.checked ? 'text-zinc-100 font-medium' : 'text-zinc-400'
                            }`}
                          >
                            {gate.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Webhook Toggle */}
                  <div className="pt-2 border-t border-[#27272a]">
                    <div className="flex items-start gap-2.5 p-2.5 bg-[#18181b] border border-[#27272a] rounded-[6px]">
                      <input
                        type="checkbox"
                        checked={drawerWebhook}
                        onChange={(e) => setDrawerWebhook(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
                      />
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-zinc-100">Automation Webhook</span>
                        <span className="text-[11px] text-zinc-500">
                          Notify deal room Slack channel when ARR exceeds $50k upon moving into this stage.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drawer Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
                    <button
                      onClick={() => handleSelectEditingStage(activeEditingStage)}
                      className="h-8 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveStageDrawer}
                      className="h-8 px-3.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      <span>Save Stage</span>
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="p-8 text-center text-xs text-zinc-400 bg-[#121214] border border-[#27272a] rounded-[6px]">
              <span className="material-symbols-outlined text-3xl text-orange-400 mb-2">view_column</span>
              <p className="font-semibold text-sm text-zinc-100 font-headline">Deal Fields &amp; Schema Properties</p>
              <p className="mt-1">12 custom deal attributes configured for Enterprise deals.</p>
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="p-8 text-center text-xs text-zinc-400 bg-[#121214] border border-[#27272a] rounded-[6px]">
              <span className="material-symbols-outlined text-3xl text-orange-400 mb-2">bolt</span>
              <p className="font-semibold text-sm text-zinc-100 font-headline">Automations &amp; SLA Hooks</p>
              <p className="mt-1">Slack deal room notification hooks &amp; webhook event triggers active.</p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="p-8 text-center text-xs text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-[6px]">
              <span className="material-symbols-outlined text-3xl text-rose-500 mb-2">warning</span>
              <p className="font-semibold text-sm text-rose-300 font-headline">Danger Zone</p>
              <p className="mt-1 text-rose-400/80">Purge deals or delete pipeline. This requires workspace admin approval.</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Save Dock (Bottom Global Bar) */}
      {hasUnsavedChanges && (
        <aside
          aria-label="Unsaved Changes Notification"
          className="fixed bottom-4 left-[300px] right-6 z-40 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl px-5 py-3 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <span className="material-symbols-outlined text-[18px]">notification_important</span>
            </div>
            <div className="flex flex-col text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100 font-headline">Unsaved adjustments in Pipeline Settings</span>
                <span className="font-mono text-[9px] uppercase font-bold text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.2 rounded-[6px]">
                  Pending Sync
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Unsaved adjustments to pipeline configuration affect sales team members and deal forecasts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setLocalSettings(settings);
                setLocalStages(stages);
                setHasUnsavedChanges(false);
              }}
              className="h-8 px-3.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-[#27272a]"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveAll}
              className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Changes</span>
              <kbd className="font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded ml-1">⌘S</kbd>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
