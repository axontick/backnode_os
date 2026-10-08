import React, { useState, useEffect, useMemo } from 'react';

interface DocsCanvasViewProps {
  onNavigateToTasks: () => void;
  onOpenCreateTask: () => void;
}

export const DocsCanvasView: React.FC<DocsCanvasViewProps> = ({
  onNavigateToTasks,
  onOpenCreateTask,
}) => {
  const [docTitle, setDocTitle] = useState(() => {
    return localStorage.getItem('backnode_docs_canvas_title') || '';
  });

  const [docContent, setDocContent] = useState(() => {
    return localStorage.getItem('backnode_docs_canvas_content') || '';
  });

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [saveStatus, setSaveStatus] = useState<string>('Saved');

  // Persist edits to localStorage
  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem('backnode_docs_canvas_title', docTitle);
      localStorage.setItem('backnode_docs_canvas_content', docContent);
      setSaveStatus('Saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [docTitle, docContent]);

  // Extract outline headings from document content
  const outlineHeadings = useMemo(() => {
    if (!docContent.trim()) return [];
    const lines = docContent.split('\n');
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
  }, [docContent]);

  // Document metrics
  const wordCount = useMemo(() => {
    const trimmed = docContent.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [docContent]);

  const charCount = docContent.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Quick insertion helpers
  const handleInsert = (textToInsert: string) => {
    setDocContent((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
  };

  const handleClearDoc = () => {
    if (docContent.trim() && !window.confirm('Clear document canvas? All unsaved text will be wiped.')) {
      return;
    }
    setDocTitle('');
    setDocContent('');
  };

  // Simple markdown renderer for preview mode
  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="py-16 text-center text-zinc-500">
          <span className="material-symbols-outlined text-[36px] text-zinc-600 mb-2">article</span>
          <p className="text-sm font-semibold text-zinc-400">Empty Document</p>
          <p className="text-xs text-zinc-500 mt-1">
            Switch to Edit mode or type markdown content to preview it here.
          </p>
        </div>
      );
    }

    const lines = text.split('\n');

    return (
      <div className="space-y-3 font-body text-zinc-200 text-xs leading-relaxed">
        {lines.map((line, i) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={i} className="text-xl font-bold text-zinc-100 font-headline pt-3 pb-1 border-b border-[#27272a]">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="text-base font-bold text-zinc-100 font-headline pt-2">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-sm font-semibold text-zinc-200 pt-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={i} className="border-l-2 border-orange-500 pl-3 py-1 bg-orange-950/20 text-zinc-300 rounded-r-[6px] italic">
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
                  className="rounded-[4px] bg-[#18181b] border-[#27272a] text-orange-600 pointer-events-none"
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
              <div key={i} className="p-3 bg-[#18181b] border border-[#27272a] rounded-[6px] font-mono text-[11px] text-orange-300 overflow-x-auto">
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
    <div className="flex-1 flex overflow-hidden bg-[#09090b] select-none text-xs text-zinc-200">
      {/* 1. Left Table of Contents / Outline Rail (240px fixed) */}
      <aside className="w-[240px] shrink-0 border-r border-[#27272a] p-4 bg-[#121214] overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              Document Outline
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {outlineHeadings.length} {outlineHeadings.length === 1 ? 'section' : 'sections'}
            </span>
          </div>

          {outlineHeadings.length === 0 ? (
            <div className="p-3 rounded-[6px] border border-dashed border-[#27272a] bg-[#18181b]/50 text-center">
              <span className="material-symbols-outlined text-[18px] text-zinc-500 mb-1">format_list_bulleted</span>
              <p className="font-mono text-[10px] text-zinc-400">No outline yet</p>
              <p className="font-mono text-[9px] text-zinc-500 mt-1">
                Type `# Title` or `## Section` in the editor to populate sections.
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
                onClick={() => handleInsert('# New Heading')}
                className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
              >
                + # Heading
              </button>
              <button
                type="button"
                onClick={() => handleInsert('- [ ] New action item')}
                className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
              >
                + Task Check
              </button>
              <button
                type="button"
                onClick={() => handleInsert('> Important note or design directive')}
                className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
              >
                + Quote Callout
              </button>
              <button
                type="button"
                onClick={() => handleInsert('```typescript\n// Code snippet\n```')}
                className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-[11px] font-mono text-left truncate cursor-pointer transition-colors"
              >
                + Code Block
              </button>
            </div>
          </div>
        </div>

        {/* Document Analytics Micro Capsule */}
        <div className="p-3 bg-[#18181b] rounded-[6px] border border-[#27272a] space-y-2 mt-6">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-zinc-400">Words / Chars</span>
            <span className="font-semibold text-zinc-100">{wordCount} / {charCount}</span>
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
            <span className="font-mono text-[11px] text-zinc-400">Markdown Specification &amp; Notes</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#18181b] rounded-[6px] p-0.5 border border-[#27272a]">
              {(['edit', 'split', 'preview'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-0.5 rounded-[4px] font-mono text-[10px] transition-colors capitalize cursor-pointer ${
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

            <button
              type="button"
              onClick={handleClearDoc}
              className="px-2.5 py-1 text-xs font-medium border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 rounded-[6px] text-zinc-300 hover:text-red-400 transition-colors cursor-pointer"
              title="Clear canvas"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={onOpenCreateTask}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-[6px] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center">
          <div className="max-w-[860px] w-full flex flex-col gap-4">
            {/* Document Title Header Input */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-sm space-y-2">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Untitled Document / Architecture RFC..."
                className="w-full text-xl md:text-2xl font-bold bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none font-headline"
              />
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                <span>Status: Draft</span>
                <span>•</span>
                <span>Storage: Local SQLite Cache</span>
                <span>•</span>
                <span className="text-emerald-400">{saveStatus}</span>
              </div>
            </div>

            {/* Split / Edit / Preview Workspace */}
            {viewMode === 'split' ? (
              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Editor Column */}
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Type documentation, RFC specs, architecture notes, or task breakdowns here..."
                  className="w-full min-h-[500px] bg-[#121214] border border-[#27272a] rounded-[6px] p-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-y leading-relaxed select-text"
                />

                {/* Live Preview Column */}
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 min-h-[500px] overflow-y-auto custom-scrollbar">
                  {renderMarkdownPreview(docContent)}
                </div>
              </div>
            ) : viewMode === 'edit' ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Type documentation, RFC specs, architecture notes, or task breakdowns here... (Markdown supported)"
                  className="w-full min-h-[540px] bg-[#121214] border border-[#27272a] rounded-[6px] p-5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-y leading-relaxed select-text"
                />
              </div>
            ) : (
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-8 min-h-[540px] shadow-sm">
                {renderMarkdownPreview(docContent)}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
