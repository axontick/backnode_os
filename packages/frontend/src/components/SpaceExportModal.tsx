import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SpaceFolder, FolderChildItem } from '../types';
import { getAllItemsFromFolder } from '../utils/treeUtils';
import { exportSpaceToJson, exportSpaceToCsv } from '../utils/spaceImportExportEngine';

interface SpaceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSpace?: SpaceFolder | null;
  defaultListId?: string | null;
}

export const SpaceExportModal: React.FC<SpaceExportModalProps> = ({
  isOpen,
  onClose,
  defaultSpace,
  defaultListId,
}) => {
  const { folders, tasks, statuses, listSettings, showToast } = useWorkspace();

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    defaultSpace?.id || folders[0]?.id || ''
  );
  const targetSpace = useMemo<SpaceFolder | undefined>(
    () => folders.find((f) => f.id === selectedSpaceId) || defaultSpace || folders[0],
    [folders, selectedSpaceId, defaultSpace]
  );

  const spaceLists: FolderChildItem[] = useMemo(() => {
    return targetSpace ? getAllItemsFromFolder(targetSpace) : [];
  }, [targetSpace]);

  // Export Options State
  const [exportScope, setExportScope] = useState<'all' | 'specific'>(
    defaultListId ? 'specific' : 'all'
  );
  const [selectedListId, setSelectedListId] = useState<string>(
    defaultListId || spaceLists[0]?.id || ''
  );
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [includeDependencies, setIncludeDependencies] = useState<boolean>(true);
  const [includeCustomFields, setIncludeCustomFields] = useState<boolean>(true);

  const resetExportState = useCallback(() => {
    setSelectedSpaceId(defaultSpace?.id || folders[0]?.id || '');
    setExportScope(defaultListId ? 'specific' : 'all');
    setSelectedListId(defaultListId || spaceLists[0]?.id || '');
    setExportFormat('json');
    setIncludeDependencies(true);
    setIncludeCustomFields(true);
  }, [defaultSpace, defaultListId, folders, spaceLists]);

  const handleClose = useCallback(() => {
    resetExportState();
    onClose();
  }, [resetExportState, onClose]);

  // Reset export state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      resetExportState();
    }
  }, [isOpen, resetExportState]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !targetSpace) return null;

  // Filter tasks belonging to target space / selected list
  const childListIds = new Set(spaceLists.map((i) => i.id.toLowerCase()));
  const childListNames = new Set(spaceLists.map((i) => i.name.toLowerCase()));

  const spaceTasks = tasks.filter((t) => {
    const tc = (t.targetCycle || '').toLowerCase();
    return childListNames.has(tc) || childListIds.has(tc) || tc.includes(targetSpace.name.toLowerCase());
  });

  const targetListObj = spaceLists.find((l) => l.id === selectedListId);
  const filteredTasks = exportScope === 'specific' && selectedListId
    ? spaceTasks.filter(
        (t) =>
          t.targetCycle.toLowerCase() === selectedListId.toLowerCase() ||
          (targetListObj && t.targetCycle.toLowerCase() === targetListObj.name.toLowerCase())
      )
    : spaceTasks;

  const handleDownload = () => {
    try {
      let content = '';
      let filename = '';
      const dateStr = new Date().toISOString().split('T')[0];
      const safeSpaceName = targetSpace.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      if (exportFormat === 'json') {
        content = exportSpaceToJson(
          targetSpace,
          filteredTasks,
          statuses,
          listSettings,
          exportScope === 'specific' ? selectedListId : undefined
        );
        filename = `${safeSpaceName}-export-${dateStr}.json`;
      } else {
        content = exportSpaceToCsv(
          filteredTasks,
          targetSpace,
          exportScope === 'specific' ? selectedListId : undefined,
          { includeDependencies, includeCustomFields }
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

      showToast(`Exported ${filteredTasks.length} tasks as ${exportFormat.toUpperCase()}!`);
      onClose();
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      let content = '';
      if (exportFormat === 'json') {
        content = exportSpaceToJson(
          targetSpace,
          filteredTasks,
          statuses,
          listSettings,
          exportScope === 'specific' ? selectedListId : undefined
        );
      } else {
        content = exportSpaceToCsv(
          filteredTasks,
          targetSpace,
          exportScope === 'specific' ? selectedListId : undefined,
          { includeDependencies, includeCustomFields }
        );
      }

      await navigator.clipboard.writeText(content);
      showToast(`Copied ${filteredTasks.length} tasks to clipboard in ${exportFormat.toUpperCase()} format!`);
      handleClose();
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0c0a09] border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: targetSpace.color || '#ea580c' }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {targetSpace.icon || 'folder_open'}
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight font-headline">
                Export Space Data
              </h2>
              <p className="text-[11px] text-zinc-400">
                Generate structured JSON backup or spreadsheet-ready CSV.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Target Space Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 font-mono">
              Source Space:
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="h-[34px] px-2.5 rounded-[6px] text-[13px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 outline-none"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.items?.length || 0} lists)
                </option>
              ))}
            </select>
          </div>

          {/* Export Scope */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 font-mono">
              Export Scope:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-[6px] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">folder_copy</span>
                  <span className="text-xs">Entire Space</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  All lists & subfolders ({spaceTasks.length} tasks)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('specific')}
                className={`p-3 rounded-[6px] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  exportScope === 'specific'
                    ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">list_alt</span>
                  <span className="text-xs">Specific List</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Export single list sprint
                </span>
              </button>
            </div>

            {exportScope === 'specific' && (
              <div className="mt-1">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full h-[34px] px-2.5 rounded-[6px] text-[13px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 outline-none"
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

          {/* Export Format */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 font-mono">
              Format Standard:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-[6px] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">data_object</span>
                  <span className="text-xs">JSON Archive</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Full hierarchical structure & statuses
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-[6px] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'bg-orange-950/40 border-orange-500/40 text-orange-400 font-semibold'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  <span className="text-xs">CSV Spreadsheet</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Tabular RFC 4180 Excel format
                </span>
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="p-3.5 rounded-[6px] bg-[#18181b]/50 border border-[#27272a] flex flex-col gap-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
              Payload Inclusions:
            </span>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDependencies}
                onChange={(e) => setIncludeDependencies(e.target.checked)}
                className="accent-orange-600 rounded-[3px]"
              />
              <span>Include task dependency mapping IDs</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCustomFields}
                onChange={(e) => setIncludeCustomFields(e.target.checked)}
                className="accent-orange-600 rounded-[3px]"
              />
              <span>Include custom links and attributes</span>
            </label>
          </div>

          {/* Summary Box */}
          <div className="px-3.5 py-2.5 rounded-[6px] bg-[#0c0a09] border border-[#27272a] flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Total Records to Export:</span>
            <span className="text-orange-400 font-bold">
              {filteredTasks.length} tasks
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-[6px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="px-3 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>Copy to Clipboard</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Download {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
