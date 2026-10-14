import type {
  SpaceFolder,
  FolderChildItem,
  TaskItem,
  TaskStatus,
  PriorityLevel,
  StatusDefinition,
  ListSettings,
  SpaceExportPayload,
  SpaceExportMetadata,
  InternalFieldTarget,
  FieldMapping,
  StatusMapping,
  ListResolutionConfig,
  ImportPreviewItem,
  ImportExecutionResult,
  TeamMember,
} from '../types.ts';

// ==========================================
// 1. Delimiter Detection & CSV Parser
// ==========================================

export function detectDelimiter(text: string): string {
  const firstFewLines = text.split(/\r?\n/).slice(0, 5).join('\n');
  const commaCount = (firstFewLines.match(/,/g) || []).length;
  const tabCount = (firstFewLines.match(/\t/g) || []).length;
  const semicolonCount = (firstFewLines.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  return ',';
}

export function parseCsv(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM if present
  let clean = csvContent.replace(/^\uFEFF/, '').trim();
  if (!clean) {
    return { headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(clean);

  // RFC 4180 CSV tokenizer supporting quotes, escaped quotes (""), and multiline cells
  const lines: string[][] = [];
  let currentField = '';
  let currentRecord: string[] = [];
  let insideQuote = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentField += '"';
        i++; // Skip the escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip LF in CRLF
      }
      currentRecord.push(currentField.trim());
      if (currentRecord.some((f) => f.length > 0)) {
        lines.push(currentRecord);
      }
      currentRecord = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push final record
  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some((f) => f.length > 0)) {
      lines.push(currentRecord);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0].map((h) => h.trim().replace(/^["']|["']$/g, ''));
  // Ensure non-empty unique header names
  const headers: string[] = [];
  const headerCount: Record<string, number> = {};

  rawHeaders.forEach((h, idx) => {
    let name = h || `Column_${idx + 1}`;
    if (headerCount[name]) {
      headerCount[name]++;
      name = `${name}_${headerCount[name]}`;
    } else {
      headerCount[name] = 1;
    }
    headers.push(name);
  });

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rowObj: Record<string, string> = {};
    let hasValue = false;

    headers.forEach((h, colIdx) => {
      const val = (line[colIdx] ?? '').trim();
      rowObj[h] = val;
      if (val) hasValue = true;
    });

    if (hasValue) {
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

// ==========================================
// 2. JSON Parser & Detection
// ==========================================

export function parseJson(jsonContent: string): {
  headers: string[];
  rows: Record<string, any>[];
  isBacknodePayload?: boolean;
  rawPayload?: SpaceExportPayload;
} {
  const clean = jsonContent.trim();
  if (!clean) {
    return { headers: [], rows: [] };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch (err: any) {
    throw new Error(`Invalid JSON format: ${err.message}`);
  }

  // 1. Check if Backnode OS full SpaceExportPayload
  if (parsed && typeof parsed === 'object' && parsed.tasks && Array.isArray(parsed.tasks)) {
    const isBacknode = Boolean(parsed.metadata?.version || parsed.space?.id);
    const tasksArray: any[] = parsed.tasks;
    const headerSet = new Set<string>();

    const rows: Record<string, any>[] = tasksArray.map((t) => {
      const flat: Record<string, any> = {};
      Object.keys(t).forEach((k) => {
        headerSet.add(k);
        const v = t[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if (k === 'estimation') {
            flat['estimationPoints'] = v.points ?? '';
            flat['estimationHours'] = v.hours ?? '';
            headerSet.add('estimationPoints');
            headerSet.add('estimationHours');
          } else if (k === 'assignee') {
            flat['assignee'] = v.name || v.email || '';
          } else {
            flat[k] = JSON.stringify(v);
          }
        } else if (Array.isArray(v)) {
          flat[k] = v.join(', ');
        } else {
          flat[k] = v != null ? String(v) : '';
        }
      });
      return flat;
    });

    return {
      headers: Array.from(headerSet),
      rows,
      isBacknodePayload: isBacknode,
      rawPayload: isBacknode ? (parsed as SpaceExportPayload) : undefined,
    };
  }

  // 2. Direct array of objects
  if (Array.isArray(parsed)) {
    const headerSet = new Set<string>();
    const rows = parsed.map((item) => {
      const flat: Record<string, any> = {};
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((k) => {
          headerSet.add(k);
          const v = item[k];
          if (Array.isArray(v)) {
            flat[k] = v.join(', ');
          } else if (typeof v === 'object' && v !== null) {
            flat[k] = JSON.stringify(v);
          } else {
            flat[k] = v != null ? String(v) : '';
          }
        });
      }
      return flat;
    });

    return {
      headers: Array.from(headerSet),
      rows,
      isBacknodePayload: false,
    };
  }

  throw new Error('Unsupported JSON structure. Expected an array of tasks or a Backnode OS space export object.');
}

// ==========================================
// 3. Smart Field Aliasing & Detection
// ==========================================

const FIELD_ALIASES: Record<Exclude<InternalFieldTarget, 'customField' | 'ignore'>, string[]> = {
  title: [
    'title',
    'name',
    'task name',
    'task_name',
    'task title',
    'task_title',
    'summary',
    'task',
    'issue',
    'subject',
    'item',
    'headline',
    'ticket name',
  ],
  id: [
    'id',
    'task id',
    'task_id',
    'key',
    'issue key',
    'issue_key',
    'issue id',
    'issue_id',
    'external id',
    'external_id',
    'ticket',
    'ref',
    'code',
    'identifier',
    'number',
  ],
  list_id: [
    'list_id',
    'list id',
    'list',
    'list name',
    'list_name',
    'target cycle',
    'target_cycle',
  ],
  targetCycle: [
    'list',
    'list name',
    'list_name',
    'target cycle',
    'target_cycle',
    'targetcycle',
    'sprint',
    'cycle',
    'milestone',
    'category',
    'folder',
    'bucket',
    'swimlane',
    'board column',
  ],
  status: [
    'status',
    'task status',
    'task_status',
    'state',
    'task state',
    'task_state',
    'stage',
    'column',
    'workflow step',
    'progress',
  ],
  priority: [
    'priority',
    'priority level',
    'priority_level',
    'urgency',
    'severity',
    'p-level',
    'prio',
    'importance',
  ],
  assignee: [
    'assignee',
    'assignee name',
    'assignee_name',
    'assignee email',
    'assigned to',
    'assigned_to',
    'owner',
    'member',
    'developer',
    'lead',
  ],
  description: [
    'description',
    'desc',
    'details',
    'body',
    'spec',
    'notes',
    'spec markdown',
    'spec_markdown',
    'content',
    'overview',
  ],
  dueDate: [
    'due date',
    'due_date',
    'duedate',
    'due',
    'deadline',
    'target date',
    'target_date',
    'end date',
    'end_date',
    'eta',
    'completion date',
  ],
  tags: [
    'tags',
    'tag',
    'labels',
    'label',
    'components',
    'categories',
    'keywords',
  ],
  estimationPoints: [
    'story points',
    'story_points',
    'points',
    'pts',
    'estimate',
    'story point',
    'sp',
    'estimation points',
  ],
  estimationHours: [
    'hours',
    'hrs',
    'hour',
    'duration',
    'time estimate',
    'estimated hours',
    'hours estimate',
    'effort',
  ],
  dependencies: [
    'dependencies',
    'dependency',
    'depends on',
    'depends_on',
    'dependson',
    'blocked by',
    'blocked_by',
    'blockedby',
    'blocking',
    'predecessors',
    'predecessor',
    'parent id',
    'parent',
    'links',
    'relation',
    'relations',
  ],
  subtasks: [
    'subtasks',
    'subtask',
    'checklist',
    'todos',
    'items',
    'sub-tasks',
  ],
  gitBranch: [
    'git branch',
    'git_branch',
    'gitbranch',
    'branch',
    'vcs branch',
  ],
};

function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[-_.\s]+/g, ' ').trim();
}

export function detectFieldMappings(
  headers: string[],
  sampleRows: Record<string, any>[]
): FieldMapping[] {
  const assignedTargets = new Set<InternalFieldTarget>();
  const mappings: FieldMapping[] = [];

  for (const header of headers) {
    const normalized = normalizeHeaderKey(header);
    const compact = normalized.replace(/\s+/g, '');

    // Extract sample values from the first 5 rows
    const sampleValues: string[] = [];
    for (const r of sampleRows) {
      const val = r[header];
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        const strVal = String(val).trim();
        if (!sampleValues.includes(strVal)) {
          sampleValues.push(strVal);
        }
        if (sampleValues.length >= 3) break;
      }
    }

    let matchedTarget: InternalFieldTarget = 'ignore';

    // 1. Exact or Alias matching
    for (const [targetKey, aliases] of Object.entries(FIELD_ALIASES)) {
      const fieldTarget = targetKey as InternalFieldTarget;
      // Skip already assigned unique single fields like title, id, targetCycle
      if (
        (fieldTarget === 'title' || fieldTarget === 'id' || fieldTarget === 'targetCycle') &&
        assignedTargets.has(fieldTarget)
      ) {
        continue;
      }

      if (aliases.some((alias) => normalized === alias || compact === alias.replace(/\s+/g, ''))) {
        matchedTarget = fieldTarget;
        assignedTargets.add(fieldTarget);
        break;
      }
    }

    // 2. Substring matching if still unmatched
    if (matchedTarget === 'ignore') {
      for (const [targetKey, aliases] of Object.entries(FIELD_ALIASES)) {
        const fieldTarget = targetKey as InternalFieldTarget;
        if (
          (fieldTarget === 'title' || fieldTarget === 'id' || fieldTarget === 'targetCycle') &&
          assignedTargets.has(fieldTarget)
        ) {
          continue;
        }

        if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
          matchedTarget = fieldTarget;
          assignedTargets.add(fieldTarget);
          break;
        }
      }
    }

    // 3. Fallback: if not matched, check if it should be an open custom field
    const isCustom = matchedTarget === 'ignore';
    mappings.push({
      sourceColumn: header,
      targetField: isCustom ? 'customField' : matchedTarget,
      customFieldName: isCustom ? header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() : undefined,
      sampleValues,
    });
  }

  // Ensure title is assigned to at least one column if possible
  if (!assignedTargets.has('title')) {
    const firstStringCol = mappings.find((m) => m.targetField === 'customField');
    if (firstStringCol) {
      firstStringCol.targetField = 'title';
      firstStringCol.customFieldName = undefined;
    }
  }

  return mappings;
}

// ==========================================
// 4. Status Detection & Auto-Mapping
// ==========================================

export function detectStatuses(rows: Record<string, any>[], statusColumn: string): { status: string; count: number }[] {
  if (!statusColumn) return [];

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const raw = (row[statusColumn] || '').trim();
    if (raw) {
      counts[raw] = (counts[raw] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

const COMMON_STATUS_FUZZY: Record<string, string[]> = {
  Backlog: ['to do', 'todo', 'backlog', 'open', 'new', 'created', 'incoming', 'unstarted', 'draft', 'pending', 'ideas'],
  'In Progress': ['in progress', 'in-progress', 'doing', 'wip', 'active', 'working', 'development', 'in dev', 'executing'],
  'In Review': ['in review', 'in-review', 'review', 'qa', 'testing', 'pr', 'verification', 'in qa', 'audit', 'code review'],
  Blocked: ['blocked', 'stuck', 'on hold', 'on-hold', 'waiting', 'impediment', 'pause', 'deferred'],
  Done: ['done', 'complete', 'completed', 'resolved', 'closed', 'finished', 'shipped', 'released', 'passed', 'accepted'],
};

export function generateDefaultStatusMappings(
  detectedStatuses: { status: string; count: number }[],
  spaceStatuses: StatusDefinition[]
): StatusMapping[] {
  const existingStatusNames = spaceStatuses.map((s) => s.name);
  const defaultStatus = spaceStatuses.find((s) => s.isDefault)?.name || existingStatusNames[0] || 'Backlog';

  return detectedStatuses.map(({ status, count }) => {
    const norm = status.toLowerCase().trim();

    // 1. Direct match with existing status
    const directMatch = existingStatusNames.find((s) => s.toLowerCase().trim() === norm);
    if (directMatch) {
      return {
        sourceStatus: status,
        targetStatus: directMatch,
        isNewStatus: false,
        taskCount: count,
      };
    }

    // 2. Fuzzy match with known categories
    for (const [category, keywords] of Object.entries(COMMON_STATUS_FUZZY)) {
      if (keywords.some((k) => norm === k || norm.includes(k))) {
        const candidate = existingStatusNames.find((s) => s.toLowerCase() === category.toLowerCase());
        if (candidate) {
          return {
            sourceStatus: status,
            targetStatus: candidate,
            isNewStatus: false,
            taskCount: count,
          };
        }
      }
    }

    // 3. Otherwise, map to defaultStatus with option to create as new status
    return {
      sourceStatus: status,
      targetStatus: defaultStatus,
      isNewStatus: false,
      taskCount: count,
    };
  });
}

// ==========================================
// 5. List Name Detection & Resolution Config
// ==========================================

export function detectLists(
  rows: Record<string, any>[],
  listColumn?: string
): {
  discoveredLists: string[];
  emptyListCount: number;
  listTaskCounts: Record<string, number>;
} {
  const listCounts: Record<string, number> = {};
  let emptyListCount = 0;

  for (const row of rows) {
    const listVal = listColumn ? (row[listColumn] || '').trim() : '';
    if (!listVal) {
      emptyListCount++;
    } else {
      listCounts[listVal] = (listCounts[listVal] || 0) + 1;
    }
  }

  return {
    discoveredLists: Object.keys(listCounts),
    emptyListCount,
    listTaskCounts: listCounts,
  };
}

export function generateDefaultListResolutionConfig(
  discoveredLists: string[],
  listTaskCounts: Record<string, number>,
  spaceLists: FolderChildItem[],
  emptyListCount: number
): ListResolutionConfig {
  const fallbackListId = spaceLists[0]?.id || 'default-list';

  const listMappings: ListResolutionConfig['listMappings'] = {};

  discoveredLists.forEach((listName) => {
    const norm = listName.toLowerCase().trim();
    const existing = spaceLists.find((sl) => sl.name.toLowerCase().trim() === norm || sl.id.toLowerCase() === norm);

    if (existing) {
      listMappings[listName] = {
        action: 'map_to_existing',
        targetListId: existing.id,
        taskCount: listTaskCounts[listName] || 0,
      };
    } else {
      listMappings[listName] = {
        action: 'create_new',
        newListName: listName,
        taskCount: listTaskCounts[listName] || 0,
      };
    }
  });

  return {
    unspecifiedListAction: spaceLists.length > 0 ? 'map_to_existing' : 'create_new',
    unspecifiedListTargetListId: fallbackListId,
    unspecifiedNewListName: 'Imported Tasks',
    listMappings,
  };
}

// ==========================================
// 6. ID Remapping, Dependency Resolution & Validation Preview
// ==========================================

export function generateImportPreview(options: {
  rows: Record<string, any>[];
  fieldMappings: FieldMapping[];
  statusMappings: StatusMapping[];
  listResolution: ListResolutionConfig;
  space: SpaceFolder;
  existingSpaceLists: FolderChildItem[];
  existingTasks: TaskItem[];
}): {
  previewItems: ImportPreviewItem[];
  idMappingTable: Record<string, string>;
  dependenciesRemappedCount: number;
  newListsToCreate: string[];
  newStatusesToCreate: string[];
  totalTasks: number;
  validTasksCount: number;
} {
  const {
    rows,
    fieldMappings,
    statusMappings,
    listResolution,
    existingSpaceLists,
    existingTasks,
  } = options;

  // Build field lookup by target
  const titleCol = fieldMappings.find((m) => m.targetField === 'title')?.sourceColumn;
  const idCol = fieldMappings.find((m) => m.targetField === 'id')?.sourceColumn;
  const listCol = fieldMappings.find((m) => m.targetField === 'targetCycle')?.sourceColumn;
  const statusCol = fieldMappings.find((m) => m.targetField === 'status')?.sourceColumn;
  const priorityCol = fieldMappings.find((m) => m.targetField === 'priority')?.sourceColumn;
  const assigneeCol = fieldMappings.find((m) => m.targetField === 'assignee')?.sourceColumn;
  const depCol = fieldMappings.find((m) => m.targetField === 'dependencies')?.sourceColumn;
  const customCols = fieldMappings.filter((m) => m.targetField === 'customField');

  // Status mapping dictionary
  const statusMap: Record<string, string> = {};
  statusMappings.forEach((sm) => {
    statusMap[sm.sourceStatus.trim()] = sm.targetStatus;
  });

  // Calculate highest task number in existing tasks to avoid ID collision
  let maxIdNum = 1100;
  for (const t of existingTasks) {
    const match = t.id.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  }

  // 1. Build ID Remapping Table
  const idMappingTable: Record<string, string> = {};
  const existingIdsSet = new Set(existingTasks.map((t) => t.id));

  rows.forEach((row, idx) => {
    const rawExternalId = idCol ? (row[idCol] || '').trim() : '';
    maxIdNum++;
    const generatedInternalId = `ENG-${maxIdNum}`;

    if (rawExternalId) {
      // If external ID already follows Backnode pattern and doesn't conflict, user can keep it,
      // but to ensure consistency we remap cleanly.
      idMappingTable[rawExternalId] = generatedInternalId;
    } else {
      idMappingTable[`row_${idx}`] = generatedInternalId;
    }
  });

  // Track new lists to create
  const newListsSet = new Set<string>();
  if (
    listResolution.unspecifiedListAction === 'create_new' &&
    listResolution.unspecifiedNewListName
  ) {
    newListsSet.add(listResolution.unspecifiedNewListName.trim());
  }
  Object.values(listResolution.listMappings).forEach((lm) => {
    if (lm.action === 'create_new' && lm.newListName) {
      newListsSet.add(lm.newListName.trim());
    }
  });

  // Track new statuses to create
  const newStatusesSet = new Set<string>();
  statusMappings.forEach((sm) => {
    if (sm.isNewStatus) {
      newStatusesSet.add(sm.targetStatus.trim());
    }
  });

  // 2. Generate Preview Items & Remap Dependencies
  const previewItems: ImportPreviewItem[] = [];
  let dependenciesRemappedCount = 0;
  let validTasksCount = 0;

  rows.forEach((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rawTitle = titleCol ? (row[titleCol] || '').trim() : '';
    const rawExternalId = idCol ? (row[idCol] || '').trim() : '';
    const internalId = rawExternalId ? idMappingTable[rawExternalId] : idMappingTable[`row_${idx}`];

    if (!rawTitle) {
      errors.push('Missing task name/title');
    }

    // Resolve List
    const rawListName = listCol ? (row[listCol] || '').trim() : '';
    let targetListName = '';
    let targetListId = '';
    let isNewList = false;

    if (!rawListName) {
      if (listResolution.unspecifiedListAction === 'create_new') {
        targetListName = listResolution.unspecifiedNewListName || 'Imported Tasks';
        targetListId = `list-${targetListName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        isNewList = true;
      } else {
        const found = existingSpaceLists.find((l) => l.id === listResolution.unspecifiedListTargetListId);
        targetListName = found?.name || existingSpaceLists[0]?.name || 'Default List';
        targetListId = found?.id || existingSpaceLists[0]?.id || 'default-list';
        isNewList = false;
      }
    } else {
      const mapping = listResolution.listMappings[rawListName];
      if (mapping?.action === 'create_new') {
        targetListName = mapping.newListName || rawListName;
        targetListId = `list-${targetListName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        isNewList = true;
      } else {
        const existing = existingSpaceLists.find((l) => l.id === mapping?.targetListId);
        if (existing) {
          targetListName = existing.name;
          targetListId = existing.id;
          isNewList = false;
        } else {
          // Fallback to creating list
          targetListName = rawListName;
          targetListId = `list-${rawListName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          isNewList = true;
        }
      }
    }

    // Resolve Status
    const rawStatus = statusCol ? (row[statusCol] || '').trim() : '';
    const mappedStatus = statusMap[rawStatus] || statusMappings[0]?.targetStatus || 'Backlog';

    // Resolve Priority
    const rawPriority = priorityCol ? (row[priorityCol] || '').trim().toLowerCase() : '';
    let priority: PriorityLevel = 'Medium';
    if (['urgent', 'p0', 'critical', 'blocker', 'highest'].includes(rawPriority)) priority = 'Urgent';
    else if (['high', 'p1', 'major'].includes(rawPriority)) priority = 'High';
    else if (['low', 'p3', 'minor', 'trivial'].includes(rawPriority)) priority = 'Low';

    // Resolve Assignee
    const rawAssignee = assigneeCol ? (row[assigneeCol] || '').trim() : '';

    // Resolve Dependencies
    const rawDepValue = depCol ? row[depCol] : '';
    const rawDependencies: string[] = [];
    const resolvedDependencies: string[] = [];
    const unresolvedDependencies: string[] = [];

    if (rawDepValue) {
      const tokens = String(rawDepValue)
        .split(/[,;\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      tokens.forEach((token) => {
        rawDependencies.push(token);
        if (idMappingTable[token]) {
          resolvedDependencies.push(idMappingTable[token]);
          dependenciesRemappedCount++;
        } else if (existingIdsSet.has(token)) {
          resolvedDependencies.push(token);
        } else {
          unresolvedDependencies.push(token);
          warnings.push(`Dependency '${token}' not found in import batch or workspace`);
        }
      });
    }

    // Resolve Custom Fields
    const customFields: Record<string, any> = {};
    customCols.forEach((col) => {
      const key = col.customFieldName || col.sourceColumn;
      const val = row[col.sourceColumn];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        customFields[key] = String(val).trim();
      }
    });

    if (errors.length === 0) {
      validTasksCount++;
    }

    previewItems.push({
      rawIndex: idx,
      sourceId: rawExternalId || undefined,
      internalId,
      title: rawTitle || `Untitled Task (${internalId})`,
      targetListName,
      targetListId,
      isNewList,
      status: mappedStatus,
      priority,
      assigneeName: rawAssignee || undefined,
      dependencies: resolvedDependencies,
      rawDependencies,
      unresolvedDependencies,
      customFields,
      errors,
      warnings,
    });
  });

  return {
    previewItems,
    idMappingTable,
    dependenciesRemappedCount,
    newListsToCreate: Array.from(newListsSet),
    newStatusesToCreate: Array.from(newStatusesSet),
    totalTasks: rows.length,
    validTasksCount,
  };
}

// ==========================================
// 7. Full Execution Engine
// ==========================================

export function buildExecutionTasks(options: {
  rows: Record<string, any>[];
  fieldMappings: FieldMapping[];
  previewItems: ImportPreviewItem[];
  space: SpaceFolder;
  members: TeamMember[];
}): TaskItem[] {
  const { rows, fieldMappings, previewItems, members } = options;

  const descCol = fieldMappings.find((m) => m.targetField === 'description')?.sourceColumn;
  const dueDateCol = fieldMappings.find((m) => m.targetField === 'dueDate')?.sourceColumn;
  const tagsCol = fieldMappings.find((m) => m.targetField === 'tags')?.sourceColumn;
  const pointsCol = fieldMappings.find((m) => m.targetField === 'estimationPoints')?.sourceColumn;
  const hoursCol = fieldMappings.find((m) => m.targetField === 'estimationHours')?.sourceColumn;
  const gitCol = fieldMappings.find((m) => m.targetField === 'gitBranch')?.sourceColumn;
  const subtasksCol = fieldMappings.find((m) => m.targetField === 'subtasks')?.sourceColumn;

  const defaultAssignee: TeamMember = members[0] || {
    id: 'mem-1',
    name: 'Alex Wong',
    initials: 'AW',
    role: 'Operator',
    department: 'Engineering',
    activeTasks: 0,
    capacityStatus: 'Available',
    avatarBg: '#ea580c',
    avatarColor: '#ffffff',
  };

  return previewItems.map((item) => {
    const rawRow = rows[item.rawIndex] || {};

    // Assignee matching
    let assignee = defaultAssignee;
    if (item.assigneeName) {
      const match = members.find(
        (m) =>
          m.name.toLowerCase() === item.assigneeName!.toLowerCase() ||
          (m.email && m.email.toLowerCase() === item.assigneeName!.toLowerCase())
      );
      if (match) {
        assignee = match;
      }
    }

    // Due Date
    const rawDueDate = dueDateCol ? (rawRow[dueDateCol] || '').trim() : '';

    // Tags
    const rawTags = tagsCol ? (rawRow[tagsCol] || '').trim() : '';
    const tags = rawTags
      ? rawTags.split(/[,;]+/).map((t) => t.trim()).filter(Boolean)
      : ['Imported'];

    // Estimation
    const rawPoints = pointsCol ? parseFloat(rawRow[pointsCol]) : NaN;
    const rawHours = hoursCol ? parseFloat(rawRow[hoursCol]) : NaN;

    // Subtasks
    const subtasks: any[] = [];
    if (subtasksCol && rawRow[subtasksCol]) {
      const parts = String(rawRow[subtasksCol]).split(/[\n,;]+/);
      parts.forEach((p, sIdx) => {
        const t = p.trim();
        if (t) {
          subtasks.push({
            id: `sub-${item.internalId}-${sIdx + 1}`,
            text: t,
            done: false,
            author: assignee.initials,
            time: 'Imported',
          });
        }
      });
    }

    const taskItem: TaskItem = {
      id: item.internalId,
      title: item.title,
      description: descCol ? (rawRow[descCol] || '').trim() : '',
      specMarkdown: descCol ? (rawRow[descCol] || '').trim() : '',
      status: item.status as TaskStatus,
      priority: item.priority as PriorityLevel,
      assignee,
      assigneeId: assignee.id,
      tags,
      subtasks,
      estimation: {
        points: isNaN(rawPoints) ? 2 : rawPoints,
        hours: isNaN(rawHours) ? 4 : rawHours,
      },
      targetCycle: item.targetListName,
      listId: item.targetListId || item.targetListName,
      dueDate: rawDueDate || 'Oct 28, 2026',
      startDate: '',
      completedAt: item.status === 'Done' ? new Date().toISOString() : undefined,
      gitBranch: gitCol ? (rawRow[gitCol] || '').trim() : '',
      replicationHash: `0x${Math.random().toString(16).substring(2, 8)}`,
      timeInStage: 'Imported',
      dependencies: item.dependencies,
      externalId: item.sourceId,
      customLinks: {
        ...item.customFields,
        importedAt: new Date().toISOString(),
        externalId: item.sourceId || undefined,
        dependencies: item.dependencies,
        unresolvedDependencies: item.unresolvedDependencies.length > 0 ? item.unresolvedDependencies : undefined,
      },
      activity: [
        {
          id: `act-${Date.now()}-${item.rawIndex}`,
          type: 'commit',
          author: assignee.name,
          initials: assignee.initials,
          time: 'Just now',
          text: `Task imported from external dataset${item.sourceId ? ` (source ID: ${item.sourceId})` : ''}`,
        },
      ],
    };

    return taskItem;
  });
}

// ==========================================
// 8. Space Export Process (JSON & CSV)
// ==========================================

export function exportSpaceToJson(
  space: SpaceFolder,
  tasks: TaskItem[],
  statuses: StatusDefinition[],
  listSettings?: ListSettings,
  filterListId?: string
): string {
  let targetTasks = tasks;
  if (filterListId) {
    const listObj = space.items.find((i) => i.id === filterListId);
    const listName = listObj?.name || filterListId;
    targetTasks = tasks.filter(
      (t) => t.targetCycle.toLowerCase() === listName.toLowerCase() || t.targetCycle === filterListId
    );
  }

  const payload: SpaceExportPayload = {
    metadata: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      spaceId: space.id,
      spaceName: space.name,
      spaceColor: space.color,
      spaceIcon: space.icon,
      spaceDescription: space.description,
      totalTasks: targetTasks.length,
      totalLists: filterListId ? 1 : space.items.length,
    },
    space,
    statuses,
    listSettings,
    tasks: targetTasks,
  };

  return JSON.stringify(payload, null, 2);
}

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportSpaceToCsv(
  tasks: TaskItem[],
  space: SpaceFolder,
  filterListId?: string,
  options: { includeDependencies?: boolean; includeCustomFields?: boolean } = {}
): string {
  let targetTasks = tasks;
  if (filterListId) {
    const listObj = space.items.find((i) => i.id === filterListId);
    const listName = listObj?.name || filterListId;
    targetTasks = tasks.filter(
      (t) => t.targetCycle.toLowerCase() === listName.toLowerCase() || t.targetCycle === filterListId
    );
  }

  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Assignee',
    'List Name',
    'Due Date',
    'Tags',
    'Story Points',
    'Hours',
    'Dependencies',
    'Git Branch',
    'Subtasks Count',
  ];

  const lines: string[] = [headers.map(escapeCsvField).join(',')];

  targetTasks.forEach((t) => {
    const deps = (t.dependencies || t.customLinks?.dependencies || []).join(', ');
    const tags = (t.tags || []).join(', ');
    const subtaskCount = (t.subtasks || []).length;

    const row = [
      t.id,
      t.title,
      t.description || t.specMarkdown || '',
      t.status,
      t.priority,
      t.assignee?.name || t.assignee?.email || '',
      t.targetCycle,
      t.dueDate || '',
      tags,
      t.estimation?.points ?? '',
      t.estimation?.hours ?? '',
      deps,
      t.gitBranch || '',
      subtaskCount,
    ];

    lines.push(row.map(escapeCsvField).join(','));
  });

  return lines.join('\r\n');
}

// ==========================================
// 9. Sample Download Templates
// ==========================================

export function generateSampleCsv(): string {
  return [
    'Issue Key,Task Name,Description,Status,Priority,Assignee,List Name,Due Date,Story Points,Dependencies,Tags',
    'EXT-101,Implement OAuth2 token refresh,Automate JWT refresh rotation across edge proxies,In Progress,High,Alex Wong,Sprint 14 - Q4 Infra,Oct 20 2026,3,,Security;Auth',
    'EXT-102,Cache token response in SQLite,Save decrypted session token with AES-GCM,To Do,Medium,Sarah Jenkins,Sprint 14 - Q4 Infra,Oct 24 2026,2,EXT-101,Storage',
    'EXT-103,Add rate limit headers to gateway,Return standard 429 Retry-After headers,Review,High,Ken Ray,Q4 Core,Oct 22 2026,5,EXT-101;EXT-102,Gateway;API',
    'EXT-104,Audit telemetry metrics buffer,Ensure zero memory leak during continuous flush,Done,Low,Elena Chen,,Oct 18 2026,1,,Telemetry',
  ].join('\r\n');
}

export function generateSampleJson(): string {
  return JSON.stringify(
    {
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        spaceName: 'Engineering',
        totalTasks: 3,
        totalLists: 2,
      },
      tasks: [
        {
          id: 'EXT-201',
          title: 'Implement VFS CRDT delta merger',
          description: 'Vector clocks resolution for concurrent SQLite write transactions',
          status: 'In Progress',
          priority: 'Urgent',
          targetCycle: 'Sprint 14 - Q4 Infra',
          assignee: 'Alex Wong',
          dueDate: 'Oct 25, 2026',
          estimation: { points: 5, hours: 12 },
          tags: ['Engine', 'Replication'],
          dependencies: [],
        },
        {
          id: 'EXT-202',
          title: 'Benchmark snappy compression on query execution frames',
          description: 'Measure frame size reduction on 10k batch inserts',
          status: 'To Do',
          priority: 'High',
          targetCycle: 'Sprint 14 - Q4 Infra',
          assignee: 'Ken Ray',
          dueDate: 'Oct 28, 2026',
          estimation: { points: 3, hours: 8 },
          tags: ['Performance', 'Benchmarks'],
          dependencies: ['EXT-201'],
        },
      ],
    },
    null,
    2
  );
}
