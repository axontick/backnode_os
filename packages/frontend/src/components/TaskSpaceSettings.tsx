import React, { useState } from 'react';
import { ListSettings, StatusDefinition } from '../types';

interface TaskSpaceSettingsProps {
  settings: ListSettings;
  statuses: StatusDefinition[];
  onUpdateSettings: (newSettings: ListSettings) => void;
  onUpdateStatuses: (newStatuses: StatusDefinition[]) => void;
  onBackToBoard: () => void;
}

export const TaskSpaceSettings: React.FC<TaskSpaceSettingsProps> = ({
  settings,
  statuses,
  onUpdateSettings,
  onUpdateStatuses,
  onBackToBoard,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'workflow' | 'permissions' | 'automations' | 'danger'>('workflow');
  const [localSettings, setLocalSettings] = useState<ListSettings>(settings);
  const [localStatuses, setLocalStatuses] = useState<StatusDefinition[]>(statuses);

  // Status Drawer state
  const [drawerName, setDrawerName] = useState('Quality Assurance Gate');
  const [drawerColor, setDrawerColor] = useState('#8B5CF6');
  const [drawerStage, setDrawerStage] = useState('In Progress (Active Work)');
  const [drawerWip, setDrawerWip] = useState(3);
  const [drawerPrRequired, setDrawerPrRequired] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [statusSearch, setStatusSearch] = useState('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const colorPresets = [
    { name: 'Slate', hex: '#64748B' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Violet', hex: '#8B5CF6' },
  ];

  const handleSaveAll = () => {
    onUpdateSettings(localSettings);
    onUpdateStatuses(localStatuses);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleAddStatus = () => {
    if (!drawerName.trim()) return;
    const newStatus: StatusDefinition = {
      id: `status-${Date.now()}`,
      order: localStatuses.length + 1,
      name: drawerName.trim(),
      description: 'Custom verification stage',
      color: drawerColor,
      stageMapping: drawerStage.includes('To Do')
        ? 'To Do / Backlog'
        : drawerStage.includes('Complete')
        ? 'Completed / Closed'
        : 'In Progress / Review',
      activeVolume: 0,
      wipLimit: drawerWip,
      requirePrReview: drawerPrRequired,
    };
    const updated = [...localStatuses, newStatus];
    setLocalStatuses(updated);
    onUpdateStatuses(updated);
    setDrawerName('');
    alert(`Status "${newStatus.name}" added to pipeline!`);
  };

  const handleDeleteStatus = (id: string) => {
    const updated = localStatuses.filter((s) => s.id !== id);
    setLocalStatuses(updated);
    onUpdateStatuses(updated);
  };

  const filteredStatuses = localStatuses.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(statusSearch.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && !s.isClosed;
    if (statusFilter === 'closed') return matchesSearch && s.isClosed;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white select-none">
      {/* Settings Sub-Header Bar */}
      <div className="h-12 px-6 border-b border-[#d4c0d5]/30 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#837284]">
          <span>Task Spaces</span>
          <span>/</span>
          <span>Engineering</span>
          <span>/</span>
          <span>{localSettings.name}</span>
          <span>/</span>
          <span className="text-[#9900c2] font-semibold">List Settings</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoard}
            className="h-8 px-3 rounded-lg bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#1a1b22] border border-[#d4c0d5]/40 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Back to Board</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="h-8 px-3.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">check</span>
            <span>{isSavedFeedback ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
          {/* Page Header Band */}
          <div className="flex flex-col gap-1 pb-3 border-b border-[#d4c0d5]/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1a1b22] tracking-tight">
                  Task Space Settings: {localSettings.name}
                </h1>
                <p className="text-xs text-[#504252] mt-0.5">
                  Configure list metadata, access, icon identifiers, and workflow rules.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-[#f4f2fd] text-[#9900c2] border border-[#d4c0d5]/40 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9900c2]"></span>
                  List ID: {localSettings.listId}
                </span>
              </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex items-center gap-6 mt-4 border-b border-[#d4c0d5]/30 text-xs">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-2.5 flex items-center gap-1.5 transition-colors font-medium ${
                  activeTab === 'general'
                    ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                    : 'text-[#504252] hover:text-[#1a1b22]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>General</span>
              </button>

              <button
                onClick={() => setActiveTab('workflow')}
                className={`py-2.5 flex items-center gap-2 transition-colors font-medium ${
                  activeTab === 'workflow'
                    ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                    : 'text-[#504252] hover:text-[#1a1b22]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">rule</span>
                <span>Statuses &amp; Workflow</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#fbd7ff] text-[#330043] border border-[#9900c2]/20 font-semibold">
                  {localStatuses.length} statuses
                </span>
              </button>

              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-2.5 flex items-center gap-1.5 transition-colors font-medium ${
                  activeTab === 'permissions'
                    ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                    : 'text-[#504252] hover:text-[#1a1b22]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>Permissions &amp; Members</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#eeedf7] text-[#504252]">
                  8 seats
                </span>
              </button>

              <button
                onClick={() => setActiveTab('automations')}
                className={`py-2.5 flex items-center gap-1.5 transition-colors font-medium ${
                  activeTab === 'automations'
                    ? 'border-b-2 border-[#9900c2] text-[#9900c2] font-semibold'
                    : 'text-[#504252] hover:text-[#1a1b22]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Automations &amp; Webhooks</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </button>

              <button
                onClick={() => setActiveTab('danger')}
                className="py-2.5 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 ml-auto font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>Danger Zone</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: STATUSES & WORKFLOW (Matches Image 9 & HTML 5)           */}
          {/* ============================================================== */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              {/* Help Callout Banner */}
              <div className="bg-[#f4f2fd] border border-[#d4c0d5]/40 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-1.5 bg-[#9900c2]/10 rounded-lg text-[#9900c2] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-[#1a1b22]">Status Pipeline Architecture</h4>
                    <p className="text-xs text-[#504252] mt-0.5">
                      Drag handles to reorder columns in Kanban and Table views. Statuses with active tasks require reassignment before deletion.
                    </p>
                  </div>
                  <button
                    onClick={() => alert('Lifecycle documentation loaded.')}
                    className="text-xs font-mono text-[#9900c2] hover:underline whitespace-nowrap ml-4 font-medium"
                  >
                    View Docs
                  </button>
                </div>
              </div>

              {/* Primary 2-Column Grid */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Col 8: Status Table */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                  {/* Control Filter & Action Row */}
                  <div className="flex items-center justify-between bg-white border border-[#d4c0d5]/30 rounded-xl p-2.5">
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative w-56">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#837284] text-[15px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={statusSearch}
                          onChange={(e) => setStatusSearch(e.target.value)}
                          placeholder="Search statuses..."
                          className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 text-xs text-[#1a1b22] placeholder:text-[#837284] focus:outline-none focus:border-[#9900c2]"
                        />
                      </div>

                      {/* Filter pills */}
                      <div className="flex items-center bg-[#eeedf7] rounded-lg p-0.5 border border-[#d4c0d5]/30 text-xs">
                        <button
                          onClick={() => setStatusFilter('all')}
                          className={`px-2.5 py-1 rounded font-mono text-[11px] font-medium transition-colors ${
                            statusFilter === 'all'
                              ? 'bg-white text-[#1a1b22] shadow-sm font-semibold'
                              : 'text-[#504252] hover:text-[#1a1b22]'
                          }`}
                        >
                          All ({localStatuses.length})
                        </button>
                        <button
                          onClick={() => setStatusFilter('active')}
                          className={`px-2.5 py-1 rounded font-mono text-[11px] font-medium transition-colors ${
                            statusFilter === 'active'
                              ? 'bg-white text-[#1a1b22] shadow-sm font-semibold'
                              : 'text-[#504252] hover:text-[#1a1b22]'
                          }`}
                        >
                          Active ({localStatuses.filter((s) => !s.isClosed).length})
                        </button>
                        <button
                          onClick={() => setStatusFilter('closed')}
                          className={`px-2.5 py-1 rounded font-mono text-[11px] font-medium transition-colors ${
                            statusFilter === 'closed'
                              ? 'bg-white text-[#1a1b22] shadow-sm font-semibold'
                              : 'text-[#504252] hover:text-[#1a1b22]'
                          }`}
                        >
                          Closed ({localStatuses.filter((s) => s.isClosed).length})
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAddStatus}
                      className="h-8 px-3 bg-[#9900c2] hover:bg-[#b731e0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      <span>Add New Status</span>
                    </button>
                  </div>

                  {/* Status List Table */}
                  <div className="bg-white border border-[#d4c0d5]/30 rounded-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="grid grid-cols-12 px-4 py-2.5 bg-[#f4f2fd] border-b border-[#d4c0d5]/30 font-mono text-[10px] text-[#837284] uppercase tracking-wider">
                      <div className="col-span-1">Order</div>
                      <div className="col-span-4">Status Name &amp; Color</div>
                      <div className="col-span-3">Stage Mapping</div>
                      <div className="col-span-2">Active Volume</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-[#d4c0d5]/20 flex flex-col text-xs">
                      {filteredStatuses.map((st, idx) => (
                        <div
                          key={st.id}
                          className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#f4f2fd]/40 transition-colors group"
                        >
                          {/* Order */}
                          <div className="col-span-1 flex items-center gap-1 text-[#837284] group-hover:text-[#1a1b22] cursor-grab">
                            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                            <span className="font-mono text-[11px]">{idx + 1}</span>
                          </div>

                          {/* Name & Color */}
                          <div className="col-span-4 flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full ring-2 ring-black/5 shrink-0"
                              style={{ backgroundColor: st.color }}
                            ></span>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#1a1b22] truncate">{st.name}</span>
                                {st.isDefault && (
                                  <span className="font-mono text-[9px] bg-[#eeedf7] px-1.5 py-0.2 rounded text-[#504252] border border-[#d4c0d5]/30">
                                    Default
                                  </span>
                                )}
                                {st.isClosed && (
                                  <span className="font-mono text-[9px] bg-[#eeedf7] px-1.5 py-0.2 rounded text-[#504252] border border-[#d4c0d5]/30">
                                    Closed
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-[#837284] truncate">{st.description}</span>
                            </div>
                          </div>

                          {/* Stage Mapping */}
                          <div className="col-span-3">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#eeedf7] text-[#504252] border border-[#d4c0d5]/40">
                              {st.stageMapping}
                            </span>
                          </div>

                          {/* Active Volume */}
                          <div className="col-span-2">
                            <span className="font-mono text-[11px] text-[#1a1b22] font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                              {st.activeVolume} active tasks
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setDrawerName(st.name);
                                setDrawerColor(st.color);
                                alert(`Editing ${st.name} in drawer.`);
                              }}
                              className="p-1 rounded text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7] transition-colors"
                              title="Edit status"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                            <button
                              disabled={st.isDefault || st.isClosed}
                              onClick={() => handleDeleteStatus(st.id)}
                              className={`p-1 rounded transition-colors ${
                                st.isDefault || st.isClosed
                                  ? 'text-[#d4c0d5] cursor-not-allowed'
                                  : 'text-[#837284] hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={st.isDefault || st.isClosed ? 'System default cannot be deleted' : 'Delete status'}
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Table Footer */}
                    <div className="px-4 py-2 bg-[#f4f2fd] border-t border-[#d4c0d5]/30 flex items-center justify-between font-mono text-[10px] text-[#837284]">
                      <span>Total {localStatuses.length} columns configured • 15 tasks mapped</span>
                      <span>All changes sync automatically to active boards</span>
                    </div>
                  </div>

                  {/* Stage Governance & Guardrails */}
                  <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-4 flex flex-col gap-2.5">
                    <h3 className="font-semibold text-xs text-[#1a1b22]">Stage Governance &amp; Guardrails</h3>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="p-3 border border-[#d4c0d5]/40 rounded-xl bg-[#f4f2fd]/40 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1a1b22]">Strict Forward Progress</span>
                          <input
                            type="checkbox"
                            checked={localSettings.strictForwardProgress}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, strictForwardProgress: e.target.checked })
                            }
                            className="rounded text-[#9900c2] focus:ring-[#9900c2] h-4 w-4 cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-[#504252]">
                          Disallow skipping review stages without manager override flag.
                        </p>
                      </div>

                      <div className="p-3 border border-[#d4c0d5]/40 rounded-xl bg-[#f4f2fd]/40 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1a1b22]">Auto-Archive on &ldquo;Done&rdquo;</span>
                          <input
                            type="checkbox"
                            checked={localSettings.autoArchiveDone}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, autoArchiveDone: e.target.checked })
                            }
                            className="rounded text-[#9900c2] focus:ring-[#9900c2] h-4 w-4 cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-[#504252]">
                          Automatically move closed tasks to sprint archive after 14 calendar days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 4: Add / Edit Status Drawer */}
                <div className="col-span-12 lg:col-span-4 bg-white border border-[#d4c0d5]/30 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-[#d4c0d5]/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-[#9900c2]"></span>
                      <h3 className="font-semibold text-xs text-[#1a1b22]">Add / Edit Status Drawer</h3>
                    </div>
                    <span className="font-mono text-[10px] text-[#9900c2] bg-[#9900c2]/10 px-2 py-0.5 rounded font-semibold">
                      Draft
                    </span>
                  </div>

                  <div className="flex flex-col gap-3.5 text-xs">
                    {/* Status Name */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#837284] font-medium">STATUS NAME</label>
                      <input
                        type="text"
                        value={drawerName}
                        onChange={(e) => setDrawerName(e.target.value)}
                        placeholder="e.g. Quality Assurance Gate"
                        className="h-8 px-2.5 rounded-lg border border-[#d4c0d5]/60 bg-[#f4f2fd]/40 text-[#1a1b22] text-xs focus:outline-none focus:border-[#9900c2]"
                      />
                    </div>

                    {/* Color Identifier */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#837284] font-medium">COLOR IDENTIFIER</span>
                        <span className="text-[#504252]">Selected: {drawerColor}</span>
                      </div>

                      <div className="grid grid-cols-8 gap-1.5 py-1">
                        {colorPresets.map((cp) => (
                          <button
                            key={cp.hex}
                            type="button"
                            onClick={() => setDrawerColor(cp.hex)}
                            title={cp.name}
                            className={`h-6 rounded-md transition-all ${
                              drawerColor === cp.hex
                                ? 'ring-2 ring-[#9900c2] ring-offset-1 scale-105'
                                : 'hover:opacity-80'
                            }`}
                            style={{ backgroundColor: cp.hex }}
                          ></button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-6 h-6 rounded-md shrink-0 border border-[#d4c0d5]/50 shadow-xs"
                          style={{ backgroundColor: drawerColor }}
                        ></div>
                        <input
                          type="text"
                          value={drawerColor}
                          onChange={(e) => setDrawerColor(e.target.value)}
                          className="h-7 flex-1 px-2 rounded-lg border border-[#d4c0d5]/50 font-mono text-[11px] text-[#1a1b22] uppercase focus:outline-none focus:border-[#9900c2]"
                        />
                      </div>
                    </div>

                    {/* Stage Mapping */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#837284] font-medium">STAGE MAPPING</label>
                      <select
                        value={drawerStage}
                        onChange={(e) => setDrawerStage(e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-[#d4c0d5]/60 bg-[#f4f2fd]/40 text-[#1a1b22] text-xs focus:outline-none focus:border-[#9900c2]"
                      >
                        <option>To Do (Start Stage)</option>
                        <option>In Progress (Active Work)</option>
                        <option>Complete (Finalized Stage)</option>
                      </select>
                      <span className="text-[11px] text-[#837284]">
                        Maps column positioning for agile burn-down calculations.
                      </span>
                    </div>

                    {/* WIP Concurrency Limit */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#837284] font-medium">WIP CONCURRENCY LIMIT</span>
                        <span className="text-[#9900c2] font-semibold">Enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={drawerWip}
                          onChange={(e) => setDrawerWip(Number(e.target.value))}
                          min={1}
                          max={20}
                          className="w-20 h-8 px-2.5 rounded-lg border border-[#d4c0d5]/60 font-mono text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
                        />
                        <span className="text-[11px] text-[#837284]">tasks max before warning glow</span>
                      </div>
                    </div>

                    {/* Automation Trigger */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#837284] font-medium">AUTOMATION TRIGGER</label>
                      <div className="p-2.5 border border-[#d4c0d5]/40 rounded-lg bg-[#f4f2fd]/40 flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={drawerPrRequired}
                          onChange={(e) => setDrawerPrRequired(e.target.checked)}
                          className="rounded text-[#9900c2] focus:ring-[#9900c2] h-4 w-4 mt-0.5 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#1a1b22]">Require linked PR review</span>
                          <span className="font-mono text-[10px] text-[#837284]">
                            Blocks movement into stage until GitHub PR approval is registered.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Drawer Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d4c0d5]/30">
                      <button
                        onClick={() => {
                          setDrawerName('');
                        }}
                        className="h-8 px-3 rounded-lg bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#1a1b22] text-xs font-medium"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleAddStatus}
                        className="h-8 px-3.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-sm flex items-center gap-1 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[15px]">save</span>
                        <span>Save Status</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: GENERAL (Matches Image 11 & HTML 6)                     */}
          {/* ============================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Section 1: List Identity & Display Card */}
              <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-5 shadow-xs">
                <div className="flex items-start justify-between border-b border-[#d4c0d5]/20 pb-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm text-[#1a1b22]">List Identity &amp; Display</h2>
                    <p className="text-xs text-[#504252]">
                      Primary naming conventions, color tags, and visual emblems across board views.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#f4f2fd] text-[#9900c2] font-semibold">
                    Core Metadata
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Name & Scope */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1a1b22] mb-1">
                        List Name <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={localSettings.name}
                          onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })}
                          className="w-full h-9 px-3 text-xs bg-[#f4f2fd]/40 border border-[#d4c0d5] rounded-lg text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#837284]">
                          {localSettings.name.length}/64 chars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1a1b22] mb-1">
                        Description &amp; Deliverable Scope
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.description}
                        onChange={(e) => setLocalSettings({ ...localSettings, description: e.target.value })}
                        className="w-full p-2.5 text-xs bg-[#f4f2fd]/40 border border-[#d4c0d5] rounded-lg text-[#1a1b22] focus:outline-none focus:border-[#9900c2] resize-none"
                      />
                      <span className="font-mono text-[10px] text-[#837284] block mt-1">
                        Rendered at the header of all sub-views and visible to collaborative engineering groups.
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Visual Swatches & Icon */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1a1b22] mb-1.5">
                        List Color &amp; Accent Swatch
                      </label>
                      <div className="flex items-center flex-wrap gap-2.5">
                        <div className="flex items-center gap-1.5 p-1 bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-lg">
                          {colorPresets.map((cp) => (
                            <button
                              key={cp.hex}
                              type="button"
                              onClick={() => setLocalSettings({ ...localSettings, color: cp.hex })}
                              className={`w-6 h-6 rounded-md transition-all ${
                                localSettings.color.toLowerCase() === cp.hex.toLowerCase()
                                  ? 'ring-2 ring-[#9900c2] scale-105'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: cp.hex }}
                              title={cp.name}
                            ></button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center h-8 px-2 bg-white border border-[#d4c0d5] rounded-lg font-mono text-xs">
                            <span className="text-[#837284] mr-1">#</span>
                            <input
                              type="text"
                              value={localSettings.color.replace('#', '')}
                              onChange={(e) => setLocalSettings({ ...localSettings, color: `#${e.target.value}` })}
                              className="w-16 uppercase bg-transparent border-0 p-0 text-[#1a1b22] focus:ring-0"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f4f2fd] border border-[#d4c0d5]/40 rounded-lg">
                            <span
                              className="w-3.5 h-3.5 rounded"
                              style={{ backgroundColor: localSettings.color }}
                            ></span>
                            <span className="font-mono text-[10px] font-semibold text-[#1a1b22]">Selected</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#d4c0d5]/20">
                      <label className="block text-xs font-medium text-[#1a1b22] mb-1.5">
                        Icon Identifier
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {['terminal', 'folder_open', 'database', 'memory', 'rocket_launch', 'hub'].map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setLocalSettings({ ...localSettings, icon: ic })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              localSettings.icon === ic
                                ? 'bg-[#eeedf7] text-[#9900c2] border border-[#9900c2]/40 shadow-xs'
                                : 'text-[#837284] hover:text-[#1a1b22] hover:bg-[#f4f2fd]'
                            }`}
                            title={ic}
                          >
                            <span className="material-symbols-outlined text-[17px]">{ic}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => alert('Icon picker modal opened (120+ symbols available).')}
                          className="px-2.5 py-1 rounded-lg border border-[#d4c0d5] text-[11px] text-[#504252] hover:bg-[#f4f2fd] transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">apps</span>
                          <span>Browse 120+ symbols...</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Default View & Layout Bento Row (5 Columns) */}
              <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-5 shadow-xs">
                <div className="flex items-start justify-between border-b border-[#d4c0d5]/20 pb-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm text-[#1a1b22]">Default View &amp; Layout</h2>
                    <p className="text-xs text-[#504252]">
                      Default rendering canvas when collaborators open this workspace list.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#f4f2fd] text-[#504252] font-medium">
                    Interface Preferences
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5">
                  {(
                    [
                      { id: 'Board', icon: 'view_kanban', desc: 'Kanban stages' },
                      { id: 'Spreadsheet', icon: 'table_rows', desc: 'Dense grid' },
                      { id: 'Standard List', icon: 'format_list_bulleted', desc: 'Hierarchical' },
                      { id: 'Timeline', icon: 'waterfall_chart', desc: 'Gantt cycles' },
                      { id: 'Calendar', icon: 'calendar_month', desc: 'Due dates' },
                    ] as const
                  ).map((layout) => {
                    const isSelected = localSettings.defaultView === layout.id;

                    return (
                      <div
                        key={layout.id}
                        onClick={() => setLocalSettings({ ...localSettings, defaultView: layout.id })}
                        className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between h-28 transition-all ${
                          isSelected
                            ? 'border-2 border-[#9900c2] bg-[#f4f2fd] shadow-sm'
                            : 'border border-[#d4c0d5]/50 bg-white hover:bg-[#f4f2fd]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`material-symbols-outlined text-[22px] ${
                              isSelected ? 'text-[#9900c2]' : 'text-[#837284]'
                            }`}
                          >
                            {layout.icon}
                          </span>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#9900c2] ring-4 ring-[#9900c2]/20"></span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#1a1b22] block">{layout.id}</span>
                          <span className="font-mono text-[10px] text-[#837284]">{layout.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-[#d4c0d5]/20">
                  <div>
                    <label className="block text-xs font-medium text-[#1a1b22] mb-1">
                      Default Task Priority
                    </label>
                    <select
                      value={localSettings.defaultPriority}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          defaultPriority: e.target.value as ListSettings['defaultPriority'],
                        })
                      }
                      className="w-full h-9 px-3 text-xs bg-[#f4f2fd]/40 border border-[#d4c0d5] rounded-lg text-[#1a1b22] focus:outline-none focus:border-[#9900c2]"
                    >
                      <option>P0 - Critical Blocker</option>
                      <option>P1 - High Priority</option>
                      <option>P2 - Medium (Normal)</option>
                      <option>P3 - Low / Nice to Have</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1a1b22] mb-1">
                      Estimation Metric Unit
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-9 p-0.5 bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, estimationUnit: 'Story Points' })}
                        className={`text-xs rounded font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          localSettings.estimationUnit === 'Story Points'
                            ? 'bg-white text-[#9900c2] shadow-sm font-semibold'
                            : 'text-[#504252] hover:text-[#1a1b22]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">straighten</span>
                        <span>Story Points</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, estimationUnit: 'Engineering Hours' })}
                        className={`text-xs rounded font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          localSettings.estimationUnit === 'Engineering Hours'
                            ? 'bg-white text-[#9900c2] shadow-sm font-semibold'
                            : 'text-[#504252] hover:text-[#1a1b22]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>Engineering Hours</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Sync & Retention Policy */}
              <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-5 shadow-xs">
                <div className="flex items-start justify-between border-b border-[#d4c0d5]/20 pb-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm text-[#1a1b22]">Sync &amp; Retention Policy</h2>
                    <p className="text-xs text-[#504252]">
                      Cluster replication parameters, history purging, and ledger persistency.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#ffddba] text-[#663e00] font-semibold border border-[#a56600]/20">
                    Distributed Storage
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f4f2fd]/40 border border-[#d4c0d5]/30">
                    <div className="pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1a1b22]">Distributed Write Logging</span>
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#ffddba] text-[#663e00] font-semibold">
                          Active RAFT
                        </span>
                      </div>
                      <p className="text-[11px] text-[#504252] mt-0.5">
                        Stream state mutations directly across multi-region distributed nodes with zero data loss recovery.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.distributedWriteLogging}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, distributedWriteLogging: e.target.checked })
                      }
                      className="rounded text-[#9900c2] focus:ring-[#9900c2] h-4 w-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f4f2fd]/40 border border-[#d4c0d5]/30">
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-[#1a1b22] block">
                        Automated Archival of Resolved Items
                      </span>
                      <span className="text-[11px] text-[#504252] mt-0.5 block">
                        Compress and relocate completed items into cold archival storage.
                      </span>
                    </div>
                    <select
                      value={localSettings.autoArchiveDays}
                      onChange={(e) => setLocalSettings({ ...localSettings, autoArchiveDays: e.target.value })}
                      className="h-8 px-2 rounded-lg border border-[#d4c0d5]/60 bg-white text-xs text-[#1a1b22]"
                    >
                      <option>After 7 days</option>
                      <option>After 14 days</option>
                      <option>After 30 days</option>
                      <option>Never (Retain on Board)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="p-8 text-center text-xs text-[#837284] bg-white border border-[#d4c0d5]/30 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-[#9900c2] mb-2">group_add</span>
              <p className="font-semibold text-sm text-[#1a1b22]">Permissions &amp; Member Access</p>
              <p className="mt-1">8 active operator seats assigned across Core Systems and Infrastructure teams.</p>
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="p-8 text-center text-xs text-[#837284] bg-white border border-[#d4c0d5]/30 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-[#9900c2] mb-2">bolt</span>
              <p className="font-semibold text-sm text-[#1a1b22]">Automations &amp; Webhooks</p>
              <p className="mt-1">GitHub PR review synchronization and SQLite CDC replication streams active.</p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="p-8 text-center text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-rose-600 mb-2">warning</span>
              <p className="font-semibold text-sm text-rose-900">Danger Zone</p>
              <p className="mt-1">Archive or purge this task space. This action requires super-admin authentication.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      <footer className="h-14 bg-white/95 backdrop-blur-md border-t border-[#d4c0d5]/30 px-6 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-[#504252]">
          <span className="material-symbols-outlined text-[16px] text-[#835000]">info</span>
          <span>Unsaved adjustments to list configurations affect 14 team collaborators.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLocalSettings(settings);
              setLocalStatuses(statuses);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-[#d4c0d5] text-xs font-medium text-[#1a1b22] hover:bg-[#eeedf7] transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{isSavedFeedback ? 'Changes Saved' : 'Save Changes'}</span>
            <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-white/20 text-white ml-1">⌘S</kbd>
          </button>
        </div>
      </footer>
    </div>
  );
};
