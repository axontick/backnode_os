import React, { useState, useEffect, useMemo } from 'react';
import { DocItem } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

export interface MoveDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
  onConfirmMove?: (docId: string, targetFolderId: string | null) => Promise<void> | void;
}

export const MoveDocModal: React.FC<MoveDocModalProps> = ({
  isOpen,
  onClose,
  doc,
  onConfirmMove,
}) => {
  const { docFolders, handleUpdateDoc, showToast } = useWorkspace();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && doc) {
      setSelectedFolderId(doc.folderId || '');
      setIsSubmitting(false);
    }
  }, [isOpen, doc]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Current folder name
  const currentFolderName = useMemo(() => {
    if (!doc?.folderId) return 'All Workspace Docs (Root)';
    const f = docFolders.find((folder) => folder.id === doc.folderId);
    return f ? f.name : 'All Workspace Docs (Root)';
  }, [docFolders, doc]);

  const isSameLocation = (selectedFolderId || '') === (doc?.folderId || '');

  if (!isOpen || !doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSameLocation || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const targetFolderId = selectedFolderId.trim() ? selectedFolderId : null;
      if (onConfirmMove) {
        await onConfirmMove(doc.id, targetFolderId);
      } else {
        await handleUpdateDoc(doc.id, {
          folderId: targetFolderId || undefined,
        });
        const target = docFolders.find((f) => f.id === targetFolderId);
        showToast(`Document moved to ${target ? `"${target.name}"` : 'All Workspace Docs'}`);
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
        aria-labelledby="move-doc-title"
        className="w-[440px] max-w-full bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Move Document
              </span>
              <h2 id="move-doc-title" className="text-sm font-bold text-zinc-100 font-headline truncate max-w-[280px]">
                {doc.title || 'Untitled Document'}
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
                  Current Folder
                </span>
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
                  <span className="material-symbols-outlined text-[14px] text-orange-400">folder_open</span>
                  <span>{currentFolderName}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-[6px]">
                {doc.classification}
              </span>
            </div>

            {/* Target Folder */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                <span>Destination Folder</span>
                <span className="text-orange-500">*</span>
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="">📁 All Workspace Docs (No Folder / Root)</option>
                {docFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.parentFolderId ? `  └─ 📁 ${f.name}` : `📁 ${f.name}`}
                  </option>
                ))}
              </select>
            </div>

            {isSameLocation && (
              <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs px-3 py-2 rounded-[6px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-amber-400 shrink-0">info</span>
                <span>The document is already in this folder location.</span>
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
              disabled={isSameLocation || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-[6px] px-4 py-1.5 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">drive_file_move</span>
              <span>{isSubmitting ? 'Moving...' : 'Move Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
