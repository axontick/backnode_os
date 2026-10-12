import React, { useState, useEffect } from 'react';
import { ListSettings, StatusDefinition } from '../types';
import { deduplicateStatuses } from '../context/WorkspaceContext';

interface TaskSpaceSettingsProps {
  settings: ListSettings;
  statuses: StatusDefinition[];
  onUpdateSettings: (newSettings: ListSettings) => void;
  onUpdateStatuses: (newStatuses: StatusDefinition[]) => void;
  onBackToBoard: () => void;
  onDeleteTaskSpace?: (listId: string) => void;
  onRenameStatus?: (oldName: string, newName: string) => void;
}

export const TaskSpaceSettings: React.FC<TaskSpaceSettingsProps> = ({
  settings,
  statuses,
  onUpdateSettings,
  onUpdateStatuses,
  onBackToBoard,
  onDeleteTaskSpace,
  onRenameStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'workflow' | 'danger'>('general');
  const [localSettings, setLocalSettings] = useState<ListSettings>(settings);
  const [localStatuses, setLocalStatuses] = useState<StatusDefinition[]>(() => deduplicateStatuses(statuses));

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLocalStatuses(deduplicateStatuses(statuses));
  }, [statuses]);

  // Status Modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [drawerName, setDrawerName] = useState('');
  const [drawerDescription, setDrawerDescription] = useState('');
  const [drawerColor, setDrawerColor] = useState('#ea580c');
  const [drawerStage, setDrawerStage] = useState('In Progress (Active Work)');
  const [drawerWip, setDrawerWip] = useState(5);
  const [drawerPrRequired, setDrawerPrRequired] = useState(false);
  const [draggedStatusId, setDraggedStatusId] = useState<string | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [statusSearch, setStatusSearch] = useState('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showLifecycleDocs, setShowLifecycleDocs] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);

  const colorPresets = [
    { name: 'Electric Orange', hex: '#ea580c' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Slate', hex: '#64748b' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Pink', hex: '#ec4899' },
  ];

  const handleSaveAll = () => {
    onUpdateSettings(localSettings);
    onUpdateStatuses(localStatuses);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleOpenCreateStatusModal = () => {
    setEditingStatusId(null);
    setDrawerName('');
    setDrawerDescription('');
    setDrawerColor('#ea580c');
    setDrawerStage('In Progress (Active Work)');
    setDrawerWip(5);
    setDrawerPrRequired(false);
    setIsStatusModalOpen(true);
  };

  const handleStartEditStatus = (st: StatusDefinition) => {
    setEditingStatusId(st.id);
    setDrawerName(st.name);
    setDrawerDescription(st.description || '');
    setDrawerColor(st.color);
    setDrawerStage(
      st.stageMapping.includes('Backlog') || st.stageMapping.includes('To Do')
        ? 'To Do (Start Stage)'
        : st.stageMapping.includes('Closed') || st.stageMapping.includes('Complete')
        ? 'Complete (Finalized Stage)'
        : 'In Progress (Active Work)'
    );
    setDrawerWip(st.wipLimit ?? 5);
    setDrawerPrRequired(Boolean(st.requirePrReview));
    setIsStatusModalOpen(true);
  };

  const handleSaveStatusModal = () => {
    const trimmed = drawerName.trim();
    if (!trimmed) return;

    const isDuplicate = localStatuses.some(
      (s) =>
        s.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        s.id !== editingStatusId
    );
    if (isDuplicate) {
      alert(`A status named "${trimmed}" already exists in this space.`);
      return;
    }

    const mappedStage = drawerStage.includes('To Do')
      ? 'To Do / Backlog'
      : drawerStage.includes('Complete')
      ? 'Completed / Closed'
      : 'In Progress / Review';

    if (editingStatusId) {
      const target = localStatuses.find((s) => s.id === editingStatusId);
      if (!target) return;
      const oldName = target.name;

      const updated = localStatuses.map((s) => {
        if (s.id === editingStatusId) {
          return {
            ...s,
            name: trimmed,
            description: drawerDescription.trim() || s.description,
            color: drawerColor,
            stageMapping: mappedStage,
            wipLimit: drawerWip,
            requirePrReview: drawerPrRequired,
          };
        }
        return s;
      });

      setLocalStatuses(updated);
      onUpdateStatuses(updated);

      if (oldName !== trimmed && onRenameStatus) {
        onRenameStatus(oldName, trimmed);
      }
    } else {
      const newStatus: StatusDefinition = {
        id: `status-${Date.now()}`,
        order: localStatuses.length + 1,
        name: trimmed,
        description: drawerDescription.trim() || 'Custom verification stage',
        color: drawerColor,
        stageMapping: mappedStage,
        activeVolume: 0,
        wipLimit: drawerWip,
        requirePrReview: drawerPrRequired,
      };
      const updated = [...localStatuses, newStatus];
      setLocalStatuses(updated);
      onUpdateStatuses(updated);
    }

    setIsStatusModalOpen(false);
    setEditingStatusId(null);
    setDrawerName('');
    setDrawerDescription('');
  };

  const handleDeleteStatus = (id: string) => {
    const updated = localStatuses.filter((s) => s.id !== id);
    setLocalStatuses(updated);
    onUpdateStatuses(updated);
    if (editingStatusId === id) {
      setEditingStatusId(null);
      setDrawerName('');
      setDrawerDescription('');
      setIsStatusModalOpen(false);
    }
  };

  const handleMoveStatus = (fromId: string, toId: string) => {
    const fromIdx = localStatuses.findIndex((s) => s.id === fromId);
    const toIdx = localStatuses.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const reordered = [...localStatuses];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withUpdatedOrder = reordered.map((st, i) => ({ ...st, order: i + 1 }));
    setLocalStatuses(withUpdatedOrder);
    onUpdateStatuses(withUpdatedOrder);
  };

  const handleMoveStatusByIndex = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx >= localStatuses.length || toIdx < 0 || toIdx >= localStatuses.length) return;
    const reordered = [...localStatuses];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withUpdatedOrder = reordered.map((st, i) => ({ ...st, order: i + 1 }));
    setLocalStatuses(withUpdatedOrder);
    onUpdateStatuses(withUpdatedOrder);
  };

  const filteredStatuses = localStatuses.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(statusSearch.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && !s.isClosed;
    if (statusFilter === 'closed') return matchesSearch && s.isClosed;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] text-zinc-100 select-text">
      {/* Settings Sub-Header Bar */}
      <div className="h-12 px-6 border-b border-[#27272a] bg-[#0c0a09] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Task Spaces</span>
          <span>/</span>
          <span>Engineering</span>
          <span>/</span>
          <span>{localSettings.name}</span>
          <span>/</span>
          <span className="font-semibold" style={{ color: localSettings.color || '#ea580c' }}>List Settings</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoard}
            className="h-8 px-3 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Back to Workspace</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="h-8 px-3.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight font-headline">
                  Task Space Settings: {localSettings.name}
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure list metadata, access, icon identifiers, and workflow rules.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[11px] px-2.5 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] font-semibold flex items-center gap-1.5"
                  style={{ color: localSettings.color || '#ea580c' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: localSettings.color || '#ea580c' }}></span>
                  List ID: {localSettings.listId}
                </span>
              </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex items-center gap-6 mt-4 border-b border-[#27272a] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-2.5 -mb-px flex items-center gap-1.5 transition-colors font-medium cursor-pointer border-b-2 ${
                  activeTab === 'general'
                    ? 'border-orange-500 text-orange-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>General</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('workflow')}
                className={`py-2.5 -mb-px flex items-center gap-2 transition-colors font-medium cursor-pointer border-b-2 ${
                  activeTab === 'workflow'
                    ? 'border-orange-500 text-orange-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">rule</span>
                <span>Statuses &amp; Workflow</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#18181b] text-orange-400 border border-[#27272a] font-semibold">
                  {localStatuses.length} statuses
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('danger')}
                className={`py-2.5 -mb-px flex items-center gap-1.5 ml-auto font-medium transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'danger'
                    ? 'border-rose-500 text-rose-400 font-semibold'
                    : 'border-transparent text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>Danger Zone</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: STATUSES & WORKFLOW                                     */}
          {/* ============================================================== */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              {/* Help Callout Banner */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-3.5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-orange-950/40 rounded-[6px] text-orange-400 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-100">Status Pipeline Architecture</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Drag handles to reorder columns in Kanban and Table views. Statuses with active tasks require reassignment before deletion.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLifecycleDocs(!showLifecycleDocs)}
                      className="text-xs font-mono text-orange-400 hover:text-orange-300 whitespace-nowrap ml-4 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showLifecycleDocs ? 'Hide Policies' : 'View Policies'}</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {showLifecycleDocs ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>

                {showLifecycleDocs && (
                  <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-300 space-y-1.5 font-mono text-[11px] animate-in fade-in duration-150">
                    <p className="text-orange-400 font-semibold uppercase tracking-wider text-[10px]">Lifecycle Transition Policies:</p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-400">
                      <li><strong className="text-zinc-200">Strict Forward Progress:</strong> Tasks cannot skip review stages without manager authorization.</li>
                      <li><strong className="text-zinc-200">WIP Enforcement:</strong> Columns exceeding configured WIP limits will highlight with cautionary borders.</li>
                      <li><strong className="text-zinc-200">Terminal Stages:</strong> Moving to &lsquo;Done&rsquo; schedules automated archival after the designated retention period.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Full-Width Status Table & Workflow Controls */}
              <div className="w-full flex flex-col gap-5">
                {/* Control Filter & Action Row */}
                <div className="flex items-center justify-between bg-[#121214] border border-[#27272a] rounded-[6px] p-2.5">
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative w-56">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[15px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={statusSearch}
                        onChange={(e) => setStatusSearch(e.target.value)}
                        placeholder="Search statuses..."
                        className="w-full h-8 pl-8 pr-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center bg-[#18181b] rounded-[6px] p-0.5 border border-[#27272a] text-xs">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-medium transition-colors cursor-pointer ${
                          statusFilter === 'all'
                            ? 'bg-[#121214] text-zinc-100 shadow-sm font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        All ({localStatuses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('active')}
                        className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-medium transition-colors cursor-pointer ${
                          statusFilter === 'active'
                            ? 'bg-[#121214] text-zinc-100 shadow-sm font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Active ({localStatuses.filter((s) => !s.isClosed).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('closed')}
                        className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-medium transition-colors cursor-pointer ${
                          statusFilter === 'closed'
                            ? 'bg-[#121214] text-zinc-100 shadow-sm font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Closed ({localStatuses.filter((s) => s.isClosed).length})
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCreateStatusModal}
                    className="h-8 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Add New Status</span>
                  </button>
                </div>

                {/* Status List Table */}
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] overflow-hidden flex flex-col shadow-sm">
                  {/* Header */}
                  <div className="grid grid-cols-12 px-4 py-2.5 bg-[#18181b] border-b border-[#27272a] font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                    <div className="col-span-2">Order</div>
                    <div className="col-span-4">Status Name &amp; Color</div>
                    <div className="col-span-2">Stage Mapping</div>
                    <div className="col-span-2">WIP Limit</div>
                    <div className="col-span-1">Active Tasks</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-[#27272a] flex flex-col text-xs">
                    {filteredStatuses.map((st, idx) => {
                      const localIdx = localStatuses.findIndex((s) => s.id === st.id);
                      const isDragging = draggedStatusId === st.id;
                      const isOver = dragOverStatusId === st.id && draggedStatusId !== st.id;

                      return (
                        <div
                          key={st.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverStatusId !== st.id) {
                              setDragOverStatusId(st.id);
                            }
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                            if (dragOverStatusId === st.id) {
                              setDragOverStatusId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedStatusId && draggedStatusId !== st.id) {
                              handleMoveStatus(draggedStatusId, st.id);
                            }
                            setDraggedStatusId(null);
                            setDragOverStatusId(null);
                          }}
                          className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-[#18181b]/50 transition-colors group select-text ${
                            isDragging ? 'opacity-30 bg-orange-950/20' : ''
                          } ${
                            isOver ? 'border-t-2 border-t-orange-500 bg-orange-950/20' : ''
                          }`}
                        >
                          {/* Order & Dedicated Drag Handle */}
                          <div className="col-span-2 flex items-center gap-2">
                            <div
                              draggable={true}
                              onDragStart={(e) => {
                                setDraggedStatusId(st.id);
                                e.dataTransfer.setData('text/plain', st.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggedStatusId(null);
                                setDragOverStatusId(null);
                              }}
                              className="p-1 rounded-[6px] hover:bg-zinc-800 text-zinc-500 hover:text-orange-400 cursor-grab active:cursor-grabbing select-none transition-colors"
                              title="Drag handle to reorder status"
                            >
                              <span className="material-symbols-outlined text-[17px] block leading-none">drag_indicator</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <button
                                type="button"
                                disabled={localIdx <= 0}
                                onClick={() => handleMoveStatusByIndex(localIdx, localIdx - 1)}
                                className="p-0.5 text-zinc-500 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <span className="material-symbols-outlined text-[13px] leading-none">keyboard_arrow_up</span>
                              </button>
                              <button
                                type="button"
                                disabled={localIdx === -1 || localIdx >= localStatuses.length - 1}
                                onClick={() => handleMoveStatusByIndex(localIdx, localIdx + 1)}
                                className="p-0.5 text-zinc-500 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <span className="material-symbols-outlined text-[13px] leading-none">keyboard_arrow_down</span>
                              </button>
                            </div>

                            <span className="font-mono text-[11px] text-zinc-400 font-semibold">{idx + 1}</span>
                          </div>

                        {/* Name & Color */}
                        <div className="col-span-4 flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-black/40 shrink-0"
                            style={{ backgroundColor: st.color }}
                          ></span>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-100 truncate">{st.name}</span>
                              {st.isDefault && (
                                <span className="font-mono text-[9px] bg-[#18181b] px-1.5 py-0.2 rounded-[6px] text-zinc-400 border border-[#27272a]">
                                  Default
                                </span>
                              )}
                              {st.isClosed && (
                                <span className="font-mono text-[9px] bg-[#18181b] px-1.5 py-0.2 rounded-[6px] text-zinc-400 border border-[#27272a]">
                                  Closed
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-zinc-500 truncate">{st.description}</span>
                          </div>
                        </div>

                        {/* Stage Mapping */}
                        <div className="col-span-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-[#18181b] text-zinc-300 border border-[#27272a]">
                            {st.stageMapping}
                          </span>
                        </div>

                        {/* WIP Limit */}
                        <div className="col-span-2">
                          <span className="font-mono text-[11px] text-zinc-300 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[13px] text-orange-400">speed</span>
                            <span>{st.wipLimit ? `${st.wipLimit} tasks max` : 'Unlimited'}</span>
                          </span>
                        </div>

                        {/* Active Volume */}
                        <div className="col-span-1">
                          <span className="font-mono text-[11px] text-zinc-300 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                            {st.activeVolume}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditStatus(st)}
                            className="p-1 rounded-[6px] text-zinc-400 hover:text-orange-400 hover:bg-[#18181b] transition-colors cursor-pointer"
                            title="Edit status definition in modal"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={st.isDefault || st.isClosed}
                            onClick={() => handleDeleteStatus(st.id)}
                            className={`p-1 rounded-[6px] transition-colors cursor-pointer ${
                              st.isDefault || st.isClosed
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20'
                            }`}
                            title={st.isDefault || st.isClosed ? 'System default cannot be deleted' : 'Delete status'}
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Table Footer */}
                  <div className="px-4 py-2 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between font-mono text-[10px] text-zinc-400">
                    <span>Total {localStatuses.length} columns configured • Drag handle or use arrows to reorder</span>
                    <span>Changes sync across Kanban &amp; Table views</span>
                  </div>
                </div>

                {/* Stage Governance & Guardrails */}
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col gap-2.5 shadow-sm">
                  <h3 className="font-semibold text-xs text-zinc-100 font-headline">Stage Governance &amp; Guardrails</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 border border-[#27272a] rounded-[6px] bg-[#18181b] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-100">Strict Forward Progress</span>
                        <input
                          type="checkbox"
                          checked={localSettings.strictForwardProgress}
                          onChange={(e) =>
                            setLocalSettings({ ...localSettings, strictForwardProgress: e.target.checked })
                          }
                          className="rounded-[6px] accent-orange-500 h-4 w-4 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Disallow skipping review stages without manager override flag.
                      </p>
                    </div>

                    <div className="p-3 border border-[#27272a] rounded-[6px] bg-[#18181b] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-100">Auto-Archive on &ldquo;Done&rdquo;</span>
                        <input
                          type="checkbox"
                          checked={localSettings.autoArchiveDone}
                          onChange={(e) =>
                            setLocalSettings({ ...localSettings, autoArchiveDone: e.target.checked })
                          }
                          className="rounded-[6px] accent-orange-500 h-4 w-4 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Automatically move closed tasks to sprint archive after 14 calendar days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: GENERAL                                                 */}
          {/* ============================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Section 1: List Identity & Display Card */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-xs">
                <div className="flex items-start justify-between border-b border-[#27272a] pb-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm text-zinc-100 font-headline">List Identity &amp; Display</h2>
                    <p className="text-xs text-zinc-400">
                      Primary naming conventions, color tags, and visual emblems across board views.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-[#18181b] text-orange-400 border border-orange-500/20 font-semibold">
                    Core Metadata
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Name & Scope */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-200 mb-1">
                        List Name <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={localSettings.name}
                          onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })}
                          className="w-full h-9 px-3 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500">
                          {localSettings.name.length}/64 chars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-200 mb-1">
                        Description &amp; Deliverable Scope
                      </label>
                      <textarea
                        rows={3}
                        value={localSettings.description}
                        onChange={(e) => setLocalSettings({ ...localSettings, description: e.target.value })}
                        className="w-full p-2.5 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 resize-none"
                      />
                      <span className="font-mono text-[10px] text-zinc-500 block mt-1">
                        Rendered at the header of all sub-views and visible to collaborative engineering groups.
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Visual Swatches & Icon */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-200 mb-1.5">
                        List Color &amp; Accent Swatch
                      </label>
                      <div className="flex items-center flex-wrap gap-2.5">
                        <div className="flex items-center gap-1.5 p-1 bg-[#18181b] border border-[#27272a] rounded-[6px]">
                          {colorPresets.map((cp) => (
                            <button
                              key={cp.hex}
                              type="button"
                              onClick={() => setLocalSettings({ ...localSettings, color: cp.hex })}
                              className={`w-6 h-6 rounded-[6px] transition-all cursor-pointer ${
                                localSettings.color.toLowerCase() === cp.hex.toLowerCase()
                                  ? 'ring-2 ring-orange-500 scale-105'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: cp.hex }}
                              title={cp.name}
                            ></button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center h-8 px-2 bg-[#18181b] border border-[#27272a] rounded-[6px] font-mono text-xs">
                            <span className="text-zinc-500 mr-1">#</span>
                            <input
                              type="text"
                              value={localSettings.color.replace('#', '')}
                              onChange={(e) => setLocalSettings({ ...localSettings, color: `#${e.target.value}` })}
                              className="w-16 uppercase bg-transparent border-0 p-0 text-zinc-100 focus:ring-0"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded-[6px]">
                            <span
                              className="w-3.5 h-3.5 rounded-[6px]"
                              style={{ backgroundColor: localSettings.color }}
                            ></span>
                            <span className="font-mono text-[10px] font-semibold text-zinc-200">Selected</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#27272a]">
                      <label className="block text-xs font-medium text-zinc-200 mb-1.5">
                        Icon Identifier
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          'terminal',
                          'folder_open',
                          'database',
                          'memory',
                          'rocket_launch',
                          'hub',
                          ...(showAllIcons
                            ? ['code', 'bug_report', 'analytics', 'dataset', 'security', 'api', 'dashboard', 'layers']
                            : []),
                        ].map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setLocalSettings({ ...localSettings, icon: ic })}
                            className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer ${
                              localSettings.icon === ic
                                ? 'border shadow-xs'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b]'
                            }`}
                            style={
                              localSettings.icon === ic
                                ? {
                                    backgroundColor: `${localSettings.color}25`,
                                    borderColor: `${localSettings.color}60`,
                                    color: localSettings.color,
                                  }
                                : undefined
                            }
                            title={ic}
                          >
                            <span className="material-symbols-outlined text-[17px]">{ic}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowAllIcons(!showAllIcons)}
                          className="px-2.5 py-1 rounded-[6px] border border-[#27272a] text-[11px] text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">apps</span>
                          <span>{showAllIcons ? 'Fewer symbols' : 'More symbols...'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Default View & Layout Bento Row (5 Columns) */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-xs">
                <div className="flex items-start justify-between border-b border-[#27272a] pb-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm text-zinc-100 font-headline">Default View &amp; Layout</h2>
                    <p className="text-xs text-zinc-400">
                      Default rendering canvas when collaborators open this workspace list.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-[#18181b] text-zinc-400 border border-[#27272a] font-medium">
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
                        className={`p-3.5 rounded-[6px] cursor-pointer flex flex-col justify-between h-28 transition-all ${
                          isSelected
                            ? 'border-2 border-orange-500 bg-orange-950/20 shadow-sm'
                            : 'border border-[#27272a] bg-[#18181b] hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`material-symbols-outlined text-[22px] ${
                              isSelected ? 'text-orange-400' : 'text-zinc-500'
                            }`}
                          >
                            {layout.icon}
                          </span>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/20"></span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-zinc-100 block">{layout.id}</span>
                          <span className="font-mono text-[10px] text-zinc-500">{layout.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-[#27272a]">
                  <div>
                    <label className="block text-xs font-medium text-zinc-200 mb-1">
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
                      className="w-full h-9 px-3 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500"
                    >
                      <option>P0 - Critical Blocker</option>
                      <option>P1 - High Priority</option>
                      <option>P2 - Medium (Normal)</option>
                      <option>P3 - Low / Nice to Have</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-200 mb-1">
                      Estimation Metric Unit
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-9 p-0.5 bg-[#18181b] border border-[#27272a] rounded-[6px]">
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, estimationUnit: 'Story Points' })}
                        className={`text-xs rounded-[6px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          localSettings.estimationUnit === 'Story Points'
                            ? 'bg-orange-600 text-white shadow-sm font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">straighten</span>
                        <span>Story Points</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, estimationUnit: 'Engineering Hours' })}
                        className={`text-xs rounded-[6px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          localSettings.estimationUnit === 'Engineering Hours'
                            ? 'bg-orange-600 text-white shadow-sm font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>Engineering Hours</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-[#121214] border border-rose-900/40 rounded-[6px] p-6 shadow-xs">
                <div className="flex items-start justify-between border-b border-[#27272a] pb-4 mb-5">
                  <div>
                    <h2 className="font-semibold text-base text-rose-300 font-headline flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-[20px]">warning</span>
                      <span>Danger Zone: Task Space Management</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Destructive actions that permanently impact this task space, its configuration, and member access.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] bg-rose-950/50 text-rose-400 font-semibold border border-rose-800/40">
                    Irreversible
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[6px] bg-[#18181b] border border-rose-900/30 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-zinc-100 block">
                      Delete this Task Space
                    </span>
                    <p className="text-xs text-zinc-400 max-w-xl">
                      Permanently delete <strong className="text-zinc-200">{localSettings.name}</strong>, all associated status configurations, and unassign any tasks belonging to this space.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="h-9 px-4 rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Delete Task Space</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal (Create / Edit) */}
      {isStatusModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => {
            setIsStatusModalOpen(false);
            setEditingStatusId(null);
          }}
        >
          <div
            className="bg-[#121214] border border-[#27272a] rounded-[6px] max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[6px] bg-orange-950/40 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    {editingStatusId ? 'edit_note' : 'add_circle'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100 font-headline">
                    {editingStatusId ? 'Edit Status Definition' : 'Add New Status'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {editingStatusId
                      ? 'Modify existing lifecycle state parameters and guardrails.'
                      : 'Define a new progression stage for your task pipeline.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setEditingStatusId(null);
                }}
                className="p-1 rounded-[6px] text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex flex-col gap-4 py-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              {/* Status Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Status Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={drawerName}
                  onChange={(e) => setDrawerName(e.target.value)}
                  placeholder="e.g., Code Review, QA Verification, Blocked"
                  className="h-9 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                  autoFocus
                />
              </div>

              {/* Status Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={drawerDescription}
                  onChange={(e) => setDrawerDescription(e.target.value)}
                  placeholder="e.g., Active peer review prior to staging merge"
                  className="h-9 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Status Color */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Status Color Badge
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setDrawerColor(c.hex)}
                      className={`w-7 h-7 rounded-[6px] border flex items-center justify-center transition-all cursor-pointer ${
                        drawerColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {drawerColor.toLowerCase() === c.hex.toLowerCase() && (
                        <span className="material-symbols-outlined text-[14px] text-white">check</span>
                      )}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-1">
                    <input
                      type="color"
                      value={drawerColor}
                      onChange={(e) => setDrawerColor(e.target.value)}
                      className="w-7 h-7 rounded-[6px] border border-[#27272a] bg-[#18181b] cursor-pointer"
                      title="Custom color picker"
                    />
                    <input
                      type="text"
                      value={drawerColor}
                      onChange={(e) => setDrawerColor(e.target.value)}
                      placeholder="#ea580c"
                      className="h-7 w-20 px-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-orange-500 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Lifecycle Stage Mapping */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Lifecycle Stage Mapping
                </label>
                <select
                  value={drawerStage}
                  onChange={(e) => setDrawerStage(e.target.value)}
                  className="h-9 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="To Do (Start Stage)">To Do (Start Stage)</option>
                  <option value="In Progress (Active Work)">In Progress (Active Work)</option>
                  <option value="Complete (Finalized Stage)">Complete (Finalized Stage)</option>
                </select>
                <p className="text-[11px] text-zinc-500">
                  Maps this status to global reporting categories (Backlog, In Progress, or Done).
                </p>
              </div>

              {/* WIP Limit & Guardrails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    WIP Limit (Concurrency)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={drawerWip}
                      onChange={(e) => setDrawerWip(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="h-9 w-24 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {drawerWip === 0 ? '(0 = Unlimited)' : 'max concurrent'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 justify-center">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    PR Guardrail
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={drawerPrRequired}
                      onChange={(e) => setDrawerPrRequired(e.target.checked)}
                      className="rounded-[6px] accent-orange-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-300">Require Linked Pull Request</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#27272a]">
              <div>
                {editingStatusId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (editingStatusId) {
                        handleDeleteStatus(editingStatusId);
                      }
                    }}
                    disabled={
                      localStatuses.find((s) => s.id === editingStatusId)?.isDefault ||
                      localStatuses.find((s) => s.id === editingStatusId)?.isClosed
                    }
                    className="h-8 px-3 rounded-[6px] bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium border border-rose-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Delete Status</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setEditingStatusId(null);
                  }}
                  className="h-8 px-3.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-[#27272a] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!drawerName.trim()}
                  onClick={handleSaveStatusModal}
                  className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{editingStatusId ? 'Save Changes' : 'Create Status'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#121214] border border-rose-900/60 rounded-[6px] max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-[6px] bg-rose-950/60 border border-rose-900/60">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-headline">Delete Task Space</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-zinc-100">{localSettings.name}</strong>? Please type{' '}
              <span className="font-mono text-orange-400 font-semibold select-all bg-[#18181b] px-1.5 py-0.5 rounded-[4px] border border-[#27272a]">
                {localSettings.name}
              </span>{' '}
              below to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type "${localSettings.name}" to confirm`}
              className="h-9 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-xs text-zinc-100 focus:outline-none focus:border-rose-500 font-mono"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="h-8 px-3.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-[#27272a] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toLowerCase() !== localSettings.name.trim().toLowerCase()}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  if (onDeleteTaskSpace) {
                    onDeleteTaskSpace(localSettings.listId);
                  }
                }}
                className="h-8 px-4 rounded-[6px] bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Footer */}
      <footer className="h-14 bg-[#0c0a09] border-t border-[#27272a] px-6 flex items-center justify-between shrink-0 shadow-lg">
        <div></div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLocalSettings(settings);
              setLocalStatuses(statuses);
            }}
            className="px-3.5 py-1.5 rounded-[6px] border border-[#27272a] text-xs font-medium text-zinc-300 hover:bg-[#18181b] transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{isSavedFeedback ? 'Changes Saved' : 'Save Changes'}</span>
            <kbd className="font-mono text-[10px] px-1 py-0.2 rounded-[6px] bg-white/20 text-white ml-1">⌘S</kbd>
          </button>
        </div>
      </footer>
    </div>
  );
};
