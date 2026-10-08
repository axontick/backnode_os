import React, { useState, useEffect } from 'react';
import { CrmPipeline } from '../types';

interface NewPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePipeline?: (newPipeline: CrmPipeline) => void;
  pipelineToEdit?: CrmPipeline | null;
  onUpdatePipeline?: (updatedPipeline: CrmPipeline) => void;
}

export const NewPipelineModal: React.FC<NewPipelineModalProps> = ({
  isOpen,
  onClose,
  onCreatePipeline,
  pipelineToEdit,
  onUpdatePipeline,
}) => {
  const [pipelineName, setPipelineName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('trending_up');
  const [selectedColor, setSelectedColor] = useState('#9900c2');
  const [targetArr, setTargetArr] = useState('250000');

  useEffect(() => {
    if (pipelineToEdit) {
      setPipelineName(pipelineToEdit.name);
      setDescription(pipelineToEdit.description || '');
      setSelectedIcon(pipelineToEdit.icon || 'trending_up');
      setSelectedColor(pipelineToEdit.color || '#9900c2');
      setTargetArr(String(pipelineToEdit.totalValue ?? 250000));
    } else {
      setPipelineName('');
      setDescription('');
      setSelectedIcon('trending_up');
      setSelectedColor('#9900c2');
      setTargetArr('250000');
    }
  }, [isOpen, pipelineToEdit]);

  if (!isOpen) return null;

  const icons = [
    'business',
    'trending_up',
    'hub',
    'monetization_on',
    'domain',
    'rocket_launch',
    'insights',
    'flag',
    'workspaces',
    'paid',
  ];

  const colors = [
    { hex: '#9900c2', name: 'Executive Violet' },
    { hex: '#3B82F6', name: 'Sapphire Blue' },
    { hex: '#10B981', name: 'Emerald Green' },
    { hex: '#F59E0B', name: 'Amber Gold' },
    { hex: '#EC4899', name: 'Neon Pink' },
    { hex: '#6366F1', name: 'Indigo' },
    { hex: '#06B6D4', name: 'Cyan' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineName.trim()) return;

    const parsed = parseInt(targetArr.replace(/[^0-9]/g, ''), 10);
    const val = isNaN(parsed) ? 250000 : parsed;

    if (pipelineToEdit) {
      onUpdatePipeline?.({
        ...pipelineToEdit,
        name: pipelineName.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
        totalValue: val,
      });
    } else {
      const newPipeline: CrmPipeline = {
        id: `pipe-${pipelineName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        name: pipelineName.trim(),
        description: description.trim() || 'New commercial opportunities & sales funnel.',
        icon: selectedIcon,
        color: selectedColor,
        dealCount: 0,
        totalValue: val,
      };

      onCreatePipeline?.(newPipeline);
    }

    setPipelineName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181b]/40 backdrop-blur-[4px] transition-all duration-200 select-none animate-in fade-in">
      <div className="w-[500px] max-w-full bg-white rounded-2xl border border-zinc-200/90 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="material-symbols-outlined text-[20px]">{selectedIcon}</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-zinc-900 leading-tight">
                {pipelineToEdit ? 'Edit Sales Pipeline' : 'Add Sales Pipeline'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Create a segregated pipeline with custom stages and target ARR.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-semibold text-zinc-600">
              Pipeline Name <span className="text-[#9900c2]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="e.g. Channel Partners 2026, Inbound SaaS Trial"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-[#9900c2] focus:ring-1 focus:ring-[#9900c2]/30 text-sm font-medium focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-semibold text-zinc-600">
              Description / Scope
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Target accounts, contract types, or deal segment..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:border-[#9900c2] text-xs focus:outline-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase font-semibold text-zinc-600">
              Pipeline Icon Identifier
            </label>
            <div className="grid grid-cols-5 gap-2">
              {icons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setSelectedIcon(ic)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedIcon === ic
                      ? 'border-[#9900c2] bg-purple-50 text-[#9900c2] font-bold shadow-xs'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase font-semibold text-zinc-600">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c.hex
                      ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110 shadow-sm'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Target ARR */}
          <div className="space-y-1 pt-1 border-t border-zinc-100">
            <label className="font-mono text-[10px] uppercase font-semibold text-zinc-600">
              Initial Target ARR Goal ($)
            </label>
            <input
              type="text"
              value={targetArr}
              onChange={(e) => setTargetArr(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#9900c2]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {pipelineToEdit ? 'save' : 'add_chart'}
              </span>
              <span>{pipelineToEdit ? 'Save Changes' : 'Create Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
