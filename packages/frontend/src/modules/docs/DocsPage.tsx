import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { DocFolder, DocItem } from '../../types';
import {
  Folder,
  FolderPlus,
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Trash2,
  Edit2,
  Search,
  BookOpen,
} from 'lucide-react';
import { DocsCanvasView } from '../../components/DocsCanvasView';

export const DocsPage: React.FC = () => {
  const {
    docs,
    activeDocId,
    setActiveDocId,
    handleCreateDoc,
    docFolders = [],
    handleCreateDocFolder,
    handleUpdateDocFolder,
    handleDeleteDocFolder,
    showToast,
  } = useWorkspace();

  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  // Modals for folder creation / rename
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [parentFolderIdInput, setParentFolderIdInput] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<DocFolder | null>(null);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleOpenCreateFolder = (parentFolderId: string | null = null) => {
    setEditingFolder(null);
    setFolderNameInput('');
    setParentFolderIdInput(parentFolderId);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder: DocFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderNameInput(folder.name);
    setParentFolderIdInput(folder.parentFolderId || null);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;

    if (editingFolder) {
      await handleUpdateDocFolder(editingFolder.id, {
        name: folderNameInput.trim(),
      });
    } else {
      await handleCreateDocFolder({
        name: folderNameInput.trim(),
        parentFolderId: parentFolderIdInput || undefined,
        icon: 'folder',
        color: '#ea580c',
      });
    }

    setIsFolderModalOpen(false);
    setFolderNameInput('');
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this folder?')) {
      await handleDeleteDocFolder(folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  // Group folders: root folders and child folders
  const rootFolders = useMemo(() => {
    return docFolders.filter((f) => !f.parentFolderId);
  }, [docFolders]);

  const getSubFolders = (parentId: string) => {
    return docFolders.filter((f) => f.parentFolderId === parentId);
  };

  // Filter docs by selected folder
  const filteredDocs = useMemo(() => {
    if (!selectedFolderId) return docs;
    return docs.filter((d) => d.folderId === selectedFolderId);
  }, [docs, selectedFolderId]);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b]">
      {/* ========================================================= */}
      {/* INNER SIDEBAR: Standalone Docs Folder & Hierarchy Rail    */}
      {/* ========================================================= */}
      <aside className="w-[260px] bg-[#121214] border-r border-[#27272a] flex flex-col shrink-0">
        {/* Header */}
        <div className="h-[52px] px-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-headline">
              Documentation Hub
            </span>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => handleOpenCreateFolder(null)}
              className="p-1 rounded-[6px] text-zinc-400 hover:text-orange-400 hover:bg-[#18181b] transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Search */}
        <div className="p-3 border-b border-[#27272a]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search folders & docs..."
              value={folderSearchQuery}
              onChange={(e) => setFolderSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Folder Navigation Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {/* All Documents */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
              selectedFolderId === null
                ? 'bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/30'
                : 'text-zinc-300 hover:bg-[#18181b] hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>All Workspace Docs</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">{docs.length}</span>
          </button>

          {/* Root Folders Tree */}
          <div className="pt-2 pb-1">
            <span className="px-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Folders
            </span>
          </div>

          {rootFolders.map((folder) => {
            const subFolders = getSubFolders(folder.id);
            const isExpanded = !!expandedFolderIds[folder.id];
            const isSelected = selectedFolderId === folder.id;
            const docCount = docs.filter((d) => d.folderId === folder.id).length;

            return (
              <div key={folder.id} className="space-y-0.5">
                <div
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-[6px] text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/30'
                      : 'text-zinc-300 hover:bg-[#18181b] hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {subFolders.length > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFolderExpand(folder.id);
                        }}
                        className="p-0.5 hover:text-orange-400"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-zinc-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                        )}
                      </button>
                    ) : (
                      <span className="w-3.5" />
                    )}
                    <Folder className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isReadOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateFolder(folder.id)}
                          className="p-0.5 rounded text-zinc-400 hover:text-zinc-100"
                          title="Add Subfolder"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditFolder(folder, e)}
                          className="p-0.5 rounded text-zinc-400 hover:text-zinc-100"
                          title="Rename Folder"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="p-0.5 rounded text-zinc-400 hover:text-red-400"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <span className="font-mono text-[10px] text-zinc-500 ml-1">{docCount}</span>
                  </div>
                </div>

                {/* Subfolders */}
                {isExpanded && subFolders.length > 0 && (
                  <div className="pl-6 space-y-0.5 border-l border-[#27272a] ml-3.5 mt-0.5">
                    {subFolders.map((sub) => {
                      const isSubSelected = selectedFolderId === sub.id;
                      const subDocCount = docs.filter((d) => d.folderId === sub.id).length;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedFolderId(sub.id)}
                          className={`group flex items-center justify-between px-2 py-1 rounded-[6px] text-xs cursor-pointer transition-colors ${
                            isSubSelected
                              ? 'bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/30'
                              : 'text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Folder className="w-3 h-3 text-orange-400/70" />
                            <span className="truncate">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteFolder(sub.id, e)}
                                className="p-0.5 rounded text-zinc-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            <span className="font-mono text-[10px] text-zinc-500">
                              {subDocCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {rootFolders.length === 0 && (
            <div className="p-3 text-center text-zinc-500 text-[11px] italic">
              No custom folders yet. Click "+" to create one.
            </div>
          )}
        </div>

        {/* Bottom CTA to add Document */}
        {!isReadOnly && (
          <div className="p-3 border-t border-[#27272a] bg-[#0c0a09]">
            <button
              type="button"
              onClick={() => {
                const newDoc = handleCreateDoc({
                  folderId: selectedFolderId || undefined,
                  title: 'New Architecture Document',
                });
                setActiveDocId(newDoc.id);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Document</span>
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================= */}
      {/* MAIN DOCUMENT CANVAS (DocsCanvasView)                     */}
      {/* ========================================================= */}
      <main className="flex-1 flex overflow-hidden">
        <DocsCanvasView />
      </main>

      {/* Create / Edit Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-2xl text-zinc-100">
            <h3 className="text-sm font-bold font-headline text-zinc-100 mb-1">
              {editingFolder ? 'Rename Documentation Folder' : 'Create Documentation Folder'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Organize internal technical specifications, architecture decisions, and RFCs.
            </p>

            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                  Folder Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="e.g. Architecture RFCs, Runbooks"
                  className="w-full px-2.5 py-1.5 rounded-[6px] text-xs bg-[#18181b] border border-[#27272a] text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  {editingFolder ? 'Save Changes' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
