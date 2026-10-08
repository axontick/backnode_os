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
  const [selectedIcon, setSelectedIcon] = useState('leaderboard');
  const [selectedColor, setSelectedColor] = useState('#ea580c');
  const [targetArr, setTargetArr] = useState('');

  useEffect(() => {
    if (pipelineToEdit) {
      setPipelineName(pipelineToEdit.name);
      setDescription(pipelineToEdit.description || '');
      setSelectedIcon(pipelineToEdit.icon || 'leaderboard');
      setSelectedColor(pipelineToEdit.color || '#ea580c');
      setTargetArr(pipelineToEdit.totalValue ? String(pipelineToEdit.totalValue) : '');
    } else {
      setPipelineName('');
      setDescription('');
      setSelectedIcon('leaderboard');
      setSelectedColor('#ea580c');
      setTargetArr('');
    }
  }, [isOpen, pipelineToEdit]);

  if (!isOpen) return null;

  const icons = [
    'leaderboard',
    'hub',
    'monetization_on',
    'domain',
    'rocket_launch',
    'insights',
    'flag',
    'workspaces',
    'paid',
    'table_chart',
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
    if (!pipelineName.trim()) return;

    const parsed = parseInt(targetArr.replace(/[^0-9]/g, ''), 10);
    const val = isNaN(parsed) ? 100000 : parsed;

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
        description: description.trim() || 'Segregated commercial opportunities & sales funnel.',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-all duration-200 select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-[500px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
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
                {pipelineToEdit ? 'Edit Sales Pipeline' : 'Add Sales Pipeline'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Segregated pipeline with custom stages and target ARR.
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
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs bg-[#121214]">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>Pipeline Name</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="e.g. Enterprise North America, EMEA Mid-Market"
                className="w-full px-3.5 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-sm font-medium focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Description &amp; Objective
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief objective of this sales pipeline funnel..."
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Target Pipeline ARR ($)
              </label>
              <input
                type="text"
                value={targetArr}
                onChange={(e) => setTargetArr(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 font-mono text-xs focus:outline-none"
              />
            </div>

            {/* Icon Selector */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Pipeline Icon Identifier
              </label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setSelectedIcon(ic)}
                    className={`p-2 rounded-[6px] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedIcon === ic
                        ? 'border-orange-500 bg-orange-950/40 text-orange-400 font-bold shadow-xs'
                        : 'border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{ic}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Color Accent Swatch
              </label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-[4px] transition-transform cursor-pointer ${
                      selectedColor === c.hex
                        ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#121214] scale-105 shadow-sm'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
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
              disabled={!pipelineName.trim()}
              className="px-5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {pipelineToEdit ? 'save' : 'add_business'}
              </span>
              <span>{pipelineToEdit ? 'Save Changes' : 'Create Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
