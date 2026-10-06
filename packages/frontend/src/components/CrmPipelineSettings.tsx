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
  const [drawerStageColor, setDrawerStageColor] = useState(activeEditingStage?.color || '#9900c2');
  const [drawerStageProb, setDrawerStageProb] = useState(activeEditingStage?.winProbability || 60);
  const [drawerStageLimit, setDrawerStageLimit] = useState(activeEditingStage?.daysLimit || 14);
  const [drawerGates, setDrawerGates] = useState(activeEditingStage?.requiredGates || []);
  const [drawerWebhook, setDrawerWebhook] = useState<boolean>(activeEditingStage?.webhookEnabled ?? true);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [stageFilter, setStageFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [stageSearch, setStageSearch] = useState('');

  const colorPresets = [
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Executive Violet', hex: '#9900c2' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Rose', hex: '#EF4444' },
    { name: 'Slate', hex: '#64748B' },
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
    alert(`Stage "${drawerStageName}" updated locally. Press "Save Changes" to commit.`);
  };

  const handleToggleGate = (gateId: string) => {
    setDrawerGates((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, checked: !g.checked } : g))
    );
    setHasUnsavedChanges(true);
  };

  const handleAddGate = () => {
    const gatePrompt = prompt('Enter requirement gate description:');
    if (!gatePrompt) return;
    const newG = { id: `g-${Date.now()}`, text: gatePrompt.trim(), checked: false };
    setDrawerGates([...drawerGates, newG]);
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    onUpdateSettings(localSettings);
    onUpdateStages(localStages);
    setHasUnsavedChanges(false);
    alert('Pipeline configuration synchronized across all active replica nodes.');
  };

  const filteredStages = localStages.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(stageSearch.toLowerCase());
    if (stageFilter === 'open') return matchesSearch && !s.isTerminal;
    if (stageFilter === 'closed') return matchesSearch && s.isTerminal;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white select-none">
      {/* Top Breadcrumb & App Bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#d4c0d5]/30 h-14 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#1a1b22]">Backnode</span>
          <span className="text-[#837284]">/</span>
          <span className="text-[#504252]">Pipeline CRM</span>
          <span className="text-[#837284]">/</span>
          <span className="text-[#504252]">{pipeline?.name || localSettings.name}</span>
          <span className="text-[#837284]">/</span>
          <span className="text-[#9900c2] font-semibold bg-[#f4f2fd] px-2 py-0.5 rounded border border-[#9900c2]/20">
            Pipeline Settings
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoard}
            className="h-8 px-3 rounded-lg bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#1a1b22] border border-[#d4c0d5]/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Back to Deals Board</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="h-8 px-3.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
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
          <section className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f4f2fd] text-[#9900c2] font-mono text-[10px] font-semibold rounded border border-[#9900c2]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9900c2]"></span>
                    PIPELINE CONFIGURATION NODE • ID: {localSettings.code}
                  </span>
                  <span className="font-mono text-[11px] text-[#837284] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">history</span>
                    Last sync 18s ago
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#1a1b22] tracking-tight mt-0.5">
                  CRM Pipeline Settings: {localSettings.name}
                </h1>
                <p className="text-xs text-[#504252] max-w-3xl">
                  {localSettings.description}
                </p>
              </div>

              {/* Quick Telemetry Micro-Cards */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 flex flex-col">
                  <span className="font-mono text-[10px] text-[#837284] uppercase">Active Deals</span>
                  <span className="text-sm font-bold text-[#1a1b22]">42 Contracts</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 flex flex-col">
                  <span className="font-mono text-[10px] text-[#837284] uppercase">Pipeline ARR</span>
                  <span className="text-sm font-bold text-[#9900c2] font-mono">$4.82M USD</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 flex flex-col">
                  <span className="font-mono text-[10px] text-[#837284] uppercase">Lock State</span>
                  <span className="text-xs font-semibold text-[#835000] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lock_open</span>
                    Unlocked
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Strip */}
            <div className="mt-5 pt-3 border-t border-[#d4c0d5]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-nowrap">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'general'
                      ? 'bg-[#9900c2] text-white shadow-sm'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>General</span>
                </button>

                <button
                  onClick={() => setActiveTab('stages')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'stages'
                      ? 'bg-[#9900c2] text-white shadow-sm'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">alt_route</span>
                  <span>Stages &amp; Lifecycle</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      activeTab === 'stages'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#eeedf7] text-[#504252]'
                    }`}
                  >
                    5 stages
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('fields')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'fields'
                      ? 'bg-[#9900c2] text-white shadow-sm'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_column</span>
                  <span>Deal Fields &amp; Custom Properties</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#eeedf7] text-[#504252]">
                    12 fields
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('automations')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'automations'
                      ? 'bg-[#9900c2] text-white shadow-sm'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Automations &amp; SLA Hooks</span>
                </button>

                <button
                  onClick={() => setActiveTab('danger')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-rose-600 hover:bg-rose-50 transition-colors ml-2 whitespace-nowrap shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Danger Zone</span>
                </button>
              </div>

              <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-[#837284]">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Changes propagate instantly across SQLite replica clusters</span>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* TAB 1: GENERAL (Matches HTML 3)                                */}
          {/* ============================================================== */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column (8 Cols) */}
              <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                {/* Card 1: Pipeline Identity & Commercial Scope */}
                <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-6 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#f4f2fd] flex items-center justify-center text-[#9900c2]">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-[#1a1b22]">
                          Pipeline Identity &amp; Commercial Scope
                        </h2>
                        <p className="text-xs text-[#504252]">
                          Core identification tags, localized nomenclature, and interface colorway.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#eeedf7] text-[#504252]">
                      Core Metadata
                    </span>
                  </div>

                  {/* Pipeline Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-[#1a1b22]">
                        Pipeline Name <span className="text-rose-600">*</span>
                      </label>
                      <span className="font-mono text-[10px] text-[#837284]">
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
                        className="w-full h-9 px-3 bg-white text-xs border border-[#d4c0d5] rounded-lg focus:outline-none focus:border-[#9900c2]"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9900c2]">
                        verified
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1a1b22]">
                      Description &amp; Commercial Scope
                    </label>
                    <textarea
                      rows={3}
                      value={localSettings.description}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, description: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full p-2.5 bg-white text-xs border border-[#d4c0d5] rounded-lg focus:outline-none focus:border-[#9900c2] resize-none"
                    />
                  </div>

                  {/* Color Swatch & Accent System */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-[#1a1b22]">
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
                            className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center text-white ${
                              localSettings.accentColor.toLowerCase() === cp.hex.toLowerCase()
                                ? 'ring-2 ring-[#9900c2] ring-offset-2'
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
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#837284]">
                            #
                          </span>
                          <input
                            type="text"
                            value={localSettings.accentColor.replace('#', '')}
                            onChange={(e) => {
                              setLocalSettings({ ...localSettings, accentColor: `#${e.target.value}` });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full h-8 pl-6 pr-2 bg-[#f4f2fd]/60 font-mono text-xs uppercase border border-[#d4c0d5] rounded-lg focus:outline-none focus:border-[#9900c2]"
                          />
                        </div>
                        <span className="text-xs text-[#837284]">Executive Violet</span>
                      </div>
                    </div>

                    {/* Badge Icon Picker */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-[#1a1b22]">
                        Interface Badge Icon
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {['monetization_on', 'trending_up', 'handshake', 'domain', 'business', 'verified'].map(
                          (ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => {
                                setLocalSettings({ ...localSettings, icon: ic });
                                setHasUnsavedChanges(true);
                              }}
                              className={`h-8 rounded-lg border flex items-center justify-center transition-all ${
                                localSettings.icon === ic
                                  ? 'border-[#9900c2] bg-[#fbd7ff]/40 text-[#9900c2]'
                                  : 'border-[#d4c0d5]/60 hover:border-[#837284] text-[#504252]'
                              }`}
                              title={ic}
                            >
                              <span className="material-symbols-outlined text-[17px]">{ic}</span>
                            </button>
                          )
                        )}
                      </div>
                      <span className="text-[11px] text-[#837284]">
                        Rendered next to pipeline headers &amp; kanban stage breadcrumbs.
                      </span>
                    </div>
                  </div>

                  {/* Currency & Display Format */}
                  <div className="pt-3 border-t border-[#d4c0d5]/30 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1a1b22]">
                        Base Commercial Currency
                      </label>
                      <select
                        value={localSettings.currency}
                        onChange={(e) => {
                          setLocalSettings({ ...localSettings, currency: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="h-9 px-3 bg-white border border-[#d4c0d5] rounded-lg text-xs"
                      >
                        <option>USD ($) - United States Dollar</option>
                        <option>EUR (€) - European Euro</option>
                        <option>GBP (£) - British Pound Sterling</option>
                        <option>JPY (¥) - Japanese Yen</option>
                        <option>CHF (Fr) - Swiss Franc</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1a1b22]">Number Notation Format</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                            localSettings.formatNotation === 'Compact'
                              ? 'border-[#9900c2] bg-[#fbd7ff]/20'
                              : 'border-[#d4c0d5]'
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
                            className="text-[#9900c2] focus:ring-[#9900c2]"
                          />
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-[#1a1b22]">Compact</span>
                            <span className="font-mono text-[10px] text-[#837284]">$540k ARR</span>
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                            localSettings.formatNotation === 'Standard'
                              ? 'border-[#9900c2] bg-[#fbd7ff]/20'
                              : 'border-[#d4c0d5]'
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
                            className="text-[#9900c2] focus:ring-[#9900c2]"
                          />
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-[#1a1b22]">Standard</span>
                            <span className="font-mono text-[10px] text-[#837284]">$540,000.00</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Default Forecasting & Quota Defaults */}
                <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-6 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#f4f2fd] flex items-center justify-center text-[#9900c2]">
                        <span className="material-symbols-outlined text-[18px]">query_stats</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-[#1a1b22]">
                          Default Forecasting &amp; Quota Defaults
                        </h2>
                        <p className="text-xs text-[#504252]">
                          Configure velocity parameters, stage weight formulas, and target revenue gates.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#eeedf7] text-[#504252]">
                      Revenue Intelligence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1a1b22]">
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
                          className="w-full h-9 px-3 pr-14 border border-[#d4c0d5] rounded-lg text-xs"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#837284]">
                          days
                        </span>
                      </div>
                      <span className="text-[11px] text-[#837284]">
                        Triggers SLA amber indicators when opportunity age exceeds this baseline.
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1a1b22]">
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
                        className="h-9 px-3 bg-white border border-[#d4c0d5] rounded-lg text-xs"
                      >
                        <option>Dynamic Stage Weighting (Deterministic)</option>
                        <option>Manual Sales Rep Override</option>
                        <option>Machine-Learned Historical Regression</option>
                      </select>
                      <span className="text-[11px] text-[#837284]">
                        Derives forecast values by multiplying pipeline values with stage confidence %.
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1a1b22]">
                        Quarterly Target Revenue (Q4 2026)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#837284]">
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
                          className="w-full h-9 pl-7 pr-12 border border-[#d4c0d5] rounded-lg font-mono text-xs font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#837284]">
                          USD
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1a1b22]">
                        Minimum Deal Value Gate (ARR Threshold)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#837284]">
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
                          className="w-full h-9 pl-7 pr-12 border border-[#d4c0d5] rounded-lg font-mono text-xs font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#837284]">
                          USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Default Layout & Deal Card Display */}
                <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-6 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#f4f2fd] flex items-center justify-center text-[#9900c2]">
                        <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-[#1a1b22]">
                          Default Layout &amp; Deal Card Display
                        </h2>
                        <p className="text-xs text-[#504252]">
                          Default starting view and surface density for team members accessing this pipeline.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#eeedf7] text-[#504252]">
                      Interface Preferences
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#1a1b22]">
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
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-2 border-[#9900c2] bg-[#f4f2fd] shadow-sm'
                                : 'border-[#d4c0d5]/50 bg-white hover:border-[#837284]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  isSelected ? 'text-[#9900c2]' : 'text-[#837284]'
                                }`}
                              >
                                {mode.icon}
                              </span>
                              {isSelected ? (
                                <span className="w-4 h-4 rounded-full bg-[#9900c2] text-white flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[11px]">check</span>
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-[#d4c0d5]"></span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-xs text-[#1a1b22]">{mode.id}</h3>
                              <p className="font-mono text-[10px] text-[#837284] leading-tight mt-0.5">
                                {mode.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Visual Toggles */}
                  <div className="pt-3 border-t border-[#d4c0d5]/30 flex flex-col gap-3">
                    <label className="text-xs font-semibold text-[#1a1b22]">
                      Deal Card Visual Properties (Kanban)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#d4c0d5]/60 bg-white cursor-pointer">
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
                          className="rounded mt-0.5 text-[#9900c2] focus:ring-[#9900c2]"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-[#1a1b22]">Display Deal Age</span>
                          <span className="text-[11px] text-[#837284]">
                            Flags deals in stage &gt; 30 days
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#d4c0d5]/60 bg-white cursor-pointer">
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
                          className="rounded mt-0.5 text-[#9900c2] focus:ring-[#9900c2]"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-[#1a1b22]">Primary Contact Avatar</span>
                          <span className="text-[11px] text-[#837284]">
                            Shows champion &amp; buyer chips
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#d4c0d5]/60 bg-white cursor-pointer">
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
                          className="rounded mt-0.5 text-[#9900c2] focus:ring-[#9900c2]"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-[#1a1b22]">Next Milestone Pill</span>
                          <span className="text-[11px] text-[#837284]">
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
                <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 flex flex-col gap-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#9900c2] text-[20px]">
                        admin_panel_settings
                      </span>
                      <h3 className="font-semibold text-xs text-[#1a1b22]">Team Governance</h3>
                    </div>
                    <span className="font-mono text-[10px] text-[#9900c2] font-bold">6 Members</span>
                  </div>
                  <p className="text-xs text-[#504252]">
                    The following operators hold write authority over deals in this pipeline.
                  </p>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f2fd]/50 border border-[#d4c0d5]/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-[#9900c2] text-white font-mono font-bold text-[10px] flex items-center justify-center">
                          OP
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#1a1b22]">Operator Prime (You)</span>
                          <span className="font-mono text-[10px] text-[#837284]">
                            Pipeline Owner • Admin
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-[#9900c2]">
                        verified_user
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#f4f2fd]/50 border border-[#d4c0d5]/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-[#e4e1e6] text-[#1b1b1e] font-mono font-bold text-[10px] flex items-center justify-center">
                          SL
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#1a1b22]">Sarah Lin</span>
                          <span className="font-mono text-[10px] text-[#837284]">
                            Commercial Lead • Write
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[#837284]">RevOps</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Manage pipeline operator roles modal.')}
                    className="w-full py-2 bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#9900c2] text-xs font-semibold rounded-lg border border-[#d4c0d5]/40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">group_add</span>
                    <span>Manage Pipeline Roles</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 flex flex-col gap-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#9900c2] text-[20px]">
                        database
                      </span>
                      <h3 className="font-semibold text-xs text-[#1a1b22]">Local SQLite Engine</h3>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#663e00] bg-[#ffddba] px-2 py-0.5 rounded border border-[#a56600]/20">
                      LOCAL-FIRST
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-[#d4c0d5]/20">
                      <span className="text-[#837284]">Engine Shard</span>
                      <span className="font-semibold text-[#1a1b22]">crm_deals_2026.sqlite3</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#d4c0d5]/20">
                      <span className="text-[#837284]">Schema Version</span>
                      <span className="font-semibold text-[#1a1b22]">v14.8-strict</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#d4c0d5]/20">
                      <span className="text-[#837284]">Write Latency</span>
                      <span className="font-semibold text-[#9900c2]">0.42 ms (In-Memory WAL)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#837284]">CRDT Vector Clock</span>
                      <span className="font-semibold text-[#1a1b22]">node-alpha #88,102</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: STAGES & LIFECYCLE (Matches HTML 4)                     */}
          {/* ============================================================== */}
          {activeTab === 'stages' && (
            <div className="flex gap-6 items-start">
              {/* Left Section (65%) */}
              <section className="w-[65%] flex flex-col gap-4">
                {/* Architecture Callout */}
                <div className="bg-[#f4f2fd] border border-[#d4c0d5]/40 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#9900c2]/10 text-[#9900c2] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1a1b22]">
                        Stage Pipeline Architecture
                      </span>
                      <span className="font-mono text-[9px] bg-[#eeedf7] text-[#504252] px-1.5 py-0.2 rounded">
                        System Rule
                      </span>
                    </div>
                    <p className="text-xs text-[#504252] mt-0.5">
                      Drag handles to reorder pipeline stages in Kanban and Forecast views. Deals in active stages require migration before stage deletion.
                    </p>
                  </div>
                </div>

                {/* Filter & Add Stage Action Bar */}
                <div className="flex items-center justify-between gap-4 bg-white p-2.5 border border-[#d4c0d5]/30 rounded-xl">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-60">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#837284] text-[15px]">
                        filter_list
                      </span>
                      <input
                        type="text"
                        value={stageSearch}
                        onChange={(e) => setStageSearch(e.target.value)}
                        placeholder="Search stages..."
                        className="w-full h-8 pl-8 pr-3 bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-lg text-xs text-[#1a1b22] placeholder:text-[#837284] focus:outline-none focus:border-[#9900c2]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <button
                        onClick={() => setStageFilter('all')}
                        className={`h-7 px-2.5 rounded font-semibold transition-colors ${
                          stageFilter === 'all'
                            ? 'bg-[#eeedf7] text-[#9900c2]'
                            : 'text-[#504252] hover:bg-[#f4f2fd]'
                        }`}
                      >
                        All ({localStages.length})
                      </button>
                      <button
                        onClick={() => setStageFilter('open')}
                        className={`h-7 px-2.5 rounded font-semibold transition-colors ${
                          stageFilter === 'open'
                            ? 'bg-[#eeedf7] text-[#9900c2]'
                            : 'text-[#504252] hover:bg-[#f4f2fd]'
                        }`}
                      >
                        Open Pipeline ({localStages.filter((s) => !s.isTerminal).length})
                      </button>
                      <button
                        onClick={() => setStageFilter('closed')}
                        className={`h-7 px-2.5 rounded font-semibold transition-colors ${
                          stageFilter === 'closed'
                            ? 'bg-[#eeedf7] text-[#9900c2]'
                            : 'text-[#504252] hover:bg-[#f4f2fd]'
                        }`}
                      >
                        Closed Won/Lost ({localStages.filter((s) => s.isTerminal).length})
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const name = prompt('New Stage Name:');
                      if (!name) return;
                      const newSt: CrmStageDefinition = {
                        id: `stage-${Date.now()}`,
                        order: localStages.length + 1,
                        name: name.trim(),
                        description: 'Custom CRM validation stage',
                        color: '#8B5CF6',
                        winProbability: 50,
                        daysLimit: 14,
                        activeDealsCount: 0,
                        pipelineArr: 0,
                        requiredGates: [],
                        webhookEnabled: false,
                        webhookThreshold: 50000,
                      };
                      setLocalStages([...localStages, newSt]);
                      setHasUnsavedChanges(true);
                    }}
                    className="h-8 px-3.5 bg-[#f4f2fd] hover:bg-[#eeedf7] text-[#1a1b22] text-xs font-semibold border border-[#d4c0d5]/40 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#9900c2]">add</span>
                    <span>+ Add New Stage</span>
                  </button>
                </div>

                {/* Stages Table */}
                <div className="bg-white border border-[#d4c0d5]/30 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f4f2fd] border-b border-[#d4c0d5]/30 font-mono text-[10px] text-[#837284] uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">Order</th>
                        <th className="py-2.5 px-3">Stage Name &amp; Description</th>
                        <th className="py-2.5 px-3 w-28 text-right">Default Win %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Active Deals</th>
                        <th className="py-2.5 px-3 w-32 text-right">Pipeline ARR</th>
                        <th className="py-2.5 px-3 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4c0d5]/20">
                      {filteredStages.map((st, idx) => {
                        const isSelected = st.id === editingStageId;

                        return (
                          <tr
                            key={st.id}
                            onClick={() => handleSelectEditingStage(st)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#f4f2fd]/80 border-l-4 border-l-[#9900c2]'
                                : 'hover:bg-[#f4f2fd]/40'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <div className="cursor-grab text-[#837284] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">
                                  drag_indicator
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-start gap-2.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-4 ring-black/5"
                                  style={{ backgroundColor: st.color }}
                                ></span>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-semibold text-xs ${
                                        isSelected ? 'text-[#9900c2]' : 'text-[#1a1b22]'
                                      }`}
                                    >
                                      {st.name}
                                    </span>
                                    <span className="font-mono text-[9px] text-[#837284] border border-[#d4c0d5]/40 px-1 rounded">
                                      {st.isTerminal ? 'TERMINAL' : `STAGE 0${idx + 1}`}
                                    </span>
                                    {isSelected && (
                                      <span className="font-mono text-[9px] bg-[#9900c2]/10 text-[#9900c2] border border-[#9900c2]/20 px-1 rounded font-semibold">
                                        EDITING
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[#504252] truncate">
                                    {st.description}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-[11px]">
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-[#9900c2]/10 text-[#9900c2] font-semibold'
                                    : 'bg-[#eeedf7] text-[#1a1b22]'
                                }`}
                              >
                                {st.winProbability}%
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-[11px] text-[#1a1b22]">
                              {st.activeDealsCount} deals
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-xs font-bold text-[#1a1b22]">
                              ${st.pipelineArr.toLocaleString()}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectEditingStage(st);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    isSelected
                                      ? 'bg-[#9900c2] text-white shadow-xs'
                                      : 'hover:bg-[#eeedf7] text-[#837284]'
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
                <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#d4c0d5]/20 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#9900c2] text-[18px]">
                        security
                      </span>
                      <span className="font-semibold text-xs text-[#1a1b22]">
                        Stage Governance &amp; Guardrails
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#837284] uppercase">
                      Policy Engine v1.2
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#f4f2fd]/50 cursor-pointer">
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
                        className="mt-0.5 w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2]"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1a1b22]">Strict Forward Motion</span>
                        <span className="text-[11px] text-[#504252]">
                          Disallow skipping stages without executive override. Deals must traverse through each validation gate.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#f4f2fd]/50 cursor-pointer">
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
                        className="mt-0.5 w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2]"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1a1b22]">Mandatory Stalled Deal Alert</span>
                        <span className="text-[11px] text-[#504252]">
                          Flag deals inactive for &gt; 14 days in any active stage and notify the lead deal owner and workspace admin.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#f4f2fd]/50 cursor-pointer">
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
                        className="mt-0.5 w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2]"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1a1b22]">Auto-Link Engineering Deliverables</span>
                        <span className="text-[11px] text-[#504252]">
                          Require at least 1 linked sprint deliverable before moving to Contract &amp; Legal.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Right Section (35%): Edit Pipeline Stage Drawer */}
              <aside className="w-[35%] bg-white border border-[#d4c0d5]/40 rounded-xl flex flex-col h-fit sticky top-20 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#d4c0d5]/30 bg-[#f4f2fd]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-[#9900c2]"></span>
                    <span className="font-semibold text-xs text-[#1a1b22]">Edit Pipeline Stage</span>
                  </div>
                  <span className="font-mono text-[10px] bg-[#9900c2]/10 text-[#9900c2] border border-[#9900c2]/20 px-2 py-0.5 rounded font-semibold">
                    {drawerStageName}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-4 text-xs">
                  {/* Stage Name */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-[#837284] font-medium flex items-center justify-between">
                      <span>Stage Name</span>
                      <span>Max 40 chars</span>
                    </label>
                    <input
                      type="text"
                      value={drawerStageName}
                      onChange={(e) => setDrawerStageName(e.target.value)}
                      className="h-9 px-3 bg-[#f4f2fd]/40 border border-[#d4c0d5] rounded-lg text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
                    />
                  </div>

                  {/* Stage Color Token */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-[#837284] font-medium">Stage Color Token</label>
                    <div className="flex items-center gap-2 p-2 bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-lg">
                      {colorPresets.map((cp) => (
                        <button
                          key={cp.hex}
                          type="button"
                          onClick={() => setDrawerStageColor(cp.hex)}
                          className={`w-6 h-6 rounded transition-all flex items-center justify-center text-white ${
                            drawerStageColor.toLowerCase() === cp.hex.toLowerCase()
                              ? 'ring-2 ring-[#9900c2] ring-offset-1 scale-105'
                              : 'hover:opacity-80'
                          }`}
                          style={{ backgroundColor: cp.hex }}
                        >
                          {drawerStageColor.toLowerCase() === cp.hex.toLowerCase() && (
                            <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                          )}
                        </button>
                      ))}
                      <div className="h-4 w-px bg-[#d4c0d5]/50 mx-1"></div>
                      <span className="font-mono text-[11px] text-[#9900c2] font-semibold">{drawerStageColor}</span>
                    </div>
                  </div>

                  {/* Win Probability Slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#837284] font-medium">Win Probability Default</span>
                      <span className="font-bold text-[#9900c2] bg-[#fbd7ff]/40 px-2 py-0.5 rounded">
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
                        className="w-full h-1.5 bg-[#eeedf7] rounded appearance-none cursor-pointer accent-[#9900c2]"
                      />
                      <input
                        type="text"
                        value={`${drawerStageProb}%`}
                        onChange={(e) => {
                          const val = Number(e.target.value.replace('%', ''));
                          if (!isNaN(val)) setDrawerStageProb(val);
                        }}
                        className="w-16 h-8 text-center bg-[#f4f2fd]/40 border border-[#d4c0d5] rounded-lg font-mono text-xs font-semibold text-[#1a1b22]"
                      />
                    </div>
                  </div>

                  {/* Velocity Limit */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-[#837284] font-medium">
                      Target Velocity / Days in Stage Limit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={drawerStageLimit}
                        onChange={(e) => setDrawerStageLimit(Number(e.target.value))}
                        className="w-full h-9 px-3 pr-16 bg-[#f4f2fd]/40 border border-[#d4c0d5] rounded-lg text-xs text-[#1a1b22]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#837284]">
                        days limit
                      </span>
                    </div>
                  </div>

                  {/* Required Gate Checklist */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#d4c0d5]/30">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[10px] font-semibold text-[#1a1b22] uppercase">
                        Required Gate Checklist ({drawerGates.length})
                      </label>
                      <button
                        onClick={handleAddGate}
                        className="font-mono text-[10px] text-[#9900c2] hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <span className="material-symbols-outlined text-[13px]">add</span>
                        <span>Add Gate</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-[#f4f2fd]/40 border border-[#d4c0d5]/40 rounded-lg p-2">
                      {drawerGates.map((gate) => (
                        <label
                          key={gate.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={gate.checked}
                            onChange={() => handleToggleGate(gate.id)}
                            className="w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2]"
                          />
                          <span
                            className={`text-xs ${
                              gate.checked ? 'text-[#1a1b22] font-medium' : 'text-[#504252]'
                            }`}
                          >
                            {gate.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Webhook Toggle */}
                  <div className="pt-2 border-t border-[#d4c0d5]/30">
                    <div className="flex items-start gap-2.5 p-2.5 bg-[#f4f2fd]/60 border border-[#d4c0d5]/30 rounded-lg">
                      <input
                        type="checkbox"
                        checked={drawerWebhook}
                        onChange={(e) => setDrawerWebhook(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2]"
                      />
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-[#1a1b22]">Automation Webhook</span>
                        <span className="text-[11px] text-[#504252]">
                          Notify deal room Slack channel when ARR exceeds $50k upon moving into this stage.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drawer Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d4c0d5]/30">
                    <button
                      onClick={() => handleSelectEditingStage(activeEditingStage)}
                      className="h-8 px-3 rounded-lg border border-[#d4c0d5] text-xs font-medium text-[#1a1b22] hover:bg-[#eeedf7]"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveStageDrawer}
                      className="h-8 px-3.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-[0.98]"
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
            <div className="p-8 text-center text-xs text-[#837284] bg-white border border-[#d4c0d5]/30 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-[#9900c2] mb-2">view_column</span>
              <p className="font-semibold text-sm text-[#1a1b22]">Deal Fields &amp; Schema Properties</p>
              <p className="mt-1">12 custom deal attributes configured for Enterprise deals.</p>
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="p-8 text-center text-xs text-[#837284] bg-white border border-[#d4c0d5]/30 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-[#9900c2] mb-2">bolt</span>
              <p className="font-semibold text-sm text-[#1a1b22]">Automations &amp; SLA Hooks</p>
              <p className="mt-1">Slack deal room notification hooks &amp; CRDT event triggers active.</p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="p-8 text-center text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-rose-600 mb-2">warning</span>
              <p className="font-semibold text-sm text-rose-900">Danger Zone</p>
              <p className="mt-1">Purge deals or delete pipeline. This requires cluster admin approval.</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Save Dock (Bottom Global Bar) */}
      {hasUnsavedChanges && (
        <aside
          aria-label="Unsaved Changes Notification"
          className="fixed bottom-4 left-[300px] right-6 z-40 bg-white/95 backdrop-blur-md rounded-xl border border-[#d4c0d5]/60 shadow-2xl px-5 py-3 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ffddba] text-[#663e00] flex items-center justify-center border border-[#a56600]/30">
              <span className="material-symbols-outlined text-[18px]">notification_important</span>
            </div>
            <div className="flex flex-col text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1a1b22]">Unsaved adjustments in Pipeline Settings</span>
                <span className="font-mono text-[9px] uppercase font-bold text-[#9900c2] bg-[#fbd7ff] px-1.5 py-0.2 rounded">
                  Pending Sync
                </span>
              </div>
              <p className="text-[11px] text-[#504252]">
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
              className="h-8 px-3.5 rounded-lg bg-white hover:bg-[#eeedf7] text-[#1a1b22] text-xs font-semibold border border-[#d4c0d5]"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveAll}
              className="h-8 px-4 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-[0.98]"
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
