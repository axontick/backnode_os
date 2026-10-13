import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { DocItem, DocClassification } from '../types';
import { SecurityPolicy, SecurityUserContext } from '../utils/security';
import { ActionContextMenu } from './ActionContextMenu';
import { DocSettingsModal } from './DocSettingsModal';
import { MoveDocModal } from './MoveDocModal';

interface DocsCanvasViewProps {
  onNavigateToTasks?: () => void;
  onOpenCreateTask?: () => void;
}

export const DocsCanvasView: React.FC<DocsCanvasViewProps> = ({
  onNavigateToTasks,
  onOpenCreateTask,
}) => {
  const {
    docs,
    activeDocId,
    setActiveDocId,
    handleCreateDoc,
    handleUpdateDoc,
    handleDeleteDoc,
    handleDuplicateDoc,
  } = useWorkspace();

  const { user, effectiveRole, effectiveDepartment } = useAuth();

  const currentUserContext: SecurityUserContext = useMemo(
    () => ({
      id: user?.id || 'usr-operator',
      name: user?.name || 'Operator',
      email: user?.email || 'operator@backnode.io',
      role: effectiveRole,
      department: effectiveDepartment,
    }),
    [user, effectiveRole, effectiveDepartment]
  );

  const isReadOnly = SecurityPolicy.isReadOnly(currentUserContext);

  // Active document
  const activeDoc = useMemo(() => {
    return docs.find((d) => d.id === activeDocId) || docs[0];
  }, [docs, activeDocId]);

  // Sidebar tab: 'docs' list or 'outline'
  const [sidebarTab, setSidebarTab] = useState<'docs' | 'outline'>('docs');
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'All' | DocClassification>('All');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocClassification, setNewDocClassification] = useState<DocClassification>('Internal');
  const [newDocTag, setNewDocTag] = useState('');
  const [docToDelete, setDocToDelete] = useState<DocItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [docForSettings, setDocForSettings] = useState<DocItem | null>(null);
  const [docToMove, setDocToMove] = useState<DocItem | null>(null);

  // Editable local buffers
  const [localTitle, setLocalTitle] = useState(activeDoc?.title || '');
  const [localContent, setLocalContent] = useState(activeDoc?.content || '');

  // Keep local buffers synced when active document switches
  useEffect(() => {
    if (activeDoc) {
      setLocalTitle(activeDoc.title);
      setLocalContent(activeDoc.content);
    }
  }, [activeDoc?.id]);

  // Debounced auto-save to WorkspaceContext
  useEffect(() => {
    if (!activeDoc || isReadOnly) return;
    if (localTitle === activeDoc.title && localContent === activeDoc.content) {
      return;
    }

    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      handleUpdateDoc(activeDoc.id, {
        title: localTitle,
        content: localContent,
      });
      setSaveStatus('Saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [localTitle, localContent, activeDoc?.id, isReadOnly]);

  // ABAC permission check for active doc
  const canEditActiveDoc = useMemo(() => {
    if (!activeDoc) return false;
    return SecurityPolicy.canEdit(currentUserContext, {
      id: activeDoc.id,
      type: 'doc',
      classification: activeDoc.classification,
      department: activeDoc.authorDepartment,
      authorName: activeDoc.authorName,
    });
  }, [currentUserContext, activeDoc]);

  // Filtered documents list
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const matchesSearch =
        searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.authorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClassification =
        classificationFilter === 'All' || doc.classification === classificationFilter;

      return matchesSearch && matchesClassification;
    });
  }, [docs, searchQuery, classificationFilter]);

  // Outline headings from content
  const outlineHeadings = useMemo(() => {
    if (!localContent.trim()) return [];
    const lines = localContent.split('\n');
    const headings: { level: number; text: string; lineIndex: number }[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        headings.push({ level: 1, text: line.replace('# ', '').trim(), lineIndex: index });
      } else if (line.startsWith('## ')) {
        headings.push({ level: 2, text: line.replace('## ', '').trim(), lineIndex: index });
      } else if (line.startsWith('### ')) {
        headings.push({ level: 3, text: line.replace('### ', '').trim(), lineIndex: index });
      }
    });

    return headings;
  }, [localContent]);

  // Document metrics
  const wordCount = useMemo(() => {
    const trimmed = localContent.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [localContent]);

  const charCount = localContent.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Snippet inserter
  const handleInsert = (textToInsert: string) => {
    if (!canEditActiveDoc || isReadOnly) return;
    setLocalContent((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
  };

  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const blob = new Blob([localContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${localTitle.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'document'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateNewDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    const created = handleCreateDoc({
      title: newDocTitle.trim(),
      classification: newDocClassification,
      tags: newDocTag.trim() ? [newDocTag.trim()] : ['Specification'],
      content: `# ${newDocTitle.trim()}\n\n## Overview\nDocument created in Backnode OS.`,
    });
    setNewDocTitle('');
    setNewDocTag('');
    setIsCreateModalOpen(false);
    setActiveDocId(created.id);
  };

  const getClassificationColor = (classification: DocClassification) => {
    switch (classification) {
      case 'Public':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'Internal':
        return 'text-orange-400 bg-orange-950/40 border-orange-500/30';
      case 'Confidential':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'Restricted':
        return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
      default:
        return 'text-zinc-400 bg-[#18181b] border-[#27272a]';
    }
  };

  // Simple markdown renderer for preview mode
  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="py-16 text-center text-zinc-500">
          <span className="material-symbols-outlined text-[36px] text-zinc-600 mb-2">article</span>
          <p className="text-sm font-semibold text-zinc-400">Empty Document</p>
          <p className="text-xs text-zinc-500 mt-1">
            Type markdown content in the editor to render the preview.
          </p>
        </div>
      );
    }

    const lines = text.split('\n');

    return (
      <div className="space-y-3 font-body text-zinc-200 text-xs leading-relaxed select-text">
        {lines.map((line, i) => {
          if (line.startsWith('# ')) {
            return (
              <h1
                key={i}
                className="text-xl font-bold text-zinc-100 font-headline pt-3 pb-1 border-b border-[#27272a]"
              >
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="text-base font-bold text-zinc-100 font-headline pt-3 pb-0.5">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-sm font-semibold text-zinc-200 pt-1.5">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={i}
                className="border-l-2 border-orange-500 pl-3 py-1.5 bg-orange-950/20 text-zinc-300 rounded-r-[6px] italic my-2"
              >
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const isChecked = line.startsWith('- [x] ');
            return (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="rounded-[6px] bg-[#18181b] border-[#27272a] text-orange-600 pointer-events-none"
                />
                <span className={isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                  {line.replace(/- \[[ x]\] /, '')}
                </span>
              </div>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={i} className="flex items-start gap-2 pl-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{line.replace(/^[-*] /, '')}</span>
              </div>
            );
          }
          if (line.startsWith('```')) {
            return (
              <div
                key={i}
                className="p-3 bg-[#18181b] border border-[#27272a] rounded-[6px] font-mono text-[11px] text-orange-300 overflow-x-auto my-2"
              >
                {line.replace(/```[a-z]*/g, '')}
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={i} className="h-2" />;
          }

          return <p key={i}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b] text-xs text-zinc-200">
      {/* 1. Left Documents Directory & Outline Rail (280px fixed) */}
      <aside className="w-[280px] shrink-0 border-r border-[#27272a] bg-[#121214] flex flex-col justify-between overflow-hidden">
        {/* Rail Top Bar Tabs */}
        <div className="flex flex-col border-b border-[#27272a] bg-[#0c0a09]/50">
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-1 bg-[#18181b] p-0.5 rounded-[6px] border border-[#27272a]">
              <button
                type="button"
                onClick={() => setSidebarTab('docs')}
                className={`px-3 py-1 rounded-[6px] font-mono text-[10px] font-semibold transition-colors cursor-pointer ${
                  sidebarTab === 'docs'
                    ? 'bg-[#27272a] text-orange-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Docs ({docs.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('outline')}
                className={`px-3 py-1 rounded-[6px] font-mono text-[10px] font-semibold transition-colors cursor-pointer ${
                  sidebarTab === 'outline'
                    ? 'bg-[#27272a] text-orange-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Outline ({outlineHeadings.length})
              </button>
            </div>

            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 rounded-[6px] bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white cursor-pointer transition-colors shadow-xs"
              title="Create New Document"
            >
              <span className="material-symbols-outlined text-[16px] block">add</span>
            </button>
          </div>

          {/* Search & Filter when viewing Docs tab */}
          {sidebarTab === 'docs' && (
            <div className="px-3 pb-3 space-y-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-zinc-500">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search docs & RFCs..."
                  className="w-full pl-8 pr-2.5 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {/* Classification filter chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                {(['All', 'Public', 'Internal', 'Confidential', 'Restricted'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setClassificationFilter(c)}
                    className={`px-2 py-0.5 rounded-[6px] text-[10px] font-mono shrink-0 transition-colors cursor-pointer ${
                      classificationFilter === c
                        ? 'bg-orange-600 text-white font-semibold'
                        : 'bg-[#18181b] text-zinc-400 border border-[#27272a] hover:text-zinc-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rail Middle List Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {sidebarTab === 'docs' ? (
            filteredDocs.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 space-y-1">
                <span className="material-symbols-outlined text-[24px] text-zinc-600">description</span>
                <p className="text-xs font-semibold text-zinc-400">No documents found</p>
                <p className="text-[11px] text-zinc-500">
                  {searchQuery ? 'Try changing your search query.' : 'Click + to create your first document.'}
                </p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = doc.id === activeDoc?.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`p-2.5 rounded-[6px] border transition-all cursor-pointer group flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-orange-950/30 border-orange-500/50 shadow-xs'
                        : 'bg-[#18181b]/50 border-transparent hover:border-[#27272a] hover:bg-[#18181b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-semibold text-xs truncate flex-1 min-w-0 ${
                          isActive ? 'text-orange-400' : 'text-zinc-200 group-hover:text-zinc-100'
                        }`}
                      >
                        {doc.title || 'Untitled Document'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`px-1.5 py-0.2 rounded-[6px] font-mono text-[9px] border font-bold shrink-0 ${getClassificationColor(
                            doc.classification
                          )}`}
                        >
                          {doc.classification}
                        </span>
                        {!isReadOnly && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === `doc-${doc.id}` ? null : `doc-${doc.id}`);
                              }}
                              aria-haspopup="menu"
                              aria-expanded={activeMenuId === `doc-${doc.id}`}
                              className={`w-5 h-5 rounded-[6px] hover:bg-zinc-700 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
                                activeMenuId === `doc-${doc.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Document actions"
                            >
                              <span className="material-symbols-outlined text-[14px]">more_vert</span>
                            </button>
                            <ActionContextMenu
                              isOpen={activeMenuId === `doc-${doc.id}`}
                              onClose={() => setActiveMenuId(null)}
                              items={[
                                {
                                  label: 'Doc Settings',
                                  icon: 'tune',
                                  iconColor: 'text-orange-400',
                                  onClick: () => {
                                    setDocForSettings(doc);
                                  },
                                },
                                {
                                  label: 'Move to Folder',
                                  icon: 'drive_file_move',
                                  iconColor: 'text-zinc-300',
                                  onClick: () => {
                                    setDocToMove(doc);
                                  },
                                },
                                {
                                  label: 'Duplicate Doc',
                                  icon: 'content_copy',
                                  iconColor: 'text-zinc-300',
                                  onClick: () => {
                                    handleDuplicateDoc(doc.id);
                                  },
                                },
                                {
                                  label: 'Delete Document',
                                  icon: 'delete',
                                  danger: true,
                                  onClick: () => {
                                    setDocToDelete(doc);
                                  },
                                },
                              ]}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[9px] font-bold">
                          {doc.authorInitials || 'OP'}
                        </span>
                        <span className="truncate max-w-[90px]">{doc.authorName}</span>
                      </div>
                      <span>
                        {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Tags preview */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1 overflow-hidden">
                        {doc.tags.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[9px] text-zinc-400 bg-[#121214] px-1 rounded-[6px] border border-[#27272a] truncate"
                          >
                            #{t}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="font-mono text-[9px] text-zinc-500">
                            +{doc.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            // Outline Tab Content
            <div className="space-y-4 p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Active Sections
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {outlineHeadings.length} {outlineHeadings.length === 1 ? 'heading' : 'headings'}
                </span>
              </div>

              {outlineHeadings.length === 0 ? (
                <div className="p-3 rounded-[6px] border border-dashed border-[#27272a] bg-[#18181b]/50 text-center">
                  <span className="material-symbols-outlined text-[18px] text-zinc-500 mb-1">
                    format_list_bulleted
                  </span>
                  <p className="font-mono text-[10px] text-zinc-400">No outline headings</p>
                  <p className="font-mono text-[9px] text-zinc-500 mt-1">
                    Type `# Title` or `## Section` in the editor to structure your document.
                  </p>
                </div>
              ) : (
                <nav className="space-y-1">
                  {outlineHeadings.map((h, idx) => (
                    <div
                      key={idx}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors truncate ${
                        h.level === 1
                          ? 'font-semibold text-zinc-100 hover:bg-[#18181b]'
                          : h.level === 2
                          ? 'pl-5 text-zinc-300 hover:bg-[#18181b]'
                          : 'pl-8 text-zinc-400 hover:bg-[#18181b]'
                      }`}
                    >
                      <span className="truncate">{h.text || `Heading ${idx + 1}`}</span>
                      <span className="font-mono text-[9px] text-zinc-500 shrink-0">H{h.level}</span>
                    </div>
                  ))}
                </nav>
              )}

              {/* Quick Insert Actions */}
              <div className="pt-2 border-t border-[#27272a] space-y-1.5">
                <div className="font-mono text-[10px] uppercase text-zinc-500 font-semibold">
                  Insert Snippets
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleInsert('# New Section')}
                    className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
                  >
                    + # Heading
                  </button>
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleInsert('- [ ] Action item deliverables')}
                    className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
                  >
                    + Task Check
                  </button>
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleInsert('> Architectural invariant or security directive')}
                    className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
                  >
                    + Callout
                  </button>
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleInsert('```typescript\n// Spec code\n```')}
                    className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
                  >
                    + Code Block
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rail Footer Micro Telemetry */}
        <div className="p-3 bg-[#18181b] border-t border-[#27272a] space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-zinc-400">Words / Chars</span>
            <span className="font-semibold text-zinc-100">
              {wordCount} / {charCount}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
            <span>Read time: ~{readingTimeMinutes} min</span>
            <span className="text-emerald-400 font-semibold">{saveStatus}</span>
          </div>
        </div>
      </aside>

      {/* 2. Central Editorial Reading & Writing Canvas */}
      <section className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {/* Document Top Toolbar */}
        <div className="h-11 px-6 bg-[#121214] border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-[6px] font-semibold">
              DOC CANVAS
            </span>
            <span className="text-zinc-600">•</span>
            {/* Classification Selector */}
            <select
              value={activeDoc?.classification || 'Internal'}
              disabled={isReadOnly || !canEditActiveDoc}
              onChange={(e) => {
                if (activeDoc) {
                  handleUpdateDoc(activeDoc.id, {
                    classification: e.target.value as DocClassification,
                  });
                }
              }}
              className="bg-[#18181b] border border-[#27272a] rounded-[6px] px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-200 outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50"
            >
              <option value="Public">Public (Universal View)</option>
              <option value="Internal">Internal (Workspace Members)</option>
              <option value="Confidential">Confidential (Dept Clearance)</option>
              <option value="Restricted">Restricted (Author &amp; Owner)</option>
            </select>

            {isReadOnly && (
              <span className="px-2 py-0.5 rounded-[6px] bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                VIEWER READ-ONLY
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#18181b] rounded-[6px] p-0.5 border border-[#27272a]">
              {(['edit', 'split', 'preview'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-0.5 rounded-[6px] font-mono text-[10px] transition-colors capitalize cursor-pointer ${
                    viewMode === mode
                      ? 'bg-[#27272a] text-orange-400 font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[#27272a]"></div>

            {/* Quick Actions */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => activeDoc && handleDuplicateDoc(activeDoc.id)}
              className="px-2.5 py-1 text-xs font-medium border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 disabled:opacity-40 rounded-[6px] text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
              title="Duplicate document"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-2.5 py-1 text-xs font-medium border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 rounded-[6px] text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
              title="Export as markdown"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>Export</span>
            </button>

            <button
              type="button"
              disabled={isReadOnly || !canEditActiveDoc}
              onClick={() => {
                if (activeDoc) {
                  setDocToDelete(activeDoc);
                }
              }}
              className="px-2.5 py-1 text-xs font-medium border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40 rounded-[6px] text-zinc-300 transition-colors cursor-pointer"
              title="Delete document"
            >
              Delete
            </button>

            {activeDoc && !isReadOnly && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuId(activeMenuId === 'toolbar-doc-menu' ? null : 'toolbar-doc-menu');
                  }}
                  aria-haspopup="menu"
                  aria-expanded={activeMenuId === 'toolbar-doc-menu'}
                  className={`w-7 h-7 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 flex items-center justify-center transition-colors cursor-pointer ${
                    activeMenuId === 'toolbar-doc-menu' ? 'text-orange-400 border-orange-500/50' : ''
                  }`}
                  title="Document options"
                >
                  <span className="material-symbols-outlined text-[16px]">more_vert</span>
                </button>
                <ActionContextMenu
                  isOpen={activeMenuId === 'toolbar-doc-menu'}
                  onClose={() => setActiveMenuId(null)}
                  items={[
                    {
                      label: 'Doc Settings',
                      icon: 'tune',
                      iconColor: 'text-orange-400',
                      onClick: () => {
                        setDocForSettings(activeDoc);
                      },
                    },
                    {
                      label: 'Move to Folder',
                      icon: 'drive_file_move',
                      iconColor: 'text-zinc-300',
                      onClick: () => {
                        setDocToMove(activeDoc);
                      },
                    },
                    {
                      label: 'Duplicate Doc',
                      icon: 'content_copy',
                      iconColor: 'text-zinc-300',
                      onClick: () => {
                        handleDuplicateDoc(activeDoc.id);
                      },
                    },
                    ...(canEditActiveDoc
                      ? [
                          {
                            label: 'Delete Document',
                            icon: 'delete',
                            danger: true,
                            onClick: () => {
                              setDocToDelete(activeDoc);
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center">
          {!activeDoc ? (
            <div className="max-w-[480px] w-full m-auto text-center flex flex-col items-center justify-center p-8 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-sm">
              <div className="w-12 h-12 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4">
                <span className="material-symbols-outlined text-[28px]">description</span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100 font-headline mb-1.5">No Documents in Workspace</h3>
              <p className="text-xs text-zinc-400 mb-5 max-w-sm leading-relaxed">
                Create documentation, technical specifications, and architecture RFCs for your team.
              </p>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const newDoc = handleCreateDoc({
                      title: 'New Architecture Document',
                    });
                    setActiveDocId(newDoc.id);
                  }}
                  className="px-3.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Create First Document</span>
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-[860px] w-full flex flex-col gap-4">
              {/* Document Title Header Input */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-sm space-y-3">
                <input
                  type="text"
                  value={localTitle}
                  readOnly={isReadOnly || !canEditActiveDoc}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Untitled Document / Architecture RFC..."
                  className="w-full text-xl md:text-2xl font-bold bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none font-headline disabled:opacity-70"
                />
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="text-zinc-500">Author:</span>
                    <span className="text-zinc-200">{activeDoc.authorName || 'Current User'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-zinc-500">Dept:</span>
                    <span className="text-orange-400">{activeDoc.authorDepartment || 'Engineering'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-zinc-500">Clearance:</span>
                    <span className={`px-1.5 py-0.2 rounded-[6px] border ${getClassificationColor(activeDoc.classification || 'Internal')}`}>
                      {activeDoc.classification || 'Internal'}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400">{saveStatus}</span>
                </div>
              </div>

              {/* Split / Edit / Preview Workspace */}
              {viewMode === 'split' ? (
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {/* Editor Column */}
                  <textarea
                    value={localContent}
                    readOnly={isReadOnly || !canEditActiveDoc}
                    onChange={(e) => setLocalContent(e.target.value)}
                    placeholder="Type documentation, RFC specs, architecture notes, or task breakdowns here..."
                    className="w-full min-h-[500px] bg-[#121214] border border-[#27272a] rounded-[6px] p-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-y leading-relaxed select-text disabled:opacity-60"
                  />

                  {/* Live Preview Column */}
                  <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 min-h-[500px] overflow-y-auto custom-scrollbar">
                    {renderMarkdownPreview(localContent)}
                  </div>
                </div>
              ) : viewMode === 'edit' ? (
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={localContent}
                    readOnly={isReadOnly || !canEditActiveDoc}
                    onChange={(e) => setLocalContent(e.target.value)}
                    placeholder="Type documentation, RFC specs, architecture notes, or task breakdowns here... (Markdown supported)"
                    className="w-full min-h-[540px] bg-[#121214] border border-[#27272a] rounded-[6px] p-5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-y leading-relaxed select-text disabled:opacity-60"
                  />
                </div>
              ) : (
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-8 min-h-[540px] shadow-sm">
                  {renderMarkdownPreview(localContent)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* New Document Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-100 font-headline">Create New Document</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewDocSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine RFC"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-sans"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Security Classification (ABAC)
                </label>
                <select
                  value={newDocClassification}
                  onChange={(e) => setNewDocClassification(e.target.value as DocClassification)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] focus:outline-none focus:border-orange-500 font-mono cursor-pointer"
                >
                  <option value="Public">Public — Universal visibility</option>
                  <option value="Internal">Internal — All workspace collaborators</option>
                  <option value="Confidential">Confidential — Department clearance only</option>
                  <option value="Restricted">Restricted — Author &amp; Owner only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Primary Tag
                </label>
                <input
                  type="text"
                  value={newDocTag}
                  onChange={(e) => setNewDocTag(e.target.value)}
                  placeholder="e.g. Architecture, Compliance, RFC"
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-[13px] placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setDocToDelete(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-[480px] max-w-full bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#121214]">
              <div className="flex items-center gap-2 text-rose-500">
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                <h3 className="font-bold text-sm text-zinc-100 font-headline">Delete Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-3 bg-[#121214] text-xs text-zinc-300">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-zinc-100 font-mono">&ldquo;{docToDelete.title}&rdquo;</strong>?
              </p>
              <p className="text-[11px] text-zinc-500">
                This document and its classification policies will be permanently removed from this workspace.
              </p>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#121214] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-1.5 rounded-[6px] border border-[#27272a] text-xs font-medium text-zinc-300 hover:bg-[#18181b] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteDoc(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doc Settings Modal */}
      {docForSettings && (
        <DocSettingsModal
          isOpen={!!docForSettings}
          onClose={() => setDocForSettings(null)}
          doc={docForSettings}
        />
      )}

      {/* Move Doc Modal */}
      {docToMove && (
        <MoveDocModal
          isOpen={!!docToMove}
          onClose={() => setDocToMove(null)}
          doc={docToMove}
        />
      )}
    </div>
  );
};
