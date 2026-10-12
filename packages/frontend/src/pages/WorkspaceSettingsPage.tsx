import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { DepartmentSettingsView } from '../components/DepartmentSettingsView';

export const WorkspaceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const {
    activeUserSpace,
    activeUserSpaceId,
    userSpaces,
    handleUpdateWorkspace,
    handleDeleteWorkspace,
    departments,
    members,
    tasks,
    pipelines,
    folders,
    deals,
    setIsNewWorkspaceModalOpen,
  } = useWorkspace();

  const spacePrefix = `/space/${activeUserSpaceId || activeUserSpace?.id || 'space-main'}`;
  const currentTab: 'general' | 'departments' = tab === 'departments' ? 'departments' : 'general';

  const [workspaceName, setWorkspaceName] = useState(activeUserSpace?.name || '');
  const [slug, setSlug] = useState(activeUserSpace?.slug || '');
  const [selectedIcon, setSelectedIcon] = useState(activeUserSpace?.icon || 'workspaces');
  const [selectedColor, setSelectedColor] = useState(activeUserSpace?.color || '#ea580c');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form fields when activeUserSpace changes
  useEffect(() => {
    if (activeUserSpace) {
      setWorkspaceName(activeUserSpace.name || '');
      setSlug(activeUserSpace.slug || '');
      setSelectedIcon(activeUserSpace.icon || 'workspaces');
      setSelectedColor(activeUserSpace.color || '#ea580c');
      setHasChanges(false);
    }
  }, [activeUserSpace?.id, activeUserSpace?.name, activeUserSpace?.color, activeUserSpace?.icon, activeUserSpace?.slug]);

  // Track if changes are pending
  useEffect(() => {
    if (!activeUserSpace) return;
    const nameChanged = workspaceName.trim() !== activeUserSpace.name;
    const colorChanged = selectedColor !== (activeUserSpace.color || '#ea580c');
    const iconChanged = selectedIcon !== (activeUserSpace.icon || 'workspaces');
    setHasChanges(nameChanged || colorChanged || iconChanged);
  }, [workspaceName, selectedColor, selectedIcon, activeUserSpace]);

  const icons = [
    { id: 'workspaces', label: 'Workspace' },
    { id: 'deployed_code', label: 'Deploy' },
    { id: 'corporate_fare', label: 'Org' },
    { id: 'terminal', label: 'CLI' },
    { id: 'rocket_launch', label: 'Launch' },
    { id: 'developer_board', label: 'Hardware' },
    { id: 'hub', label: 'Hub' },
    { id: 'shield', label: 'Security' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'dataset', label: 'Data' },
  ];

  const colors = [
    { hex: '#ea580c', name: 'Electric Orange' },
    { hex: '#0284c7', name: 'Sky Blue' },
    { hex: '#10b981', name: 'Emerald Green' },
    { hex: '#f59e0b', name: 'Amber Gold' },
    { hex: '#ec4899', name: 'Rose Pink' },
    { hex: '#6366f1', name: 'Indigo' },
    { hex: '#64748b', name: 'Slate Gray' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || !activeUserSpace) return;
    setIsSaving(true);
    try {
      await handleUpdateWorkspace(activeUserSpace.id, {
        name: workspaceName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeUserSpace) return;
    if (confirmNameInput.trim().toLowerCase() !== activeUserSpace.name.trim().toLowerCase()) return;
    setIsDeleting(true);
    try {
      const remaining = userSpaces.filter((s) => s.id !== activeUserSpace.id);
      const nextSpaceId = remaining[0]?.id || 'space-main';
      await handleDeleteWorkspace(activeUserSpace.id);
      setIsDeleteModalOpen(false);
      setConfirmNameInput('');
      navigate(`/space/${nextSpaceId}/dashboard`);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOnlyWorkspace = userSpaces.length <= 1;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Sub-Header Navigation Tabs Bar */}
      <div className="h-[44px] bg-[#121214] border-b border-[#27272a] px-8 flex items-center justify-between shrink-0">
        <div className="max-w-6xl w-full mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`${spacePrefix}/settings/general`)}
            className={`h-8 px-3 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'general'
                ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>General Profile</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`${spacePrefix}/settings/departments`)}
            className={`h-8 px-3 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'departments'
                ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">domain</span>
            <span>Departments</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] font-bold ${
                currentTab === 'departments'
                  ? 'bg-orange-600/30 text-orange-300'
                  : 'bg-[#18181b] text-zinc-400'
              }`}
            >
              {departments.length}
            </span>
          </button>
        </div>
      </div>

      {currentTab === 'departments' ? (
        <DepartmentSettingsView />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Top Banner / Header */}
          <div className="border-b border-[#27272a] bg-[#0c0a09] px-8 py-5 shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="material-symbols-outlined text-[22px]">{selectedIcon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  SYSTEM CONFIGURATION // ENVIRONMENT
                </span>
                <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.2 rounded-[6px] font-semibold">
                  ACTIVE DOMAIN
                </span>
              </div>
              <h1 className="text-xl font-bold text-zinc-100 font-headline leading-tight mt-0.5">
                Workspace Settings
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || !workspaceName.trim()}
              className="px-4 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 py-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Workspace Identity & Visual Branding Card */}
        <section className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-sm space-y-5">
          <div className="border-b border-[#27272a]/60 pb-3 flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-orange-400 font-bold">
                IDENTITY & BRANDING
              </span>
              <h2 className="text-[15px] font-semibold text-zinc-100 font-headline">
                General Profile
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              ID: {activeUserSpace?.id || 'space-main'}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Workspace Name */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>Workspace Name</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Cloud Corp"
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-sm font-medium focus:outline-none transition-all"
              />
            </div>

            {/* Workspace Slug / URL Identifier (read-only / auto) */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Workspace Domain Slug
              </label>
              <div className="flex items-center rounded-[6px] border border-[#27272a] bg-[#18181b] overflow-hidden">
                <span className="px-3 py-2 text-zinc-500 font-mono text-[11px] border-r border-[#27272a] bg-[#121214] select-none">
                  backnode.os/
                </span>
                <input
                  type="text"
                  value={slug}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 bg-transparent text-zinc-400 text-xs font-mono focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Workspace Icon Selector */}
            <div className="space-y-2 pt-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Workspace Chosen Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setSelectedIcon(ic.id)}
                    className={`p-2.5 rounded-[6px] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedIcon === ic.id
                        ? 'border-orange-500 bg-orange-950/40 text-orange-400 font-bold shadow-xs'
                        : 'border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{ic.id}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider truncate w-full text-center">
                      {ic.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Swatches */}
            <div className="space-y-2 pt-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Workspace Accent Color
              </label>
              <div className="flex items-center gap-3">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-[6px] transition-transform cursor-pointer ${
                      selectedColor === c.hex
                        ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#121214] scale-105 shadow-sm'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
                <span className="text-zinc-500 font-mono text-[11px] ml-2">
                  {colors.find((c) => c.hex === selectedColor)?.name || selectedColor}
                </span>
              </div>
            </div>
          </form>
        </section>

        {/* Workspace Telemetry & Operational Metrics Bento Grid */}
        <section className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-sm space-y-4">
          <div className="border-b border-[#27272a]/60 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              CAPACITY & WORKSPACE METRICS
            </span>
            <h2 className="text-[15px] font-semibold text-zinc-100 font-headline">
              Associated Domain Resources
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Members</span>
              <span className="text-2xl font-bold font-mono text-zinc-100 mt-2">{members.length}</span>
              <span className="text-[10px] text-zinc-500 mt-1">Active operators</span>
            </div>

            <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Deliverables</span>
              <span className="text-2xl font-bold font-mono text-zinc-100 mt-2">{tasks.length}</span>
              <span className="text-[10px] text-zinc-500 mt-1">Triage backlog</span>
            </div>

            <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Pipelines</span>
              <span className="text-2xl font-bold font-mono text-zinc-100 mt-2">{pipelines.length}</span>
              <span className="text-[10px] text-zinc-500 mt-1">
                {deals.filter((d) => !d.isArchived).length} active deals
                {deals.some((d) => d.isArchived) ? ` (${deals.filter((d) => d.isArchived).length} archived)` : ''}
              </span>
            </div>

            <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Folders</span>
              <span className="text-2xl font-bold font-mono text-zinc-100 mt-2">{folders.length}</span>
              <span className="text-[10px] text-zinc-500 mt-1">Organized spaces</span>
            </div>
          </div>
        </section>

        {/* Danger Zone: Delete Workspace */}
        <section className="bg-rose-950/10 border border-rose-900/40 rounded-[6px] p-5 shadow-sm space-y-4">
          <div className="border-b border-rose-900/30 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-500">warning</span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-rose-400 font-bold">
                DANGER ZONE // PERMANENT ACTION
              </span>
              <h2 className="text-[15px] font-semibold text-rose-200 font-headline">
                Delete Workspace
              </h2>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-zinc-400 max-w-xl">
              <p className="leading-relaxed">
                Permanently purge <strong className="text-zinc-200 font-mono">"{activeUserSpace?.name}"</strong> and all
                deliverables, folders, CRM pipelines, and team access records tied to this domain.
              </p>
              <p className="text-[11px] text-rose-300/80">
                This action is irreversible and immediate across local and remote replication nodes.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {isOnlyWorkspace ? (
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-[6px] bg-rose-950/40 border border-rose-900/60 text-rose-400/50 text-xs font-semibold cursor-not-allowed opacity-60 flex items-center gap-1.5"
                    title="Cannot delete the only remaining workspace"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Delete Workspace</span>
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500 text-right">
                    Create another workspace before deleting this one.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmNameInput('');
                    setIsDeleteModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-[6px] bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Delete Workspace</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )}

      {/* Delete Workspace Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-all animate-in fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-[460px] max-w-full bg-[#121214] rounded-[6px] border border-rose-900/60 shadow-2xl p-6 flex flex-col gap-4 text-zinc-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[6px] bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  DESTRUCTIVE PURGE
                </span>
                <h3 className="text-[16px] font-bold text-zinc-100 font-headline leading-tight">
                  Delete "{activeUserSpace?.name}"?
                </h3>
              </div>
            </div>

            <div className="p-3 rounded-[6px] bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1.5">
              <p>
                This will immediately delete this workspace including all <strong>{tasks.length} deliverables</strong>,{' '}
                <strong>{pipelines.length} pipelines</strong>, and <strong>{folders.length} folders</strong>.
              </p>
              <p className="text-[11px] text-zinc-400">
                You will be automatically switched to your next available workspace.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-mono text-[10.5px] text-zinc-400 block">
                Type <strong className="text-zinc-100 font-semibold">{activeUserSpace?.name}</strong> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                placeholder={activeUserSpace?.name}
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-600 focus:border-rose-500 text-sm font-medium focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[6px] text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-[#27272a] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  confirmNameInput.trim().toLowerCase() !== activeUserSpace?.name.trim().toLowerCase() ||
                  isDeleting
                }
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
