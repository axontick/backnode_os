import React, { useState, useEffect, useMemo } from 'react';
import { SpaceFolder } from '../types';
import { flattenSubFolders } from '../utils/treeUtils';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: SpaceFolder[];
  defaultFolder?: SpaceFolder | null;
  defaultSubFolderId?: string | null;
  onCreateList: (folderId: string, listName: string, status?: string, subFolderId?: string) => void;
}

export const NewListModal: React.FC<NewListModalProps> = ({
  isOpen,
  onClose,
  folders,
  defaultFolder,
  defaultSubFolderId,
  onCreateList,
}) => {
  const [listName, setListName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string>('');
  const [status, setStatus] = useState<string>('Active');

  useEffect(() => {
    if (isOpen) {
      setListName('');
      setStatus('Active');
      if (defaultSubFolderId) {
        const parentFolder = folders.find((f) =>
          flattenSubFolders(f.subFolders).some((s) => s.subFolder.id === defaultSubFolderId)
        );
        if (parentFolder) {
          setSelectedFolderId(parentFolder.id);
          setSelectedSubFolderId(defaultSubFolderId);
          return;
        }
      }
      if (defaultFolder && folders.some((f) => f.id === defaultFolder.id)) {
        setSelectedFolderId(defaultFolder.id);
      } else if (folders.length > 0) {
        setSelectedFolderId(folders[0].id);
      } else {
        setSelectedFolderId('');
      }
      setSelectedSubFolderId(defaultSubFolderId || '');
    }
  }, [isOpen, defaultFolder, defaultSubFolderId, folders]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const flattenedSubs = useMemo(
    () => (selectedFolder?.subFolders ? flattenSubFolders(selectedFolder.subFolders) : []),
    [selectedFolder]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim() || !selectedFolderId) return;
    onCreateList(selectedFolderId, listName.trim(), status, selectedSubFolderId || undefined);
    setListName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-w-full max-h-[90vh] bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="shrink-0 p-5 pb-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">playlist_add</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-zinc-100 leading-tight font-headline">
                Add Deliverable List
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Create a new backlog, sprint cycle, or view under a folder.
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
            {/* List Name */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>List / Cycle Name</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Sprint 15 - Core Runtime, Phase Beta, Hotfixes"
                className="w-full px-3.5 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 text-sm font-medium focus:outline-none transition-all"
              />
            </div>

            {/* Target Folder Selector */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                <span>Target Folder</span>
                <span className="text-orange-500">*</span>
              </label>
              {folders.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name} ({folder.items?.length || 0} lists)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-amber-400 bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-[6px]">
                  No folders exist yet. Please create a folder first before adding lists.
                </p>
              )}
            </div>

            {flattenedSubs.length > 0 && (
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Sub-folder (Optional)</span>
                  <span className="text-[10px] text-zinc-500 lowercase">select section</span>
                </label>
                <select
                  value={selectedSubFolderId}
                  onChange={(e) => setSelectedSubFolderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">(None - Top Level of Folder)</option>
                  {flattenedSubs.map(({ subFolder: sub, depth }) => (
                    <option key={sub.id} value={sub.id}>
                      {`${'\u00A0\u00A0'.repeat(depth)}📁 ${sub.name}`} ({sub.items?.length || 0} lists)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Folder Context Preview */}
            {selectedFolder && (
              <div className="p-3 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: selectedFolder.color || '#ea580c' }}
                  >
                    {selectedFolder.icon || 'folder'}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      {selectedFolder.name}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      {selectedFolder.description || 'Workspace folder'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-[4px] bg-zinc-800 text-zinc-400">
                  {selectedFolder.items?.length || 0} existing lists
                </span>
              </div>
            )}

            {/* Initial Status */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Initial List Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Active">Active (Current Cadence)</option>
                <option value="Planning">Planning (Future Scope)</option>
                <option value="Backlog">Backlog (Queued)</option>
                <option value="Review">Review (Quality Gate)</option>
              </select>
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
              disabled={!listName.trim() || !selectedFolderId}
              className="px-5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Create List</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
