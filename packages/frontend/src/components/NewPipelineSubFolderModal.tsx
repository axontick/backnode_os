import React, { useState, useEffect, useMemo } from 'react';
import { CrmPipeline, CrmPipelineSubFolder } from '../types';
import { getFlattenedPipelineTree } from '../utils/treeUtils';

interface NewPipelineSubFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: CrmPipeline[];
  defaultPipeline?: CrmPipeline | null;
  defaultParentId?: string | null;
  onCreateSubFolder: (pipelineId: string, newSubFolder: CrmPipelineSubFolder) => void;
  subFolderToEdit?: { pipeline: CrmPipeline; subFolder: CrmPipelineSubFolder } | null;
  onUpdateSubFolder?: (pipelineId: string, updatedSubFolder: CrmPipelineSubFolder) => void;
}

export const NewPipelineSubFolderModal: React.FC<NewPipelineSubFolderModalProps> = ({
  isOpen,
  onClose,
  pipelines,
  defaultPipeline,
  defaultParentId,
  onCreateSubFolder,
  subFolderToEdit,
  onUpdateSubFolder,
}) => {
  const [subFolderName, setSubFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('domain');
  const [selectedColor, setSelectedColor] = useState('#ea580c');

  const flatOptions = useMemo(() => getFlattenedPipelineTree(pipelines), [pipelines]);

  useEffect(() => {
    if (!isOpen) return;

    if (subFolderToEdit) {
      setSubFolderName(subFolderToEdit.subFolder.name);
      setDescription(subFolderToEdit.subFolder.description || '');
      setSelectedParentId(subFolderToEdit.subFolder.parentId || subFolderToEdit.pipeline.id);
      setSelectedIcon(subFolderToEdit.subFolder.icon || 'domain');
      setSelectedColor(subFolderToEdit.subFolder.color || '#ea580c');
    } else {
      setSubFolderName('');
      setDescription('');
      setSelectedIcon('domain');
      setSelectedColor('#ea580c');
      if (defaultParentId && flatOptions.some((opt) => opt.id === defaultParentId)) {
        setSelectedParentId(defaultParentId);
      } else if (defaultPipeline && flatOptions.some((opt) => opt.id === defaultPipeline.id)) {
        setSelectedParentId(defaultPipeline.id);
      } else if (flatOptions.length > 0) {
        setSelectedParentId(flatOptions[0].id);
      } else {
        setSelectedParentId('');
      }
    }
  }, [isOpen, subFolderToEdit, defaultPipeline, defaultParentId, flatOptions]);

  if (!isOpen) return null;

  const icons = [
    'leaderboard',
    'domain',
    'shield',
    'rocket_launch',
    'insights',
    'hub',
    'monetization_on',
    'flag',
    'verified',
    'folder',
    'corporate_fare',
    'storefront',
  ];

  const colors = [
    { hex: '#ea580c', name: 'Electric Orange' },
    { hex: '#f59e0b', name: 'Amber Gold' },
    { hex: '#10b981', name: 'Emerald Green' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#3b82f6', name: 'Sapphire Blue' },
    { hex: '#ef4444', name: 'Rose Red' },
    { hex: '#64748b', name: 'Slate Gray' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFolderName.trim() || !selectedParentId) return;

    const selectedOpt = flatOptions.find((opt) => opt.id === selectedParentId);
    const rootPipelineId = selectedOpt?.pipelineId || defaultPipeline?.id || pipelines[0]?.id;
    if (!rootPipelineId) return;

    if (subFolderToEdit && onUpdateSubFolder) {
      onUpdateSubFolder(rootPipelineId, {
        ...subFolderToEdit.subFolder,
        name: subFolderName.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
    } else {
      const newSubFolder: CrmPipelineSubFolder = {
        id: `pipe-sub-${subFolderName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
        name: subFolderName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        description: description.trim() || 'Pipeline sub-cohort or region',
        pipelineId: rootPipelineId,
        parentId: selectedParentId,
        dealCount: 0,
        totalValue: 0,
        subFolders: [],
      };
      onCreateSubFolder(rootPipelineId, newSubFolder);
    }

    setSubFolderName('');
    setDescription('');
    onClose();
  };

  const selectedOpt = flatOptions.find((opt) => opt.id === selectedParentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[500px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="shrink-0 p-5 pb-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-zinc-100 leading-tight font-headline">
                {subFolderToEdit ? 'Edit Pipeline Sub-folder' : 'Create Pipeline Sub-folder'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Segment pipeline deals by account tier, geography, or sales cohort.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs bg-[#121214]">
            {/* Parent Pipeline Selector */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>Parent Pipeline</span>
                <span className="text-orange-500">*</span>
              </label>
              {flatOptions.length > 0 ? (
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  disabled={Boolean(subFolderToEdit)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-60"
                >
                  {flatOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.depth === 0
                        ? `📊 ${opt.name}`
                        : `${'\u00A0\u00A0'.repeat(opt.depth)}↳ 📁 ${opt.name}`}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400 bg-amber-950/20 border border-amber-500/30 p-2 rounded-[6px]">
                  No pipelines exist. Please create a pipeline first.
                </p>
              )}
            </div>

            {/* Sub-folder Name */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>Sub-folder / Cohort Name</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={subFolderName}
                onChange={(e) => setSubFolderName(e.target.value)}
                placeholder="e.g. Strategic Cloud Accounts, Gov & Defense Sector, Expansion"
                className="w-full px-3.5 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-sm font-medium focus:outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Target criteria, territory, or customer vertical..."
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-xs focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`h-9 rounded-[6px] border flex items-center justify-center transition-all cursor-pointer ${
                      selectedIcon === icon
                        ? 'border-orange-500 bg-orange-950/40 text-orange-400 shadow-xs'
                        : 'border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Color Accent
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-[6px] transition-all flex items-center justify-center cursor-pointer border ${
                      selectedColor === c.hex
                        ? 'border-white scale-110 shadow-sm'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor === c.hex && (
                      <span className="material-symbols-outlined text-white text-[14px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div className="p-3 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: selectedColor }}
                >
                  {selectedIcon}
                </span>
                <div className="truncate">
                  <span className="text-xs font-semibold text-zinc-200 block truncate">
                    {subFolderName.trim() || 'Pipeline Sub-folder'}
                  </span>
                  <span className="text-[11px] text-zinc-500 block truncate">
                    Inside: {selectedOpt?.name || 'Pipeline'}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-[4px] bg-zinc-800 text-zinc-400 shrink-0 ml-2">
                CRM Cohort
              </span>
            </div>
          </div>

          {/* Sticky Footer */}
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
              disabled={!subFolderName.trim() || !selectedParentId}
              className="px-5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {subFolderToEdit ? 'save' : 'add_circle'}
              </span>
              <span>{subFolderToEdit ? 'Save Changes' : 'Create Sub-folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
