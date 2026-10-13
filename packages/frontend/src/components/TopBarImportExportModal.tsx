import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SpaceFolder, FolderChildItem } from '../types';
import { getAllItemsFromFolder } from '../utils/treeUtils';
import { exportSpaceToJson, exportSpaceToCsv } from '../utils/spaceImportExportEngine';

export interface TopBarImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'import' | 'export';
  onProceedToImport?: (space: SpaceFolder, listId?: string) => void;
}

export const TopBarImportExportModal: React.FC<TopBarImportExportModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'import',
  onProceedToImport,
}) => {
  const { folders, tasks, statuses, listSettings, showToast, activeSpace } = useWorkspace();
  const [mode, setMode] = useState<'import' | 'export'>(initialMode);

  // Synchronize mode whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Find active space or default to first folder
  const initialFolder = useMemo(() => {
    if (activeSpace) {
      const parent = folders.find(
        (f) => f.items.some((i) => i.id === activeSpace) || f.id === activeSpace
      );
      if (parent) return parent;
    }
    return folders[0] || null;
  }, [folders, activeSpace]);

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(initialFolder?.id || '');
  const [exportScope, setExportScope] = useState<'all' | 'specific'>('all');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const currentSpace = useMemo<SpaceFolder | undefined>(() => {
    return folders.find((f) => f.id === selectedSpaceId) || folders[0];
  }, [folders, selectedSpaceId]);

  const spaceLists: FolderChildItem[] = useMemo(() => {
    return currentSpace ? getAllItemsFromFolder(currentSpace) : [];
  }, [currentSpace]);

  // Reset selected space & list when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultId = initialFolder?.id || folders[0]?.id || '';
      setSelectedSpaceId(defaultId);
      const lists = folders.find((f) => f.id === defaultId) ? getAllItemsFromFolder(folders.find((f) => f.id === defaultId)!) : [];
      const defaultList = activeSpace && lists.some((l) => l.id === activeSpace) ? activeSpace : lists[0]?.id || '';
      setSelectedListId(defaultList);
      setExportScope(activeSpace && lists.some((l) => l.id === activeSpace) ? 'specific' : 'all');
    }
  }, [isOpen, initialFolder, folders, activeSpace]);

  // Update selected list when space changes
  const handleSpaceChange = (newSpaceId: string) => {
    setSelectedSpaceId(newSpaceId);
    const target = folders.find((f) => f.id === newSpaceId);
    const lists = target ? getAllItemsFromFolder(target) : [];
    setSelectedListId(lists[0]?.id || '');
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentSpace) return null;

  // Filter tasks for export preview
  const childListIds = new Set(spaceLists.map((i) => i.id.toLowerCase()));
  const childListNames = new Set(spaceLists.map((i) => i.name.toLowerCase()));

  const spaceTasks = tasks.filter((t) => {
    const tc = (t.targetCycle || '').toLowerCase();
    return childListNames.has(tc) || childListIds.has(tc) || tc.includes(currentSpace.name.toLowerCase());
  });

  const targetListObj = spaceLists.find((l) => l.id === selectedListId);
  const tasksToExport = exportScope === 'specific' && selectedListId
    ? spaceTasks.filter(
        (t) =>
          t.targetCycle.toLowerCase() === selectedListId.toLowerCase() ||
          (targetListObj && t.targetCycle.toLowerCase() === targetListObj.name.toLowerCase())
      )
    : spaceTasks;

  const handleConfirmImport = () => {
    if (onProceedToImport) {
      onProceedToImport(currentSpace, selectedListId || undefined);
    }
    onClose();
  };

  const handleConfirmExport = () => {
    try {
      let content = '';
      let filename = '';
      const dateStr = new Date().toISOString().split('T')[0];
      const safeSpaceName = currentSpace.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      if (exportFormat === 'json') {
        content = exportSpaceToJson(
          currentSpace,
          tasksToExport,
          statuses,
          listSettings,
          exportScope === 'specific' ? selectedListId : undefined
        );
        filename = `${safeSpaceName}-export-${dateStr}.json`;
      } else {
        content = exportSpaceToCsv(
          tasksToExport,
          currentSpace,
          exportScope === 'specific' ? selectedListId : undefined,
          { includeDependencies: true, includeCustomFields: true }
        );
        filename = `${safeSpaceName}-tasks-${dateStr}.csv`;
      }

      const mimeType = exportFormat === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Exported ${tasksToExport.length} tasks as ${exportFormat.toUpperCase()}!`);
      onClose();
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Header with Segmented Switcher & Close */}
        <div className="px-6 py-4 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-0.5 bg-[#18181b] rounded-[6px] flex items-center border border-[#27272a]">
              <button
                type="button"
                onClick={() => setMode('import')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'import'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">upload_file</span>
                <span>Import</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('export')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'export'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>Export</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 p-1 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <kbd className="font-mono text-[10px] bg-[#18181b] border border-[#27272a] px-1 py-0.5 rounded-[6px] text-zinc-400">
              Esc
            </kbd>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 bg-[#121214] text-xs">
          {mode === 'import' ? (
            /* IMPORT CONFIRMATION & SPECIFICATION */
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 font-headline">
                  Import Tasks Confirmation
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Confirm the destination Space and list where your tasks, sprints, or deliverables will be imported.
                </p>
              </div>

              {/* Destination Space Selector */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                  <span>Destination Space</span>
                  <span className="text-orange-500">*</span>
                </label>
                <select
                  value={selectedSpaceId}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.items?.length || 0} lists)
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination List (Optional Default) */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                  Default Target List in Space
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {spaceLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                  {spaceLists.length === 0 && (
                    <option value="">No lists yet (A new list will be created)</option>
                  )}
                </select>
              </div>

              {/* Confirmation Details Callout */}
              <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2">
                <div className="font-mono text-[10px] text-orange-400 uppercase font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span>Payload Specifications</span>
                </div>
                <ul className="text-zinc-400 text-[11px] space-y-1 list-disc list-inside">
                  <li>Accepts CSV or JSON task files with automatic column detection.</li>
                  <li>Columns can be mapped to IDs, titles, assignees, dates, and statuses.</li>
                  <li>Task dependencies and checklist items are preserved and remapped.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* EXPORT CONFIRMATION & SPECIFICATION */
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 font-headline">
                  Export Workspace Data Confirmation
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Specify which Space, list, and file standard you want to export.
                </p>
              </div>

              {/* Source Space Selector */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                  <span>Source Space</span>
                  <span className="text-orange-500">*</span>
                </label>
                <select
                  value={selectedSpaceId}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.items?.length || 0} lists)
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Scope */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                  Export Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportScope('all')}
                    className={`p-2.5 rounded-[6px] border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                      exportScope === 'all'
                        ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                        : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs">Entire Space</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      All lists ({spaceTasks.length} tasks)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope('specific')}
                    className={`p-2.5 rounded-[6px] border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                      exportScope === 'specific'
                        ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                        : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs">Specific List</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Single sprint or cycle</span>
                  </button>
                </div>

                {exportScope === 'specific' && (
                  <div className="pt-1">
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {spaceLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Format Standard */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                  Format Standard
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`p-2.5 rounded-[6px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      exportFormat === 'json'
                        ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                        : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">data_object</span>
                    <span>JSON Archive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-2.5 rounded-[6px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      exportFormat === 'csv'
                        ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                        : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">table_chart</span>
                    <span>CSV Spreadsheet</span>
                  </button>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="px-3.5 py-2.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Total Records to Export:</span>
                <span className="text-orange-400 font-bold">{tasksToExport.length} tasks</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] text-xs font-medium transition-colors cursor-pointer border border-[#27272a]"
          >
            Cancel
          </button>

          {mode === 'import' ? (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">upload_file</span>
              <span>Proceed to Import</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmExport}
              className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Confirm &amp; Export</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
