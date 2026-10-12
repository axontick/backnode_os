import React, { useState, useEffect } from 'react';

export interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (space: { name: string; color?: string; icon?: string }) => void;
}

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkspace,
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('workspaces');
  const [selectedColor, setSelectedColor] = useState('#ea580c');

  // Reset to empty state whenever opened
  useEffect(() => {
    if (isOpen) {
      setWorkspaceName('');
      setSlug('');
      setSelectedIcon('workspaces');
      setSelectedColor('#ea580c');
    }
  }, [isOpen]);

  // Auto-generate slug from workspace name if user hasn't manually edited slug
  const handleNameChange = (val: string) => {
    setWorkspaceName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    onCreateWorkspace({
      name: workspaceName.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-[520px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="shrink-0 p-5 pb-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="material-symbols-outlined text-[20px]">{selectedIcon}</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-zinc-100 leading-tight font-headline">
                Create Workspace
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-body">
                Segregated hub for independent tasks, pipelines, and team access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs bg-[#121214]">
            {/* Workspace Name Input */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>Workspace Name</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={workspaceName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Acme Cloud Corp, SRE Operations, Alpha Labs"
                className="w-full px-3.5 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-sm font-medium focus:outline-none transition-all"
              />
            </div>

            {/* Workspace Slug / URL Identifier */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Workspace Domain Slug
              </label>
              <div className="flex items-center rounded-[6px] border border-[#27272a] bg-[#18181b] overflow-hidden focus-within:border-orange-500 transition-all">
                <span className="px-3 py-2 text-zinc-500 font-mono text-[11px] border-r border-[#27272a] bg-[#121214] select-none">
                  backnode.os/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="acme-cloud"
                  className="w-full px-3 py-2 bg-transparent text-zinc-100 placeholder:text-zinc-600 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Workspace Icon Selector */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Workspace Icon
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

            {/* Color Accent Swatch Selector */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Workspace Accent Color
              </label>
              <div className="flex items-center gap-2.5">
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
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-start gap-2.5 text-zinc-400">
              <span className="material-symbols-outlined text-[16px] text-orange-400 shrink-0 mt-0.5">
                info
              </span>
              <p className="text-[11px] leading-relaxed">
                New workspaces initialize with an isolated execution domain, your Owner profile, and enterprise security policies. You can invite team members and create folders anytime.
              </p>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="shrink-0 p-4 border-t border-[#27272a] bg-[#121214] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-[#27272a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!workspaceName.trim()}
              className="px-5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
