import React, { useState, useEffect, useMemo } from 'react';
import { SpaceFolder, FolderChildItem } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { flattenSubFolders } from '../utils/treeUtils';

export interface MoveListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: FolderChildItem | null;
  currentFolderId?: string;
  currentSubFolderId?: string;
  onConfirmMove?: (listId: string, targetFolderId: string, targetSubFolderId?: string) => Promise<void> | void;
}

export const MoveListModal: React.FC<MoveListModalProps> = ({
  isOpen,
  onClose,
  list,
  currentFolderId,
  currentSubFolderId,
  onConfirmMove,
}) => {
  const { folders, handleMoveListToFolder } = useWorkspace();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset selected folder/subfolder when modal opens
  useEffect(() => {
    if (isOpen && folders.length > 0) {
      const defaultFolderId = currentFolderId || folders[0]?.id || '';
      setSelectedFolderId(defaultFolderId);
      setSelectedSubFolderId(currentSubFolderId || '');
      setIsSubmitting(false);
    }
  }, [isOpen, currentFolderId, currentSubFolderId, folders]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === selectedFolderId);
  }, [folders, selectedFolderId]);

  const flattenedSubs = useMemo(() => {
    if (!activeFolder?.subFolders) return [];
    return flattenSubFolders(activeFolder.subFolders);
  }, [activeFolder]);

  // Determine current folder and subfolder names for display
  const currentFolderName = useMemo(() => {
    const f = folders.find((folder) => folder.id === currentFolderId);
    return f ? f.name : 'Unknown Space Folder';
  }, [folders, currentFolderId]);

  const currentSubFolderName = useMemo(() => {
    if (!currentSubFolderId || !currentFolderId) return null;
    const f = folders.find((folder) => folder.id === currentFolderId);
    if (!f?.subFolders) return null;
    const flat = flattenSubFolders(f.subFolders);
    const sub = flat.find((s) => s.subFolder.id === currentSubFolderId);
    return sub ? sub.subFolder.name : null;
  }, [folders, currentFolderId, currentSubFolderId]);

  // Is target identical to current location?
  const isSameLocation =
    selectedFolderId === currentFolderId &&
    (selectedSubFolderId || '') === (currentSubFolderId || '');

  if (!isOpen || !list) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderId || isSameLocation || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onConfirmMove) {
        await onConfirmMove(
          list.id,
          selectedFolderId,
          selectedSubFolderId ? selectedSubFolderId : undefined
        );
      } else if (handleMoveListToFolder) {
        await handleMoveListToFolder(
          list.id,
          selectedFolderId,
          selectedSubFolderId ? selectedSubFolderId : undefined
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
        aria-labelledby="move-list-title"
        className="w-[460px] max-w-full bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Move List
              </span>
              <h2 id="move-list-title" className="text-sm font-bold text-zinc-100 font-headline">
                {list.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 text-xs">
            {/* Current Location Banner */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">
                  Current Location
                </span>
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
                  <span className="material-symbols-outlined text-[14px] text-orange-400">folder_open</span>
                  <span>{currentFolderName}</span>
                  {currentSubFolderName && (
                    <>
                      <span className="text-zinc-600">/</span>
                      <span className="text-orange-300 font-mono text-[11px]">{currentSubFolderName}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-[6px]">
                {list.taskCount} tasks
              </span>
            </div>

            {/* Target Folder Selector */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                <span>Destination Folder</span>
                <span className="text-orange-500">*</span>
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => {
                  setSelectedFolderId(e.target.value);
                  setSelectedSubFolderId(''); // reset subfolder selection on parent folder change
                }}
                required
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.items?.length || 0} lists)
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Sub-folder Selector */}
            {flattenedSubs.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Destination Sub-Folder (Optional)</span>
                  <span className="text-[10px] text-zinc-500 lowercase">select section</span>
                </label>
                <select
                  value={selectedSubFolderId}
                  onChange={(e) => setSelectedSubFolderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">(Top Level of Folder)</option>
                  {flattenedSubs.map(({ subFolder: sub, depth }) => (
                    <option key={sub.id} value={sub.id}>
                      {`${'\u00A0\u00A0'.repeat(depth)}📁 ${sub.name}`} ({sub.items?.length || 0} lists)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSameLocation && (
              <div className="bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs px-3 py-2 rounded-[6px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-amber-400 shrink-0">info</span>
                <span>The list is already in this folder location.</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
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
              disabled={isSameLocation || !selectedFolderId || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-[6px] px-4 py-1.5 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">drive_file_move</span>
              <span>{isSubmitting ? 'Moving...' : 'Move List'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
