import React, { useState, useEffect } from 'react';
import { DocItem, DocClassification } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

export interface DocSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
  onDeleteDoc?: (doc: DocItem) => void;
}

export const DocSettingsModal: React.FC<DocSettingsModalProps> = ({
  isOpen,
  onClose,
  doc,
  onDeleteDoc,
}) => {
  const { docFolders, handleUpdateDoc, showToast } = useWorkspace();

  const [title, setTitle] = useState('');
  const [classification, setClassification] = useState<DocClassification>('Internal');
  const [folderId, setFolderId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [authorDepartment, setAuthorDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && doc) {
      setTitle(doc.title || '');
      setClassification(doc.classification || 'Internal');
      setFolderId(doc.folderId || '');
      setTags(doc.tags || []);
      setTagInput('');
      setAuthorDepartment(doc.authorDepartment || '');
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

  if (!isOpen || !doc) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await handleUpdateDoc(doc.id, {
        title: title.trim(),
        classification,
        folderId: folderId.trim() ? folderId : undefined,
        tags,
        authorDepartment: authorDepartment.trim() || undefined,
      });
      showToast(`Document settings updated`);
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
        aria-labelledby="doc-settings-title"
        className="w-[500px] max-w-full bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Document Settings
              </span>
              <h2 id="doc-settings-title" className="text-sm font-bold text-zinc-100 font-headline">
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Document Title */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                <span>Document Title</span>
                <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Classification */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                <span>Security Classification (ABAC)</span>
                <span className="text-orange-500">*</span>
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as DocClassification)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Public">Public — Universal visibility across all operators</option>
                <option value="Internal">Internal — Standard workspace collaborator access</option>
                <option value="Confidential">Confidential — Department clearance restricted</option>
                <option value="Restricted">Restricted — Author &amp; Owner strict clearance</option>
              </select>
            </div>

            {/* Folder Placement */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400 flex items-center justify-between">
                <span>Folder Placement</span>
                <span className="text-[10px] text-zinc-500 lowercase">organization</span>
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
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

            {/* Author Department */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Author Department
              </label>
              <input
                type="text"
                value={authorDepartment}
                onChange={(e) => setAuthorDepartment(e.target.value)}
                placeholder="e.g. Engineering, Product, Security"
                className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-semibold text-zinc-400">
                Document Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag and press Add"
                  className="flex-1 px-3 py-1.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-300 bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded-[6px]"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-zinc-500 hover:text-red-400 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata Preview */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 text-[11px] text-zinc-500 font-mono space-y-1">
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="text-zinc-400">
                  {new Date(doc.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-zinc-400">
                  {new Date(doc.updatedAt || doc.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Author:</span>
                <span className="text-zinc-300">{doc.authorName} ({doc.authorInitials || 'OP'})</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-3.5 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between">
            {onDeleteDoc ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteDoc(doc);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="border border-[#27272a] bg-[#121214] hover:bg-zinc-800 rounded-[6px] px-3.5 py-1.5 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-[6px] px-4 py-1.5 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">save</span>
                <span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
