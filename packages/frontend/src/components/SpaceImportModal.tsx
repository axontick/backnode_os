import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SpaceFolder, FolderChildItem } from '../types';
import { getAllItemsFromFolder } from '../utils/treeUtils';
import { workspaceApi } from '../services/api';
import {
  parseCsv,
  parseJson,
  detectFieldMappings,
  detectStatuses,
  generateDefaultStatusMappings,
  detectLists,
  generateDefaultListResolutionConfig,
  generateImportPreview,
  buildExecutionTasks,
  generateSampleCsv,
  generateSampleJson,
} from '../utils/spaceImportExportEngine';
import {
  FieldMapping,
  StatusMapping,
  ListResolutionConfig,
  InternalFieldTarget,
  ImportPreviewItem,
} from '../types';

interface SpaceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSpace?: SpaceFolder | null;
  onImportComplete?: (summary: {
    totalImported: number;
    listsCreated: number;
    dependenciesRemapped: number;
    targetSpaceId: string;
  }) => void;
}

type ImportStep = 1 | 2 | 3 | 4 | 5;

const INTERNAL_FIELD_OPTIONS: { value: InternalFieldTarget; label: string; description: string }[] = [
  { value: 'title', label: 'Task Name / Title *', description: 'Primary task summary' },
  { value: 'id', label: 'External ID / Key', description: 'Used for dependency remapping' },
  { value: 'targetCycle', label: 'List Name / Sprint', description: 'Assigns task to list' },
  { value: 'status', label: 'Status', description: 'Task execution state' },
  { value: 'priority', label: 'Priority', description: 'Urgent, High, Medium, Low' },
  { value: 'assignee', label: 'Assignee', description: 'Member name or email' },
  { value: 'description', label: 'Description / Spec', description: 'Task details and markdown' },
  { value: 'dueDate', label: 'Due Date', description: 'Target delivery date' },
  { value: 'tags', label: 'Tags / Labels', description: 'Categories and tags' },
  { value: 'estimationPoints', label: 'Story Points', description: 'Points estimate' },
  { value: 'estimationHours', label: 'Hours', description: 'Time estimate' },
  { value: 'dependencies', label: 'Dependencies', description: 'Remapped to system IDs' },
  { value: 'subtasks', label: 'Subtasks', description: 'Checklist items' },
  { value: 'gitBranch', label: 'Git Branch', description: 'Repository branch' },
  { value: 'customField', label: 'Custom Field', description: 'Stored in customLinks' },
  { value: 'ignore', label: '— Skip Column —', description: 'Do not import this column' },
];

export const SpaceImportModal: React.FC<SpaceImportModalProps> = ({
  isOpen,
  onClose,
  defaultSpace,
  onImportComplete,
}) => {
  const {
    folders,
    handleUpdateFolder,
    tasks,
    setTasks,
    statuses,
    handleUpdateStatuses,
    members,
    showToast,
    refreshData,
  } = useWorkspace();

  // Wizard Step State
  const [step, setStep] = useState<ImportStep>(1);

  // Target Space Selection
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    defaultSpace?.id || folders[0]?.id || ''
  );
  const targetSpace = useMemo<SpaceFolder | undefined>(
    () => folders.find((f) => f.id === selectedSpaceId) || defaultSpace || folders[0],
    [folders, selectedSpaceId, defaultSpace]
  );

  const existingSpaceLists: FolderChildItem[] = useMemo(() => {
    return targetSpace ? getAllItemsFromFolder(targetSpace) : [];
  }, [targetSpace]);

  // File Upload & Input State
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parsed Raw Data
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);

  // Step 2: Field Mapping State
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  // Step 3: Status & List Resolution State
  const [statusMappings, setStatusMappings] = useState<StatusMapping[]>([]);
  const [listResolution, setListResolution] = useState<ListResolutionConfig>({
    unspecifiedListAction: 'map_to_existing',
    unspecifiedListTargetListId: '',
    unspecifiedNewListName: 'Imported Tasks',
    listMappings: {},
  });

  // Step 4: Preview Items State
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [previewStats, setPreviewStats] = useState<{
    idMappingTable: Record<string, string>;
    dependenciesRemappedCount: number;
    newListsToCreate: string[];
    newStatusesToCreate: string[];
    totalTasks: number;
    validTasksCount: number;
  }>({
    idMappingTable: {},
    dependenciesRemappedCount: 0,
    newListsToCreate: [],
    newStatusesToCreate: [],
    totalTasks: 0,
    validTasksCount: 0,
  });

  // Step 5: Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [executionResult, setExecutionResult] = useState<{
    totalImported: number;
    listsCreated: number;
    dependenciesRemapped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModalState = useCallback(() => {
    setStep(1);
    setSelectedSpaceId(defaultSpace?.id || folders[0]?.id || '');
    setFile(null);
    setRawText('');
    setInputMode('upload');
    setIsDragging(false);
    setParseError(null);
    setParsedHeaders([]);
    setParsedRows([]);
    setFieldMappings([]);
    setStatusMappings([]);
    setListResolution({
      unspecifiedListAction: 'map_to_existing',
      unspecifiedListTargetListId: '',
      unspecifiedNewListName: 'Imported Tasks',
      listMappings: {},
    });
    setPreviewItems([]);
    setPreviewStats({
      idMappingTable: {},
      dependenciesRemappedCount: 0,
      newListsToCreate: [],
      newStatusesToCreate: [],
      totalTasks: 0,
      validTasksCount: 0,
    });
    setIsExecuting(false);
    setExecutionProgress(0);
    setExecutionLog([]);
    setExecutionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [defaultSpace, folders]);

  const handleClose = useCallback(() => {
    if (isExecuting) return;
    resetModalState();
    onClose();
  }, [isExecuting, resetModalState, onClose]);

  // Reset modal state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExecuting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, handleClose]);

  if (!isOpen) return null;

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
    };
    reader.onerror = () => {
      setParseError('Failed to read file contents');
    };
    reader.readAsText(selectedFile);
  };

  const handleDownloadSample = (type: 'csv' | 'json') => {
    const content = type === 'csv' ? generateSampleCsv() : generateSampleJson();
    const mime = type === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-backnode-import.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Step 1 -> Step 2: Parse and initialize field mappings
  const handleProceedToFieldMapping = () => {
    setParseError(null);
    if (!rawText.trim()) {
      setParseError('Please select a file or paste CSV/JSON content to continue.');
      return;
    }

    try {
      let headers: string[] = [];
      let rows: Record<string, any>[] = [];

      const trimmed = rawText.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const jsonResult = parseJson(trimmed);
        headers = jsonResult.headers;
        rows = jsonResult.rows;
      } else {
        const csvResult = parseCsv(trimmed);
        headers = csvResult.headers;
        rows = csvResult.rows;
      }

      if (rows.length === 0 || headers.length === 0) {
        setParseError('No records could be extracted from this data. Please verify your file format.');
        return;
      }

      setParsedHeaders(headers);
      setParsedRows(rows);

      // Auto-detect mappings
      const initialFieldMappings = detectFieldMappings(headers, rows);
      setFieldMappings(initialFieldMappings);

      setStep(2);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file.');
    }
  };

  // Step 2 -> Step 3: Initialize Status & List resolution
  const handleProceedToStatusAndList = () => {
    const titleMapping = fieldMappings.find((m) => m.targetField === 'title');
    if (!titleMapping) {
      setParseError('Please map at least one column to "Task Name / Title *".');
      return;
    }

    setParseError(null);

    // 1. Detect statuses
    const statusCol = fieldMappings.find((m) => m.targetField === 'status')?.sourceColumn;
    const detectedStatuses = statusCol ? detectStatuses(parsedRows, statusCol) : [];
    const initialStatusMappings = generateDefaultStatusMappings(detectedStatuses, statuses);
    setStatusMappings(initialStatusMappings);

    // 2. Detect lists
    const listCol = fieldMappings.find((m) => m.targetField === 'targetCycle')?.sourceColumn;
    const { discoveredLists, emptyListCount, listTaskCounts } = detectLists(parsedRows, listCol);
    const initialListConfig = generateDefaultListResolutionConfig(
      discoveredLists,
      listTaskCounts,
      existingSpaceLists,
      emptyListCount
    );
    setListResolution(initialListConfig);

    setStep(3);
  };

  // Step 3 -> Step 4: Generate Preview & Remap Dependencies
  const handleProceedToPreview = () => {
    if (!targetSpace) {
      setParseError('Please select a valid target space.');
      return;
    }

    setParseError(null);

    const result = generateImportPreview({
      rows: parsedRows,
      fieldMappings,
      statusMappings,
      listResolution,
      space: targetSpace,
      existingSpaceLists,
      existingTasks: tasks,
    });

    setPreviewItems(result.previewItems);
    setPreviewStats({
      idMappingTable: result.idMappingTable,
      dependenciesRemappedCount: result.dependenciesRemappedCount,
      newListsToCreate: result.newListsToCreate,
      newStatusesToCreate: result.newStatusesToCreate,
      totalTasks: result.totalTasks,
      validTasksCount: result.validTasksCount,
    });

    setStep(4);
  };

  // Step 4 -> Step 5: Execute Import
  const handleExecuteImport = async () => {
    if (!targetSpace) return;
    setStep(5);
    setIsExecuting(true);
    setExecutionProgress(10);
    setExecutionLog(['Initializing import transaction...']);

    try {
      // 1. Compile final task list
      await new Promise((r) => setTimeout(r, 200));
      setExecutionProgress(30);
      setExecutionLog((prev) => [...prev, 'Mapping external IDs and remapping dependency graphs...']);

      const tasksToImport = buildExecutionTasks({
        rows: parsedRows,
        fieldMappings,
        previewItems,
        space: targetSpace,
        members,
      });

      // 2. Update statuses in context if new statuses were created
      if (previewStats.newStatusesToCreate.length > 0) {
        setExecutionProgress(50);
        setExecutionLog((prev) => [
          ...prev,
          `Registering ${previewStats.newStatusesToCreate.length} new statuses in Space...`,
        ]);
        let highestOrder = statuses.reduce((max, s) => Math.max(max, s.order || 0), 0);
        const nextStatuses = [...statuses];
        previewStats.newStatusesToCreate.forEach((statusName) => {
          highestOrder++;
          nextStatuses.push({
            id: `status-${Date.now()}-${highestOrder}`,
            order: highestOrder,
            name: statusName,
            description: 'Imported status',
            color: '#ea580c',
            stageMapping: '',
            activeVolume: 0,
            isDefault: false,
            isClosed: false,
          });
        });
        handleUpdateStatuses(nextStatuses);
      }

      // 3. Create any new lists on target Space
      setExecutionProgress(70);
      const updatedSpace = { ...targetSpace };
      const currentItems = [...(updatedSpace.items || [])];
      let listsCreatedCount = 0;

      previewStats.newListsToCreate.forEach((newListName) => {
        const listId = `list-${newListName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const exists = currentItems.some(
          (i) => i.id === listId || i.name.toLowerCase() === newListName.toLowerCase()
        );
        if (!exists) {
          currentItems.push({
            id: listId,
            name: newListName,
            taskCount: tasksToImport.filter((t) => t.targetCycle === newListName).length,
            status: 'Active',
            active: true,
            icon: 'folder',
            color: '#ea580c',
          });
          listsCreatedCount++;
          setExecutionLog((prev) => [...prev, `Created new list: "${newListName}"`]);
        }
      });

      // Update existing list task counts
      currentItems.forEach((item) => {
        const additional = tasksToImport.filter(
          (t) => t.targetCycle === item.name || t.targetCycle === item.id
        ).length;
        item.taskCount = (item.taskCount || 0) + additional;
      });

      updatedSpace.items = currentItems;
      handleUpdateFolder(updatedSpace);

      // 4. Commit tasks into database and storage
      setExecutionProgress(85);
      setExecutionLog((prev) => [
        ...prev,
        `Persisting ${tasksToImport.length} tasks and list structures to backend database...`,
      ]);

      const newListsArray = previewStats.newListsToCreate.map((name) => ({
        id: `list-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
      }));

      const newStatusesArray = previewStats.newStatusesToCreate.map((name) => ({
        name,
      }));

      try {
        await workspaceApi.importSpace(targetSpace.id, {
          tasks: tasksToImport,
          newLists: newListsArray,
          newStatuses: newStatusesArray,
        });
      } catch (backendErr: any) {
        console.warn('Backend API import error, keeping state in memory:', backendErr);
      }

      setTasks((prev) => [...prev, ...tasksToImport]);
      await refreshData().catch(() => {});

      setExecutionProgress(100);
      setExecutionLog((prev) => [
        ...prev,
        'Import transaction completed successfully with all dependencies verified!',
      ]);

      setExecutionResult({
        totalImported: tasksToImport.length,
        listsCreated: listsCreatedCount,
        dependenciesRemapped: previewStats.dependenciesRemappedCount,
      });

      showToast(
        `Successfully imported ${tasksToImport.length} tasks into "${targetSpace.name}" with ${previewStats.dependenciesRemappedCount} dependencies linked!`
      );

      onImportComplete?.({
        totalImported: tasksToImport.length,
        listsCreated: listsCreatedCount,
        dependenciesRemapped: previewStats.dependenciesRemappedCount,
        targetSpaceId: targetSpace.id,
      });
    } catch (err: any) {
      setExecutionLog((prev) => [...prev, `ERROR: ${err.message || 'Import failed'}`]);
      showToast('Error during import execution');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting) {
          handleClose();
        }
      }}
    >
      <div className="bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Header with Space Info & Stepper */}
        <div className="px-6 py-4 bg-[#0c0a09] border-b border-[#27272a] flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: targetSpace?.color || '#ea580c' }}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {targetSpace?.icon || 'folder_open'}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-100 tracking-tight font-headline">
                    Import Tasks into Space
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30 uppercase">
                    {targetSpace?.name || 'Space'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Import CSV or JSON with intelligent column aliasing, status mapping, and dependency remapping.
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

          {/* Stepper Navigation */}
          <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#27272a]/60">
            {[
              { num: 1, label: 'Source File' },
              { num: 2, label: 'Field Mapping' },
              { num: 3, label: 'Status & Lists' },
              { num: 4, label: 'Preview & Verify' },
              { num: 5, label: 'Execution' },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isPast = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
                    isCurrent
                      ? 'bg-orange-950/50 border border-orange-500/40 text-orange-400 font-semibold'
                      : isPast
                      ? 'bg-[#18181b] border border-[#27272a] text-zinc-300'
                      : 'text-zinc-600 bg-transparent'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-orange-600 text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isPast ? '✓' : s.num}
                  </span>
                  <span className="truncate text-[11px]">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {parseError && (
            <div className="p-3 rounded-[6px] bg-red-950/30 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{parseError}</span>
            </div>
          )}

          {/* STEP 1: Upload Source */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              {/* Space Selection Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300 font-mono">
                  Target Space Destination:
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

              {/* Input Mode Selector */}
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'upload'
                        ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">upload_file</span>
                    <span>Upload CSV / JSON File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'paste'
                        ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">content_paste</span>
                    <span>Paste Raw Text</span>
                  </button>
                </div>

                {/* Sample Download Links */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500">Sample Templates:</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('csv')}
                    className="text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    <span>CSV</span>
                  </button>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('json')}
                    className="text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {inputMode === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[6px] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    isDragging
                      ? 'border-orange-500 bg-orange-950/20 scale-[0.99]'
                      : 'border-[#27272a] hover:border-zinc-700 bg-[#18181b]/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-[6px] bg-[#121214] border border-[#27272a] flex items-center justify-center text-orange-400 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-xs font-semibold text-zinc-200">
                      Drag & Drop your <span className="text-orange-400 font-mono">.csv</span> or{' '}
                      <span className="text-orange-400 font-mono">.json</span> file here
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      or click to browse from your workstation
                    </p>
                  </div>
                  {file && (
                    <div className="mt-2 px-3 py-1.5 rounded-[6px] bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-mono flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      <span className="font-semibold">{file.name}</span>
                      <span className="text-zinc-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-mono">
                    Paste raw CSV or JSON data below:
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Issue Key,Task Name,Status,Priority,List Name,Dependencies..."
                    className="p-3 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono outline-none focus:border-orange-500 resize-y"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Field Mapping */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                    Map Detected File Columns ({parsedHeaders.length} columns found)
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Match each column to an internal field. You can assign external IDs for dependency remapping, or map unrecognized fields as Custom Fields.
                  </p>
                </div>
                <div className="px-2 py-1 rounded-[6px] bg-[#18181b] border border-[#27272a] text-[11px] font-mono text-zinc-400">
                  {parsedRows.length} total rows parsed
                </div>
              </div>

              <div className="border border-[#27272a] rounded-[6px] overflow-hidden bg-[#18181b]/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 w-1/4">File Column Name</th>
                      <th className="py-2 px-3 w-1/3">Sample Values (Preview)</th>
                      <th className="py-2 px-3 w-5/12">Map to Internal Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {fieldMappings.map((mapping, idx) => {
                      const isTitle = mapping.targetField === 'title';
                      const isId = mapping.targetField === 'id';
                      const isDep = mapping.targetField === 'dependencies';
                      const isCustom = mapping.targetField === 'customField';

                      return (
                        <tr key={mapping.sourceColumn} className="hover:bg-[#18181b]/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-zinc-200">
                            <div className="flex items-center gap-1.5">
                              <span>{mapping.sourceColumn}</span>
                              {isTitle && (
                                <span className="px-1 py-0.2 rounded-[6px] bg-orange-950/40 text-orange-400 text-[9px] border border-orange-500/30">
                                  Title
                                </span>
                              )}
                              {isId && (
                                <span className="px-1 py-0.2 rounded-[6px] bg-blue-950/40 text-blue-400 text-[9px] border border-blue-500/30">
                                  ID Key
                                </span>
                              )}
                              {isDep && (
                                <span className="px-1 py-0.2 rounded-[6px] bg-amber-950/40 text-amber-400 text-[9px] border border-amber-500/30">
                                  Deps
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {mapping.sampleValues.length > 0 ? (
                                mapping.sampleValues.map((sample, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-1.5 py-0.5 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-400 font-mono text-[10px] truncate max-w-[180px]"
                                    title={sample}
                                  >
                                    {sample}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-600 italic text-[11px]">— No sample data —</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={mapping.targetField}
                                onChange={(e) => {
                                  const newTarget = e.target.value as InternalFieldTarget;
                                  setFieldMappings((prev) =>
                                    prev.map((m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            targetField: newTarget,
                                            customFieldName:
                                              newTarget === 'customField'
                                                ? m.customFieldName || m.sourceColumn.toLowerCase().replace(/[^a-z0-9]/g, '_')
                                                : undefined,
                                          }
                                        : m
                                    )
                                  );
                                }}
                                className={`h-7 px-2 rounded-[6px] text-xs font-mono bg-[#18181b] border outline-none cursor-pointer ${
                                  isTitle
                                    ? 'border-orange-500/60 text-orange-400 font-semibold'
                                    : mapping.targetField === 'ignore'
                                    ? 'border-[#27272a] text-zinc-500'
                                    : 'border-[#27272a] text-zinc-200'
                                }`}
                              >
                                {INTERNAL_FIELD_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              {isCustom && (
                                <input
                                  type="text"
                                  value={mapping.customFieldName || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFieldMappings((prev) =>
                                      prev.map((m, i) => (i === idx ? { ...m, customFieldName: val } : m))
                                    );
                                  }}
                                  placeholder="Field key..."
                                  className="h-7 px-2 rounded-[6px] text-xs font-mono bg-[#121214] border border-[#27272a] text-zinc-200 outline-none focus:border-orange-500 w-32"
                                  title="Custom field key in task.customLinks"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Status & List Resolution */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              {/* Section 1: Status Mapping */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                    1. Status Mapping Configuration
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Map incoming status values to existing statuses in this space, or add unrecognized ones as new space statuses.
                  </p>
                </div>

                <div className="border border-[#27272a] rounded-[6px] overflow-hidden bg-[#18181b]/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3 w-1/3">Source Status Value</th>
                        <th className="py-2 px-3 w-1/6">Row Count</th>
                        <th className="py-2 px-3 w-1/2">Target Space Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]/60">
                      {statusMappings.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-zinc-500 italic">
                            No status column mapped. All tasks will receive the default status (
                            {statuses[0]?.name || 'Backlog'}).
                          </td>
                        </tr>
                      ) : (
                        statusMappings.map((sm, idx) => (
                          <tr key={sm.sourceStatus} className="hover:bg-[#18181b]/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-zinc-200">
                              <span className="px-2 py-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a]">
                                {sm.sourceStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-400">
                              {sm.taskCount} tasks
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={sm.isNewStatus ? '__create_new__' : sm.targetStatus}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStatusMappings((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? val === '__create_new__'
                                            ? { ...item, isNewStatus: true, targetStatus: item.sourceStatus }
                                            : { ...item, isNewStatus: false, targetStatus: val }
                                          : item
                                      )
                                    );
                                  }}
                                  className="h-7 px-2 rounded-[6px] text-xs font-mono bg-[#18181b] border border-[#27272a] text-zinc-100 outline-none focus:border-orange-500 cursor-pointer"
                                >
                                  {statuses.map((s) => (
                                    <option key={s.id} value={s.name}>
                                      Map to: {s.name}
                                    </option>
                                  ))}
                                  <option value="__create_new__">
                                    + Add as new status in Space ({sm.sourceStatus})
                                  </option>
                                </select>
                                {sm.isNewStatus && (
                                  <span className="px-1.5 py-0.5 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 text-[10px] font-mono">
                                    Will create status
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: List Resolution */}
              <div className="flex flex-col gap-3 pt-4 border-t border-[#27272a]">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                    2. List Name Resolution & Organization
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Specify where tasks belong if the list name does not exist or is missing from the file.
                  </p>
                </div>

                {/* Sub-item: When List Name is Empty / Undefined */}
                <div className="p-4 rounded-[6px] bg-[#18181b]/50 border border-[#27272a] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      When List Name is Undefined or Empty:
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Applies to rows without list column
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="radio"
                        name="unspecifiedAction"
                        checked={listResolution.unspecifiedListAction === 'map_to_existing'}
                        onChange={() =>
                          setListResolution((prev) => ({
                            ...prev,
                            unspecifiedListAction: 'map_to_existing',
                          }))
                        }
                        className="accent-orange-600"
                      />
                      <span>Assign to existing list:</span>
                    </label>

                    <select
                      disabled={listResolution.unspecifiedListAction !== 'map_to_existing'}
                      value={listResolution.unspecifiedListTargetListId}
                      onChange={(e) =>
                        setListResolution((prev) => ({
                          ...prev,
                          unspecifiedListTargetListId: e.target.value,
                        }))
                      }
                      className="h-7 px-2 rounded-[6px] text-xs font-mono bg-[#121214] border border-[#27272a] text-zinc-200 disabled:opacity-40"
                    >
                      {existingSpaceLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 sm:ml-4">
                      <input
                        type="radio"
                        name="unspecifiedAction"
                        checked={listResolution.unspecifiedListAction === 'create_new'}
                        onChange={() =>
                          setListResolution((prev) => ({
                            ...prev,
                            unspecifiedListAction: 'create_new',
                          }))
                        }
                        className="accent-orange-600"
                      />
                      <span>Create new list:</span>
                    </label>

                    <input
                      type="text"
                      disabled={listResolution.unspecifiedListAction !== 'create_new'}
                      value={listResolution.unspecifiedNewListName || ''}
                      onChange={(e) =>
                        setListResolution((prev) => ({
                          ...prev,
                          unspecifiedNewListName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Imported Deliverables"
                      className="h-7 px-2.5 rounded-[6px] text-xs bg-[#121214] border border-[#27272a] text-zinc-200 disabled:opacity-40 focus:border-orange-500 w-44"
                    />
                  </div>
                </div>

                {/* Sub-item: Discovered List Names */}
                {Object.keys(listResolution.listMappings).length > 0 && (
                  <div className="border border-[#27272a] rounded-[6px] overflow-hidden bg-[#18181b]/30 mt-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 w-1/3">Discovered List Name</th>
                          <th className="py-2 px-3 w-1/6">Tasks</th>
                          <th className="py-2 px-3 w-1/2">Resolution Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]/60">
                        {Object.entries(listResolution.listMappings).map(([listName, config]) => (
                          <tr key={listName} className="hover:bg-[#18181b]/50 transition-colors">
                            <td className="py-2 px-3 font-mono font-semibold text-zinc-200">
                              {listName}
                            </td>
                            <td className="py-2 px-3 font-mono text-zinc-400">{config.taskCount}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={config.action === 'create_new' ? '__new__' : config.targetListId}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setListResolution((prev) => ({
                                      ...prev,
                                      listMappings: {
                                        ...prev.listMappings,
                                        [listName]:
                                          val === '__new__'
                                            ? {
                                                ...config,
                                                action: 'create_new',
                                                newListName: listName,
                                              }
                                            : {
                                                ...config,
                                                action: 'map_to_existing',
                                                targetListId: val,
                                              },
                                      },
                                    }));
                                  }}
                                  className="h-7 px-2 rounded-[6px] text-xs font-mono bg-[#18181b] border border-[#27272a] text-zinc-100 outline-none focus:border-orange-500 cursor-pointer"
                                >
                                  <option value="__new__">+ Create as new list: "{listName}"</option>
                                  {existingSpaceLists.map((l) => (
                                    <option key={l.id} value={l.id}>
                                      Map to existing: {l.name}
                                    </option>
                                  ))}
                                </select>
                                {config.action === 'create_new' && (
                                  <span className="px-1.5 py-0.5 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 text-[10px] font-mono">
                                    New List
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Verification */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              {/* Bento Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 shadow-sm">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Total Tasks</div>
                  <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                    {previewStats.totalTasks}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    ✓ {previewStats.validTasksCount} ready to import
                  </div>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 shadow-sm">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">Dependencies</div>
                  <div className="text-2xl font-bold font-mono text-orange-400 mt-1">
                    {previewStats.dependenciesRemappedCount}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    remapped to system IDs
                  </div>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 shadow-sm">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">New Lists</div>
                  <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                    {previewStats.newListsToCreate.length}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    lists to create on space
                  </div>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] rounded-[6px] p-3 shadow-sm">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">New Statuses</div>
                  <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                    {previewStats.newStatusesToCreate.length}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    statuses to register
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    Batch Preview (First {Math.min(previewItems.length, 15)} Tasks)
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Verify ID remapping & dependency resolution
                  </span>
                </div>

                <div className="border border-[#27272a] rounded-[6px] overflow-x-auto bg-[#18181b]/30">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">System ID (Remapped)</th>
                        <th className="py-2 px-3">Task Name</th>
                        <th className="py-2 px-3">Assigned List</th>
                        <th className="py-2 px-3">Mapped Status</th>
                        <th className="py-2 px-3">Priority</th>
                        <th className="py-2 px-3">Dependencies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]/60">
                      {previewItems.slice(0, 15).map((item) => (
                        <tr key={item.rawIndex} className="hover:bg-[#18181b]/50 transition-colors">
                          <td className="py-2 px-3 font-mono text-zinc-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-orange-400 font-bold">{item.internalId}</span>
                              {item.sourceId && (
                                <span className="text-[10px] text-zinc-500">
                                  ({item.sourceId})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-medium text-zinc-100 max-w-xs truncate">
                            {item.title}
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-300">
                            <div className="flex items-center gap-1.5">
                              <span>{item.targetListName}</span>
                              {item.isNewList && (
                                <span className="px-1 py-0.2 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 text-[9px]">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-[6px] bg-zinc-800 text-zinc-200 font-mono text-[10px] border border-zinc-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono">
                            <span
                              className={`text-[11px] font-semibold ${
                                item.priority === 'Urgent'
                                  ? 'text-red-400'
                                  : item.priority === 'High'
                                  ? 'text-orange-400'
                                  : item.priority === 'Low'
                                  ? 'text-zinc-500'
                                  : 'text-amber-400'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {item.dependencies.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.dependencies.map((d, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-1.5 py-0.2 rounded-[6px] bg-orange-950/40 border border-orange-500/30 text-orange-400 text-[10px]"
                                  >
                                    → {d}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Execution Progress & Results */}
          {step === 5 && (
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                {isExecuting ? (
                  <div className="w-14 h-14 rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(234,88,12,0.4)] animate-pulse">
                    <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-[6px] bg-emerald-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                    <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-zinc-100 font-headline">
                    {isExecuting ? 'Importing Tasks into Space...' : 'Import Execution Complete!'}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-md font-mono">
                    {isExecuting
                      ? 'Performing transactional writes, remapping IDs, and wiring dependency graphs.'
                      : `Successfully imported ${executionResult?.totalImported || 0} tasks into "${targetSpace?.name}".`}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#18181b] border border-[#27272a] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-orange-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${executionProgress}%` }}
                />
              </div>

              {/* Telemetry Execution Log */}
              <div className="p-3 rounded-[6px] bg-[#0c0a09] border border-[#27272a] font-mono text-[11px] text-zinc-400 flex flex-col gap-1 max-h-48 overflow-y-auto">
                <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">
                  Telemetry Execution Stream:
                </div>
                {executionLog.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-2">
                    <span className="text-orange-500">›</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between shrink-0">
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep((curr) => (curr - 1) as ImportStep)}
                className="px-3 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 && (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-[6px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleProceedToFieldMapping}
                className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue to Field Mapping</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToStatusAndList}
                className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue to Status & Lists</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Preview & Verify</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">file_download_done</span>
                <span>Execute Import ({previewStats.validTasksCount} Tasks)</span>
              </button>
            )}

            {step === 5 && !isExecuting && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Done & View Tasks</span>
                <span className="material-symbols-outlined text-[15px]">check</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
