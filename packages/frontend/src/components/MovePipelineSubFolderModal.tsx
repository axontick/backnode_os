import React, { useState, useEffect, useMemo } from 'react';
import { CrmPipeline, CrmPipelineSubFolder } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { flattenPipelineSubFolders } from '../utils/treeUtils';

export interface MovePipelineSubFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  subFolder: CrmPipelineSubFolder | null;
  currentPipelineId?: string;
  onConfirmMove?: (subFolderId: string, targetPipelineId: string, targetParentSubFolderId?: string) => Promise<void> | void;
}

export const MovePipelineSubFolderModal: React.FC<MovePipelineSubFolderModalProps> = ({
  isOpen,
  onClose,
  subFolder,
  currentPipelineId,
  onConfirmMove,
}) => {
  const { pipelines, handleMovePipelineSubFolder } = useWorkspace();

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedParentSubFolderId, setSelectedParentSubFolderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && pipelines.length > 0) {
      setSelectedPipelineId(currentPipelineId || pipelines[0]?.id || '');
      setSelectedParentSubFolderId(subFolder?.parentId || '');
      setIsSubmitting(false);
    }
  }, [isOpen, currentPipelineId, subFolder, pipelines]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activePipeline = useMemo(() => {
    return pipelines.find((p) => p.id === selectedPipelineId);
  }, [pipelines, selectedPipelineId]);

  const flattenedSubs = useMemo(() => {
    if (!activePipeline?.subFolders) return [];
    // Filter out the current subfolder and its descendants to prevent circular nesting
    return flattenPipelineSubFolders(activePipeline.subFolders).filter(
      (s) => s.subFolder.id !== subFolder?.id
    );
  }, [activePipeline, subFolder]);

  const currentPipelineName = useMemo(() => {
    const p = pipelines.find((pipe) => pipe.id === currentPipelineId);
    return p ? p.name : 'Unknown Pipeline';
  }, [pipelines, currentPipelineId]);

  const isSameLocation =
    selectedPipelineId === currentPipelineId &&
    (selectedParentSubFolderId || '') === (subFolder?.parentId || '');

  if (!isOpen || !subFolder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipelineId || isSameLocation || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onConfirmMove) {
        await onConfirmMove(
          subFolder.id,
          selectedPipelineId,
          selectedParentSubFolderId ? selectedParentSubFolderId : undefined
        );
      } else if (handleMovePipelineSubFolder) {
        await handleMovePipelineSubFolder(
          subFolder.id,
          selectedPipelineId,
          selectedParentSubFolderId ? selectedParentSubFolderId : undefined
        );
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-pipe-sub-title"
        className="w-[460px] max-w-full bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Move Pipeline Sub-Folder
              </span>
              <h2 id="move-pipe-sub-title" className="text-sm font-bold text-zinc-100 font-headline">
                {subFolder.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 text-xs">
            {/* Current Location */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">
                  Current Pipeline
                </span>
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
                  <span className="material-symbols-outlined text-[14px] text-orange-400">leaderboard</span>
                  <span>{currentPipelineName}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-[6px]">
                {subFolder.dealCount ?? 0} deals
              </span>
            </div>

            {/* Target Pipeline */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                <span>Destination Pipeline</span>
                <span className="text-orange-500">*</span>
              </label>
              <select
                value={selectedPipelineId}
                onChange={(e) => {
                  setSelectedPipelineId(e.target.value);
                  setSelectedParentSubFolderId('');
                }}
                required
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dealCount} deals)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Parent Subfolder (Optional) */}
            {flattenedSubs.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Parent Sub-Folder (Optional)</span>
                  <span className="text-[10px] text-zinc-500 lowercase">nest inside</span>
                </label>
                <select
                  value={selectedParentSubFolderId}
                  onChange={(e) => setSelectedParentSubFolderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">(Top Level of Pipeline)</option>
                  {flattenedSubs.map(({ subFolder: s, depth }) => (
                    <option key={s.id} value={s.id}>
                      {`${'\u00A0\u00A0'.repeat(depth)}📁 ${s.name}`} ({s.dealCount ?? 0} deals)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSameLocation && (
              <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs px-3 py-2 rounded-[6px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-amber-400 shrink-0">info</span>
                <span>The sub-folder is already in this pipeline location.</span>
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 py-3.5 bg-[#18181b] border-t border-[#27272a] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#27272a] bg-[#121214] hover:bg-zinc-800 rounded-[6px] px-3.5 py-1.5 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSameLocation || !selectedPipelineId || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-[6px] px-4 py-1.5 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">drive_file_move</span>
              <span>{isSubmitting ? 'Moving...' : 'Move Sub-Folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
