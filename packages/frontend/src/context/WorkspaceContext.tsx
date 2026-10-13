import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  initialTasks,
  initialStatuses,
  initialListSettings,
  initialTeamMembers,
  initialCrmDeals,
  initialCrmStages,
  initialCrmPipelineSettings,
  initialDirectoryContacts,
  initialFolders,
  initialCrmPipelines,
  initialDepartments,
} from '../mockData';
import {
  TaskItem,
  TaskStatus,
  CrmDeal,
  CrmStageDefinition,
  CrmPipelineSettings as CrmPipelineSettingsType,
  DirectoryContact,
  SpaceFolder,
  SpaceSubFolder,
  CrmPipeline,
  CrmPipelineSubFolder,
  StatusDefinition,
  ListSettings,
  TeamMember,
  UserSpace,
  FolderChildItem,
  DocItem,
  DocClassification,
  Department,
  WorkspaceRole,
  RolePermissions,
  INITIAL_SYSTEM_ROLES,
  resolveEffectivePermissions,
  DocFolder,
} from '../types';
import { DeletionTarget } from '../components/DeleteConfirmationModal';
import {
  tasksApi,
  dealsApi,
  pipelinesApi,
  membersApi,
  contactsApi,
  workspaceApi,
  rolesApi,
  pluginsApi,
  docsApi,
} from '../services/api';
import { parseRecurrenceConfig, calculateNextDueDate } from '../utils/recurrenceUtils';
import { useAuth } from './AuthContext';
import {
  getAllItemsFromFolder,
  getAllItemsFromSubFolder,
  addSubFolderRecursively,
  updateSubFolderRecursively,
  deleteSubFolderRecursively,
  addListToSubFolderRecursively,
  addPipelineSubFolderRecursively,
  updatePipelineSubFolderRecursively,
  deletePipelineSubFolderRecursively,
  flattenSubFolders,
  flattenPipelineSubFolders,
  updateListItemInSubFoldersRecursively,
  deleteListItemFromSubFoldersRecursively,
  moveListToFolder,
  movePipelineSubFolder,
} from '../utils/treeUtils';

interface WorkspaceContextType {
  // Data
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  statuses: StatusDefinition[];
  setStatuses: React.Dispatch<React.SetStateAction<StatusDefinition[]>>;
  listSettings: ListSettings;
  setListSettings: React.Dispatch<React.SetStateAction<ListSettings>>;
  members: TeamMember[];
  directoryContacts: DirectoryContact[];
  setDirectoryContacts: React.Dispatch<React.SetStateAction<DirectoryContact[]>>;
  folders: SpaceFolder[];
  setFolders: React.Dispatch<React.SetStateAction<SpaceFolder[]>>;
  syncStatus: 'connected' | 'syncing' | 'offline';
  pipelines: CrmPipeline[];
  setPipelines: React.Dispatch<React.SetStateAction<CrmPipeline[]>>;
  activePipelineId: string;
  setActivePipelineId: (id: string) => void;
  activePipelineSubFolderId: string | null;
  setActivePipelineSubFolderId: (id: string | null) => void;
  deals: CrmDeal[];
  setDeals: React.Dispatch<React.SetStateAction<CrmDeal[]>>;
  crmStages: CrmStageDefinition[];
  setCrmStages: React.Dispatch<React.SetStateAction<CrmStageDefinition[]>>;
  crmSettings: CrmPipelineSettingsType;
  setCrmSettings: React.Dispatch<React.SetStateAction<CrmPipelineSettingsType>>;
  docs: DocItem[];
  setDocs: React.Dispatch<React.SetStateAction<DocItem[]>>;
  activeDocId: string;
  setActiveDocId: (id: string) => void;

  // Navigation
  currentHub: string;
  setCurrentHub: (hub: string) => void;
  activeSpace: string;
  setActiveSpace: (space: string) => void;
  currentView: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs';
  setCurrentView: (view: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  overviewMode: 'cockpit' | 'summary';
  setOverviewMode: (mode: 'cockpit' | 'summary') => void;
  crmView: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived';
  setCrmView: (v: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived') => void;
  crmSettingsInitialTab: 'general' | 'stages';
  setCrmSettingsInitialTab: (tab: 'general' | 'stages') => void;

  // Selected item inspectors
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  taskToEdit: TaskItem | null;
  setTaskToEdit: (task: TaskItem | null) => void;
  dealToEdit: CrmDeal | null;
  setDealToEdit: (deal: CrmDeal | null) => void;
  taskToDelete: TaskItem | null;
  setTaskToDelete: (task: TaskItem | null) => void;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterPriority: string | null;
  setFilterPriority: (p: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (s: string | null) => void;
  filterAssignee: string | null;
  setFilterAssignee: (a: string | null) => void;
  quickFilter: string | null;
  setQuickFilter: (q: string | null) => void;
  taskGroupBy: 'status' | 'priority' | 'assignee';
  setTaskGroupBy: (g: 'status' | 'priority' | 'assignee') => void;
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: (cols: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  crmFilterStage: string | null;
  setCrmFilterStage: (s: string | null) => void;
  crmFilterOwner: string | null;
  setCrmFilterOwner: (o: string | null) => void;
  handleClearAllFilters: () => void;

  // Modals & Popovers
  isNewItemModalOpen: boolean;
  setIsNewItemModalOpen: (open: boolean) => void;
  isNewFolderModalOpen: boolean;
  setIsNewFolderModalOpen: (open: boolean) => void;
  isNewSubFolderModalOpen: boolean;
  setIsNewSubFolderModalOpen: (open: boolean) => void;
  targetFolderForNewSubFolder: SpaceFolder | null;
  setTargetFolderForNewSubFolder: (folder: SpaceFolder | null) => void;
  targetParentSubFolderIdForNewSubFolder: string | null;
  setTargetParentSubFolderIdForNewSubFolder: (id: string | null) => void;
  isNewListModalOpen: boolean;
  setIsNewListModalOpen: (open: boolean) => void;
  targetFolderForNewList: SpaceFolder | null;
  setTargetFolderForNewList: (folder: SpaceFolder | null) => void;
  targetSubFolderIdForNewList: string | null;
  setTargetSubFolderIdForNewList: (id: string | null) => void;
  isNewContactModalOpen: boolean;
  setIsNewContactModalOpen: (open: boolean) => void;
  isNewPipelineModalOpen: boolean;
  setIsNewPipelineModalOpen: (open: boolean) => void;
  isNewPipelineSubFolderModalOpen: boolean;
  setIsNewPipelineSubFolderModalOpen: (open: boolean) => void;
  targetPipelineForNewSubFolder: CrmPipeline | null;
  setTargetPipelineForNewSubFolder: (pipeline: CrmPipeline | null) => void;
  targetParentPipelineSubFolderId: string | null;
  setTargetParentPipelineSubFolderId: (id: string | null) => void;
  isNewWorkspaceModalOpen: boolean;
  setIsNewWorkspaceModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  newItemType: 'task' | 'deal';
  setNewItemType: (type: 'task' | 'deal') => void;
  newItemDefaultStatus: TaskStatus;
  setNewItemDefaultStatus: (status: TaskStatus) => void;
  newItemDefaultDealStage: CrmDeal['stage'];
  setNewItemDefaultDealStage: (stage: CrmDeal['stage']) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Space Import & Export
  isSpaceImportModalOpen: boolean;
  setIsSpaceImportModalOpen: (open: boolean) => void;
  isSpaceExportModalOpen: boolean;
  setIsSpaceExportModalOpen: (open: boolean) => void;
  targetSpaceForImportExport: SpaceFolder | null;
  setTargetSpaceForImportExport: (space: SpaceFolder | null) => void;
  targetListIdForExport: string | null;
  setTargetListIdForExport: (listId: string | null) => void;
  handleOpenSpaceImport: (space?: SpaceFolder) => void;
  handleOpenSpaceExport: (space?: SpaceFolder, listId?: string) => void;

  // Inspector & Modal Targets
  folderToEdit: SpaceFolder | null;
  setFolderToEdit: (folder: SpaceFolder | null) => void;
  subFolderToEdit: { folder: SpaceFolder; subFolder: SpaceSubFolder } | null;
  setSubFolderToEdit: (val: { folder: SpaceFolder; subFolder: SpaceSubFolder } | null) => void;
  pipelineToEdit: CrmPipeline | null;
  setPipelineToEdit: (pipeline: CrmPipeline | null) => void;
  pipelineSubFolderToEdit: { pipeline: CrmPipeline; subFolder: CrmPipelineSubFolder } | null;
  setPipelineSubFolderToEdit: (val: { pipeline: CrmPipeline; subFolder: CrmPipelineSubFolder } | null) => void;
  itemToDelete: DeletionTarget | null;
  setItemToDelete: (target: DeletionTarget | null) => void;

  // Computed & Derived
  filteredTasks: TaskItem[];
  filteredDeals: CrmDeal[];
  selectedTask: TaskItem | null;
  selectedDeal: CrmDeal | null;
  activePipeline: CrmPipeline;

  // Mutations
  handleSelectSpace: (space: string) => void;
  handleSelectView: (view: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
  handleOpenAddTaskToColumn: (status: TaskStatus) => void;
  handleOpenAddDealToStage: (stage?: CrmDeal['stage']) => void;
  handleOpenAddListToFolder: (folder?: SpaceFolder, subFolderId?: string) => void;
  handleOpenAddSubFolder: (folder?: SpaceFolder, parentSubFolderId?: string) => void;
  handleOpenAddPipelineSubFolder: (pipeline?: CrmPipeline, parentSubFolderId?: string) => void;
  handleAddListToFolder: (folderId: string, listName: string, status?: string, subFolderId?: string) => void;
  handleOpenEditTask: (task: TaskItem) => void;
  handleOpenEditDeal: (deal: CrmDeal) => void;
  handleOpenCreateTask: (status?: TaskStatus) => void;
  handleOpenCreateDeal: (stage?: CrmDeal['stage']) => void;
  handleUpdateTask: (task: TaskItem) => void;
  handleCreateTask: (task: Partial<TaskItem>) => void;
  handleDeleteTask: (taskId: string) => void;
  handleConfirmDeleteTask: () => void;
  handleUpdateDeal: (deal: CrmDeal) => void;
  handleCreateDeal: (deal: Partial<CrmDeal>) => void;
  handleDeleteDeal: (dealId: string) => void;
  handleAdvanceDealStage: (dealId: string, newStage: CrmDeal['stage']) => void;
  handleMoveTaskStatus: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => void;
  handleUpdateListSettings: (newSettings: Partial<ListSettings>) => void;
  handleUpdateStatuses: (newStatuses: StatusDefinition[]) => void;
  handleUpdateCrmSettings: (newSettings: Partial<CrmPipelineSettingsType>) => void;
  handleUpdateCrmStages: (newStages: CrmStageDefinition[]) => void;
  handleCreateFolder: (folder: SpaceFolder) => void;
  handleUpdateFolder: (folder: SpaceFolder) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleDeleteTaskSpace: (listId: string) => Promise<void>;
  handleRenameStatus: (oldName: string, newName: string) => void;
  handleCreateSubFolder: (folderId: string, newSubFolder: SpaceSubFolder) => void;
  handleUpdateSubFolder: (folderId: string, updatedSubFolder: SpaceSubFolder) => void;
  handleDeleteSubFolder: (folderId: string, subFolderId: string) => void;
  handleCreatePipeline: (pipeline: CrmPipeline) => void;
  handleUpdatePipeline: (pipeline: CrmPipeline) => void;
  handleDeletePipeline: (pipelineId: string) => void;
  handleCreatePipelineSubFolder: (pipelineId: string, newSubFolder: CrmPipelineSubFolder) => void;
  handleUpdatePipelineSubFolder: (pipelineId: string, updatedSubFolder: CrmPipelineSubFolder) => void;
  handleDeletePipelineSubFolder: (pipelineId: string, subFolderId: string) => void;
  handleConfirmDeleteItem: () => void;
  handleCreateContact: (contact: DirectoryContact) => void;
  handleUpdateContact: (contact: DirectoryContact) => void;
  handleDeleteContact: (contactId: string) => void;
  handleCreateDoc: (doc?: Partial<DocItem>) => DocItem;
  handleUpdateDoc: (id: string, updates: Partial<DocItem>) => void;
  handleDeleteDoc: (id: string) => void;
  handleDuplicateDoc: (id: string) => void;
  docFolders: DocFolder[];
  setDocFolders: React.Dispatch<React.SetStateAction<DocFolder[]>>;
  handleCreateDocFolder: (data: Partial<DocFolder>) => Promise<DocFolder>;
  handleUpdateDocFolder: (id: string, data: Partial<DocFolder>) => Promise<DocFolder>;
  handleDeleteDocFolder: (id: string) => Promise<void>;
  handleMoveListToFolder: (listId: string, targetFolderId: string, targetSubFolderId?: string) => Promise<boolean>;
  handleMovePipelineSubFolder: (subFolderId: string, targetPipelineId: string, targetParentSubFolderId?: string) => Promise<boolean>;
  handleMoveDocToFolder: (docId: string, targetFolderId: string | null) => Promise<boolean>;

  // Plugins System
  enabledPlugins: Record<string, boolean>;
  isPluginEnabled: (pluginId: string) => boolean;
  handleTogglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;

  // Top-left User Space Dropdown & Creation
  userSpaces: UserSpace[];
  activeUserSpaceId: string;
  setActiveUserSpaceId: (id: string) => void;
  activeUserSpace: UserSpace;
  handleSelectUserSpace: (spaceId: string) => void;
  handleCreateUserSpace: (space: { name: string; color?: string; icon?: string }) => void;
  handleUpdateWorkspace: (workspaceId: string, updates: { name?: string; color?: string; icon?: string }) => Promise<void>;
  handleDeleteWorkspace: (workspaceId: string) => Promise<void>;

  // Departments
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  handleCreateDepartment: (dept: Partial<Department>) => Promise<Department>;
  handleUpdateDepartment: (id: string, updates: Partial<Department>) => Promise<Department>;
  handleDeleteDepartment: (id: string, reassignToDeptName?: string) => Promise<void>;

  // Roles & Permissions
  roles: WorkspaceRole[];
  setRoles: React.Dispatch<React.SetStateAction<WorkspaceRole[]>>;
  effectivePermissions: RolePermissions;
  handleCreateRole: (role: Partial<WorkspaceRole>) => Promise<WorkspaceRole>;
  handleUpdateRole: (id: string, updates: Partial<WorkspaceRole>) => Promise<WorkspaceRole>;
  handleDeleteRole: (id: string) => Promise<void>;
  handleDuplicateRole: (id: string) => Promise<WorkspaceRole>;

  // Member & Access Control
  handleInviteMember: (data: {
    name: string;
    email: string;
    role?: string;
    roleId?: string;
    accessLevel?: string;
    department?: string;
    capacityStatus?: string;
    password?: string;
    canLogin?: boolean;
    allowedPages?: string[];
    allowedActions?: string[];
    permissionOverrides?: any;
  }) => Promise<TeamMember>;
  handleUpdateMemberAccess: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  handleRemoveMember: (id: string) => Promise<void>;
  handleChangePassword: (id: string, password: string) => Promise<void>;
  handleToggleLogin: (id: string, canLogin?: boolean) => Promise<void>;

  refreshData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const deduplicateStatuses = (list: StatusDefinition[]): StatusDefinition[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: StatusDefinition[] = [];
  for (const s of list) {
    const key = (s.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(s);
  }
  return result;
};

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [statuses, setStatuses] = useState<StatusDefinition[]>(() => deduplicateStatuses(initialStatuses));
  const [listSettings, setListSettings] = useState(initialListSettings);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([]);
  const [folders, setFolders] = useState<SpaceFolder[]>([]);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');
  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const stored = localStorage.getItem('backnode_departments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached departments:', e);
    }
    return initialDepartments;
  });

  const [roles, setRoles] = useState<WorkspaceRole[]>(() => {
    try {
      const stored = localStorage.getItem('backnode_roles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached roles:', e);
    }
    return INITIAL_SYSTEM_ROLES;
  });

  const currentMember = members.find(
    (m) =>
      (user?.email && m.email?.toLowerCase() === user.email.toLowerCase()) ||
      m.id === user?.id
  );

  const effectivePermissions = useMemo<RolePermissions>(() => {
    const isOwner = user?.role === 'OWNER' || currentMember?.accessLevel === 'OWNER';
    if (isOwner) {
      return resolveEffectivePermissions(null, null, true);
    }
    const roleId = currentMember?.roleId || user?.roleId;
    let assignedRole = roles.find((r) => r.id === roleId);
    if (!assignedRole) {
      const roleName = currentMember?.role || user?.role;
      if (roleName) {
        assignedRole = roles.find(
          (r) =>
            r.name.toLowerCase() === roleName.toLowerCase() ||
            (r.key && r.key.toLowerCase() === roleName.toLowerCase())
        );
      }
    }
    const overrides = currentMember?.permissionOverrides || user?.permissionOverrides;
    return resolveEffectivePermissions(assignedRole, overrides, false);
  }, [user, currentMember, roles]);

  // CRM state
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [activePipelineSubFolderId, setActivePipelineSubFolderId] = useState<string | null>(null);
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false);
  const [isNewPipelineSubFolderModalOpen, setIsNewPipelineSubFolderModalOpen] = useState(false);
  const [targetPipelineForNewSubFolder, setTargetPipelineForNewSubFolder] = useState<CrmPipeline | null>(null);
  const [targetParentPipelineSubFolderId, setTargetParentPipelineSubFolderId] = useState<string | null>(null);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [crmStages, setCrmStages] = useState<CrmStageDefinition[]>(initialCrmStages);
  const [crmSettings, setCrmSettings] = useState<CrmPipelineSettingsType>(initialCrmPipelineSettings);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [crmView, setCrmView] = useState<'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived'>('dashboard');
  const [crmSettingsInitialTab, setCrmSettingsInitialTab] = useState<'general' | 'stages'>('general');

  // Docs state
  const [docs, setDocs] = useState<DocItem[]>(() => {
    try {
      const stored = localStorage.getItem('backnode_docs_collection');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached docs:', e);
    }
    return [];
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    return localStorage.getItem('backnode_active_doc_id') || '';
  });

  useEffect(() => {
    try {
      localStorage.setItem('backnode_docs_collection', JSON.stringify(docs));
    } catch (e) {
      console.warn('Failed to persist docs:', e);
    }
  }, [docs]);

  useEffect(() => {
    if (activeDocId) {
      localStorage.setItem('backnode_active_doc_id', activeDocId);
    }
  }, [activeDocId]);

  const [docFolders, setDocFolders] = useState<DocFolder[]>([]);
  const [enabledPlugins, setEnabledPlugins] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('backnode_enabled_plugins');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return { tasks: true, crm: true, contacts: true, docs: true };
  });

  const isPluginEnabled = (pluginId: string): boolean => {
    return enabledPlugins[pluginId] !== false;
  };

  // Navigation state
  const [currentHub, setCurrentHub] = useState<string>('overview');
  const [activeSpace, setActiveSpace] = useState<string>('sprint-14');
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs'
  >('dashboard');
  const [overviewMode, setOverviewMode] = useState<'cockpit' | 'summary'>('cockpit');

  // Inspector & Modal states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [dealToEdit, setDealToEdit] = useState<CrmDeal | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<SpaceFolder | null>(null);
  const [subFolderToEdit, setSubFolderToEdit] = useState<{ folder: SpaceFolder; subFolder: SpaceSubFolder } | null>(null);
  const [pipelineToEdit, setPipelineToEdit] = useState<CrmPipeline | null>(null);
  const [pipelineSubFolderToEdit, setPipelineSubFolderToEdit] = useState<{ pipeline: CrmPipeline; subFolder: CrmPipelineSubFolder } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DeletionTarget | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [targetFolderForNewList, setTargetFolderForNewList] = useState<SpaceFolder | null>(null);
  const [targetSubFolderIdForNewList, setTargetSubFolderIdForNewList] = useState<string | null>(null);
  const [isNewSubFolderModalOpen, setIsNewSubFolderModalOpen] = useState(false);
  const [targetFolderForNewSubFolder, setTargetFolderForNewSubFolder] = useState<SpaceFolder | null>(null);
  const [targetParentSubFolderIdForNewSubFolder, setTargetParentSubFolderIdForNewSubFolder] = useState<string | null>(null);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<'task' | 'deal'>('task');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [newItemDefaultStatus, setNewItemDefaultStatus] = useState<TaskStatus>('Backlog');
  const [newItemDefaultDealStage, setNewItemDefaultDealStage] = useState<CrmDeal['stage']>('Proposal Submitted');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Space Import & Export state
  const [isSpaceImportModalOpen, setIsSpaceImportModalOpen] = useState(false);
  const [isSpaceExportModalOpen, setIsSpaceExportModalOpen] = useState(false);
  const [targetSpaceForImportExport, setTargetSpaceForImportExport] = useState<SpaceFolder | null>(null);
  const [targetListIdForExport, setTargetListIdForExport] = useState<string | null>(null);

  const handleOpenSpaceImport = (space?: SpaceFolder) => {
    setTargetSpaceForImportExport(space || folders[0] || null);
    setIsSpaceImportModalOpen(true);
  };

  const handleOpenSpaceExport = (space?: SpaceFolder, listId?: string) => {
    setTargetSpaceForImportExport(space || folders[0] || null);
    setTargetListIdForExport(listId || null);
    setIsSpaceExportModalOpen(true);
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [taskGroupBy, setTaskGroupBy] = useState<'status' | 'priority' | 'assignee'>('status');
  const [visibleColumns, setVisibleColumnsState] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('backnode_visible_task_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: true,
      title: true,
      status: true,
      priority: true,
      due: true,
      start: true,
      assignee: true,
      deal: true,
      estimation: true,
    };
  });

  const setVisibleColumns = (cols: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setVisibleColumnsState((prev) => {
      const next = typeof cols === 'function' ? cols(prev) : cols;
      localStorage.setItem('backnode_visible_task_columns', JSON.stringify(next));
      return next;
    });
  };
  const [crmFilterStage, setCrmFilterStage] = useState<string | null>(null);
  const [crmFilterOwner, setCrmFilterOwner] = useState<string | null>(null);

  // Filter helper to purge any mock or dummy workspaces
  const filterRealWorkspaces = (spaces: UserSpace[]): UserSpace[] => {
    if (!Array.isArray(spaces)) return [];
    return spaces.filter(
      (s) =>
        s &&
        s.name &&
        s.name !== 'Cloud Infrastructure & SRE' &&
        s.name !== 'Product Growth & CRM Labs' &&
        s.name !== 'Engineering Systems' &&
        s.name !== 'Enterprise Deals & PoCs' &&
        s.id !== 'space-infra' &&
        s.id !== 'space-growth' &&
        s.id !== 'space-engineering' &&
        s.id !== 'space-enterprise' &&
        s.id !== 'space-main'
    );
  };

  // User Spaces state (top-left workspace selector) - Only actual workspaces that exist
  const getInitialSpace = (): UserSpace => ({
    id: user?.account?.id || user?.accountId || 'space-main',
    name: user?.account?.name || 'Workspace',
    slug: user?.account?.slug || 'workspace',
    role: (user?.role as string) || 'Owner',
    color: '#ea580c',
    icon: 'deployed_code',
    memberCount: members.length || 1,
  });

  const getInitialSpaces = (): UserSpace[] => [
    getInitialSpace(),
  ];

  const [userSpaces, setUserSpaces] = useState<UserSpace[]>(() => {
    const saved = localStorage.getItem('backnode_user_spaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = filterRealWorkspaces(parsed);
          if (cleaned.length > 0) {
            localStorage.setItem('backnode_user_spaces', JSON.stringify(cleaned));
            return cleaned;
          }
        }
      } catch {}
    }
    const initial = getInitialSpaces();
    localStorage.setItem('backnode_user_spaces', JSON.stringify(initial));
    return initial;
  });

  const [activeUserSpaceId, setActiveUserSpaceId] = useState<string>(() => {
    const saved = localStorage.getItem('backnode_active_user_space_id');
    if (saved && saved !== 'space-main') return saved;
    return user?.account?.id || user?.accountId || 'space-main';
  });

  // Sync actual account workspace when user changes
  useEffect(() => {
    const accId = user?.account?.id || user?.accountId;
    const accName = user?.account?.name || (accId ? 'Workspace' : undefined);
    if (accId) {
      let nextSpaces: UserSpace[] = [];
      setUserSpaces((prev) => {
        const cleaned = filterRealWorkspaces(prev);
        const matchIndex = cleaned.findIndex(
          (s) => s.id === accId || (accName && s.name.toLowerCase() === accName.toLowerCase())
        );

        if (matchIndex >= 0) {
          nextSpaces = cleaned.map((s, idx) =>
            idx === matchIndex
              ? {
                  ...s,
                  id: accId,
                  name: accName || s.name,
                  slug: user?.account?.slug || s.slug,
                  role: (user?.role as string) || 'Owner',
                  memberCount: members.length || s.memberCount || 1,
                }
              : s
          );
        } else {
          nextSpaces = [
            {
              id: accId,
              name: accName || 'Workspace',
              slug: user?.account?.slug || 'workspace',
              role: (user?.role as string) || 'Owner',
              color: '#ea580c',
              icon: 'deployed_code',
              memberCount: members.length || 1,
            },
            ...cleaned,
          ];
        }
        localStorage.setItem('backnode_user_spaces', JSON.stringify(nextSpaces));
        return nextSpaces;
      });

      setActiveUserSpaceId((curr) => {
        const savedId = localStorage.getItem('backnode_active_user_space_id');
        if (savedId && savedId !== 'space-main' && nextSpaces.some((s) => s.id === savedId)) {
          return savedId;
        }
        if (curr && curr !== 'space-main' && nextSpaces.some((s) => s.id === curr)) {
          return curr;
        }
        const targetId = accId;
        localStorage.setItem('backnode_active_user_space_id', targetId);
        return targetId;
      });
    }
  }, [user?.account?.id, user?.account?.name, user?.accountId]);

  const activeUserSpace =
    userSpaces.find((s) => s.id === activeUserSpaceId) || userSpaces[0] || getInitialSpace();

  const handleSelectUserSpace = (spaceId: string) => {
    const found = userSpaces.find((s) => s.id === spaceId);
    if (found) {
      setActiveUserSpaceId(spaceId);
      localStorage.setItem('backnode_active_user_space_id', spaceId);
      showToast(`Switched to workspace: ${found.name}`);
      setTimeout(() => {
        loadData();
      }, 0);
    }
  };

  const handleCreateUserSpace = async (space: { name: string; color?: string; icon?: string }) => {
    try {
      const createdSpace = await workspaceApi.createWorkspace({
        name: space.name.trim(),
        color: space.color || '#ea580c',
        icon: space.icon || 'workspaces',
      });
      const updated = [...filterRealWorkspaces(userSpaces), createdSpace];
      setUserSpaces(updated);
      setActiveUserSpaceId(createdSpace.id);
      localStorage.setItem('backnode_user_spaces', JSON.stringify(updated));
      localStorage.setItem('backnode_active_user_space_id', createdSpace.id);
      showToast(`Workspace "${createdSpace.name}" created and activated!`);
      setTimeout(() => {
        loadData();
      }, 0);
    } catch (err) {
      console.warn('Backend workspace creation error, falling back locally:', err);
      const createdSpace: UserSpace = {
        id: `space-${Date.now()}`,
        name: space.name.trim(),
        slug: space.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        role: 'Owner',
        color: space.color || '#ea580c',
        icon: space.icon || 'workspaces',
        memberCount: 1,
      };
      const updated = [...filterRealWorkspaces(userSpaces), createdSpace];
      setUserSpaces(updated);
      setActiveUserSpaceId(createdSpace.id);
      localStorage.setItem('backnode_user_spaces', JSON.stringify(updated));
      localStorage.setItem('backnode_active_user_space_id', createdSpace.id);
      showToast(`Workspace "${createdSpace.name}" created!`);
    }
  };

  const handleUpdateWorkspace = async (
    workspaceId: string,
    updates: { name?: string; color?: string; icon?: string },
  ) => {
    try {
      const updated = await workspaceApi.updateWorkspace(workspaceId, updates);
      setUserSpaces((prev) => {
        const next = prev.map((s) => (s.id === workspaceId ? { ...s, ...updated } : s));
        localStorage.setItem('backnode_user_spaces', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.warn('Backend workspace update failed, applying locally:', err);
      setUserSpaces((prev) => {
        const next = prev.map((s) => (s.id === workspaceId ? { ...s, ...updates } : s));
        localStorage.setItem('backnode_user_spaces', JSON.stringify(next));
        return next;
      });
    }
    showToast('Workspace settings saved');
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      await workspaceApi.deleteWorkspace(workspaceId);
    } catch (err) {
      console.warn('Backend workspace delete failed, removing locally:', err);
    }

    const currentSpaces = [...userSpaces];
    const targetSpace = currentSpaces.find((s) => s.id === workspaceId);
    let remaining = currentSpaces.filter((s) => s.id !== workspaceId);

    if (remaining.length === 0) {
      const fallbackSpace: UserSpace = {
        id: `space-${Date.now()}`,
        name: 'Personal Workspace',
        slug: 'personal-workspace',
        role: 'Owner',
        color: '#ea580c',
        icon: 'workspaces',
        memberCount: 1,
      };
      remaining = [fallbackSpace];
    }

    setUserSpaces(remaining);
    localStorage.setItem('backnode_user_spaces', JSON.stringify(remaining));

    if (activeUserSpaceId === workspaceId) {
      const nextSpace = remaining[0];
      setActiveUserSpaceId(nextSpace.id);
      localStorage.setItem('backnode_active_user_space_id', nextSpace.id);
      showToast(`Workspace "${targetSpace?.name || 'Workspace'}" deleted. Switched to ${nextSpace.name}`);
      setTimeout(() => {
        loadData();
      }, 0);
    } else {
      showToast(`Workspace "${targetSpace?.name || 'Workspace'}" deleted`);
    }
  };

  const handleCreateDepartment = async (deptData: Partial<Department>): Promise<Department> => {
    try {
      const created = await workspaceApi.createDepartment(deptData);
      setDepartments((prev) => {
        const next = deptData.isDefault
          ? [...prev.map((d) => ({ ...d, isDefault: false })), created]
          : [...prev, created];
        localStorage.setItem(`backnode_departments_${activeUserSpaceId}`, JSON.stringify(next));
        localStorage.setItem('backnode_departments', JSON.stringify(next));
        return next;
      });
      showToast(`Department "${created.name}" created`);
      return created;
    } catch (err) {
      console.warn('Backend create department failed, saving locally:', err);
      const newDept: Department = {
        id: deptData.id || `dept-${Date.now().toString(36)}`,
        name: (deptData.name || 'New Department').trim(),
        code: (deptData.code || deptData.name?.slice(0, 4) || 'DEPT').trim().toUpperCase(),
        description: deptData.description || '',
        color: deptData.color || '#ea580c',
        icon: deptData.icon || 'domain',
        headMemberId: deptData.headMemberId || '',
        isDefault: !!deptData.isDefault,
        accountId: activeUserSpaceId,
      };
      setDepartments((prev) => {
        const next = deptData.isDefault
          ? [...prev.map((d) => ({ ...d, isDefault: false })), newDept]
          : [...prev, newDept];
        localStorage.setItem(`backnode_departments_${activeUserSpaceId}`, JSON.stringify(next));
        localStorage.setItem('backnode_departments', JSON.stringify(next));
        return next;
      });
      showToast(`Department "${newDept.name}" created successfully`);
      return newDept;
    }
  };

  const handleUpdateDepartment = async (id: string, updates: Partial<Department>): Promise<Department> => {
    try {
      const updated = await workspaceApi.updateDepartment(id, updates);
      setDepartments((prev) => {
        const next = prev.map((d) => {
          if (d.id === id) return { ...d, ...updated };
          if (updates.isDefault) return { ...d, isDefault: false };
          return d;
        });
        localStorage.setItem(`backnode_departments_${activeUserSpaceId}`, JSON.stringify(next));
        localStorage.setItem('backnode_departments', JSON.stringify(next));
        return next;
      });
      if (updates.name) {
        const oldDept = departments.find((d) => d.id === id);
        if (oldDept && oldDept.name !== updates.name) {
          setMembers((prev) =>
            prev.map((m) => (m.department === oldDept.name ? { ...m, department: updates.name! } : m))
          );
        }
      }
      showToast(`Department "${updated.name}" updated`);
      return updated;
    } catch (err) {
      console.warn('Backend update department failed, applying locally:', err);
      let targetDept: Department | undefined;
      setDepartments((prev) => {
        const oldDept = prev.find((d) => d.id === id);
        const next = prev.map((d) => {
          if (d.id === id) {
            targetDept = { ...d, ...updates };
            return targetDept;
          }
          if (updates.isDefault) return { ...d, isDefault: false };
          return d;
        });
        localStorage.setItem(`backnode_departments_${activeUserSpaceId}`, JSON.stringify(next));
        localStorage.setItem('backnode_departments', JSON.stringify(next));
        if (oldDept && updates.name && oldDept.name !== updates.name) {
          setMembers((mPrev) =>
            mPrev.map((m) => (m.department === oldDept.name ? { ...m, department: updates.name! } : m))
          );
        }
        return next;
      });
      showToast('Department settings saved');
      return targetDept || ({ id, ...updates } as Department);
    }
  };

  const handleDeleteDepartment = async (id: string, reassignToDeptName?: string): Promise<void> => {
    const deptToDelete = departments.find((d) => d.id === id);
    if (!deptToDelete) return;

    try {
      await workspaceApi.deleteDepartment(id, reassignToDeptName);
    } catch (err) {
      console.warn('Backend delete department failed, removing locally:', err);
    }

    setDepartments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem(`backnode_departments_${activeUserSpaceId}`, JSON.stringify(next));
      localStorage.setItem('backnode_departments', JSON.stringify(next));
      return next;
    });

    if (reassignToDeptName) {
      setMembers((prev) =>
        prev.map((m) => (m.department === deptToDelete.name ? { ...m, department: reassignToDeptName } : m))
      );
    }

    showToast(`Department "${deptToDelete.name}" removed`);
  };

  const handleCreateRole = async (roleData: Partial<WorkspaceRole>): Promise<WorkspaceRole> => {
    try {
      const created = await rolesApi.create(roleData);
      setRoles((prev) => {
        const next = [...prev, created];
        localStorage.setItem('backnode_roles', JSON.stringify(next));
        return next;
      });
      showToast(`Role "${created.name}" created successfully`);
      return created;
    } catch (err) {
      console.warn('Backend create role failed, saving locally:', err);
      const newRole: WorkspaceRole = {
        id: roleData.id || `role-${Date.now().toString(36)}`,
        name: roleData.name || 'Custom Role',
        key: roleData.key,
        description: roleData.description || '',
        color: roleData.color || '#ea580c',
        icon: roleData.icon || 'shield_person',
        isSystem: false,
        isDefault: Boolean(roleData.isDefault),
        permissions: roleData.permissions || INITIAL_SYSTEM_ROLES[2].permissions,
        accountId: activeUserSpaceId,
      };
      setRoles((prev) => {
        const next = [...prev, newRole];
        localStorage.setItem('backnode_roles', JSON.stringify(next));
        return next;
      });
      showToast(`Role "${newRole.name}" created successfully`);
      return newRole;
    }
  };

  const handleUpdateRole = async (id: string, updates: Partial<WorkspaceRole>): Promise<WorkspaceRole> => {
    try {
      const updated = await rolesApi.update(id, updates);
      setRoles((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, ...updated } : r));
        localStorage.setItem('backnode_roles', JSON.stringify(next));
        return next;
      });
      showToast(`Role "${updated.name}" updated successfully`);
      return updated;
    } catch (err) {
      console.warn('Backend update role failed, applying locally:', err);
      let targetRole: WorkspaceRole | undefined;
      setRoles((prev) => {
        const next = prev.map((r) => {
          if (r.id === id) {
            targetRole = { ...r, ...updates };
            return targetRole;
          }
          return r;
        });
        localStorage.setItem('backnode_roles', JSON.stringify(next));
        return next;
      });
      showToast('Role changes saved');
      return targetRole || ({ id, ...updates } as WorkspaceRole);
    }
  };

  const handleDeleteRole = async (id: string): Promise<void> => {
    const roleToDelete = roles.find((r) => r.id === id);
    if (!roleToDelete) return;
    if (roleToDelete.isSystem) {
      showToast('System roles cannot be deleted');
      return;
    }
    try {
      await rolesApi.delete(id);
    } catch (err) {
      console.warn('Backend delete role failed, removing locally:', err);
    }
    setRoles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      localStorage.setItem('backnode_roles', JSON.stringify(next));
      return next;
    });
    showToast(`Role "${roleToDelete.name}" deleted`);
  };

  const handleDuplicateRole = async (id: string): Promise<WorkspaceRole> => {
    try {
      const duplicated = await rolesApi.duplicate(id);
      setRoles((prev) => {
        const next = [...prev, duplicated];
        localStorage.setItem('backnode_roles', JSON.stringify(next));
        return next;
      });
      showToast(`Duplicated role "${duplicated.name}"`);
      return duplicated;
    } catch (err) {
      console.warn('Backend duplicate role failed, duplicating locally:', err);
      const source = roles.find((r) => r.id === id) || roles[0];
      const copy: WorkspaceRole = {
        id: `role-${Date.now().toString(36)}`,
        name: `${source.name} (Copy)`,
        description: source.description ? `Copy of ${source.name}. ${source.description}` : '',
        color: source.color,
        icon: source.icon,
        isSystem: false,
        isDefault: false,
        permissions: JSON.parse(JSON.stringify(source.permissions)),
        accountId: activeUserSpaceId,
      };
      setRoles((prev) => {
        const next = [...prev, copy];
        localStorage.setItem('backnode_roles', JSON.stringify(next));
        return next;
      });
      showToast(`Duplicated role "${copy.name}"`);
      return copy;
    }
  };

  const handleInviteMember = async (data: {
    name: string;
    email: string;
    role?: string;
    roleId?: string;
    accessLevel?: string;
    department?: string;
    capacityStatus?: string;
    password?: string;
    canLogin?: boolean;
    allowedPages?: string[];
    allowedActions?: string[];
    permissionOverrides?: any;
  }) => {
    const defaultPages = ['overview', 'tasks', 'crm', 'contacts', 'docs', 'team', 'settings'];
    const defaultActions =
      data.accessLevel === 'VIEWER'
        ? ['read']
        : data.accessLevel === 'ADMIN' || data.accessLevel === 'OWNER'
        ? ['read', 'write', 'delete', 'publish', 'admin']
        : ['read', 'write', 'delete', 'publish'];

    const canLogin = data.canLogin !== undefined ? Boolean(data.canLogin) : true;

    const newMemberData: any = {
      id: `mem-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      initials: data.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      role: data.role || (data.accessLevel === 'ADMIN' ? 'Workspace Admin' : 'Product Operator'),
      roleId: data.roleId || undefined,
      permissionOverrides: data.permissionOverrides || undefined,
      accessLevel: data.accessLevel || 'MEMBER',
      status: canLogin ? 'Active' : 'Disabled',
      canLogin,
      allowedPages: data.allowedPages || defaultPages,
      allowedActions: data.allowedActions || defaultActions,
      department: (data.department as any) || 'Engineering',
      activeTasks: 0,
      capacityStatus: (data.capacityStatus as any) || 'Available',
      avatarBg: '#27272a',
      avatarColor: '#ffffff',
      invitedAt: new Date().toISOString(),
    };

    if (data.password && data.password.trim()) {
      newMemberData.password = data.password.trim();
    }

    try {
      const created = await membersApi.create(newMemberData);
      setMembers((prev) => [...prev, created]);
      showToast(`Operator "${data.name}" added to workspace!`);
      return created;
    } catch (err: any) {
      console.warn('Backend unavailable, saving locally:', err);
      const fallbackMember = newMemberData as TeamMember;
      setMembers((prev) => [...prev, fallbackMember]);
      showToast(`Operator "${data.name}" added to workspace`);
      return fallbackMember;
    }
  };

  const handleUpdateMemberAccess = async (id: string, updates: Partial<TeamMember>) => {
    const target = members.find((m) => m.id === id);
    const isOwner =
      target?.accessLevel === 'OWNER' ||
      target?.role === 'Workspace Owner' ||
      (user && (target?.id === user.id || target?.email === user.email) && user.role === 'OWNER');

    // If target is Owner, ensure accessLevel remains OWNER and canLogin remains true
    const sanitizedUpdates = isOwner
      ? { ...updates, accessLevel: 'OWNER' as const, canLogin: true, status: 'Active' as const }
      : updates;

    try {
      await membersApi.update(id, sanitizedUpdates);
    } catch (err) {
      console.warn('Backend unavailable for member update, applying locally:', err);
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...sanitizedUpdates } : m))
    );
    showToast(`Access updated for ${target?.name || 'operator'}`);
  };

  const handleChangePassword = async (id: string, password: string) => {
    const target = members.find((m) => m.id === id);
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters long.');
      throw new Error('Password must be at least 6 characters long');
    }
    try {
      await membersApi.changePassword(id, password);
      showToast(`Password updated successfully for ${target?.name || 'operator'}`);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      showToast(err?.response?.data?.message || 'Failed to update password');
      throw err;
    }
  };

  const handleToggleLogin = async (id: string, canLogin?: boolean) => {
    const target = members.find((m) => m.id === id);
    if (target?.accessLevel === 'OWNER' && canLogin === false) {
      showToast('Workspace Owner login access cannot be disabled.');
      return;
    }
    const nextCanLogin = canLogin !== undefined ? Boolean(canLogin) : !(target?.canLogin ?? true);
    try {
      await membersApi.toggleLogin(id, nextCanLogin);
    } catch (err: any) {
      console.warn('Failed to toggle login on backend, applying locally:', err);
    }
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              canLogin: nextCanLogin,
              status: nextCanLogin ? 'Active' : 'Disabled',
            }
          : m
      )
    );
    showToast(`Login access ${nextCanLogin ? 'enabled' : 'disabled'} for ${target?.name || 'operator'}`);
  };

  const handleRemoveMember = async (id: string) => {
    const target = members.find((m) => m.id === id);
    if (target?.accessLevel === 'OWNER') {
      showToast('Workspace Owner cannot be removed from the workspace.');
      return;
    }
    try {
      await membersApi.delete(id);
    } catch (err) {
      console.warn('Backend unavailable for member delete, removing locally:', err);
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast('Member removed and login credentials revoked');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setFilterPriority(null);
    setFilterStatus(null);
    setFilterAssignee(null);
    setQuickFilter(null);
    setCrmFilterStage(null);
    setCrmFilterOwner(null);
  };

  // Keyboard shortcut listener (⌘K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNewItemModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch data on token change or initial mount
  const loadData = async () => {
    try {
      setSyncStatus('syncing');
      const [
        fetchedTasks,
        fetchedDeals,
        fetchedPipelines,
        fetchedStages,
        fetchedCrmSettings,
        fetchedMembers,
        fetchedContacts,
        fetchedFolders,
        fetchedStatuses,
        fetchedListSettings,
        fetchedWorkspaces,
        fetchedDepartments,
        fetchedRoles,
        fetchedPluginsRes,
        fetchedDocFolders,
        fetchedDocs,
      ] = await Promise.all([
        tasksApi.getAll(),
        dealsApi.getAll(),
        pipelinesApi.getAll(),
        pipelinesApi.getStages(),
        pipelinesApi.getSettings(),
        membersApi.getAll(),
        contactsApi.getAll(),
        workspaceApi.getFolders(),
        workspaceApi.getStatuses(),
        workspaceApi.getListSettings(),
        workspaceApi.getWorkspaces().catch(() => null),
        workspaceApi.getDepartments().catch(() => null),
        rolesApi.getAll().catch(() => null),
        pluginsApi.getPlugins().catch(() => null),
        docsApi.getFolders().catch(() => null),
        docsApi.getAll().catch(() => null),
      ]);

      if (fetchedPluginsRes?.enabledPlugins) {
        setEnabledPlugins(fetchedPluginsRes.enabledPlugins);
        localStorage.setItem('backnode_enabled_plugins', JSON.stringify(fetchedPluginsRes.enabledPlugins));
      }

      if (fetchedDocFolders && Array.isArray(fetchedDocFolders)) {
        setDocFolders(fetchedDocFolders);
      }

      if (fetchedDocs && Array.isArray(fetchedDocs)) {
        setDocs(fetchedDocs);
      }

      if (fetchedRoles && fetchedRoles.length > 0) {
        setRoles(fetchedRoles);
        localStorage.setItem('backnode_roles', JSON.stringify(fetchedRoles));
      }

      if (fetchedWorkspaces && fetchedWorkspaces.length > 0) {
        const cleaned = filterRealWorkspaces(fetchedWorkspaces);
        if (cleaned.length > 0) {
          setUserSpaces(cleaned);
          localStorage.setItem('backnode_user_spaces', JSON.stringify(cleaned));
          setActiveUserSpaceId((curr) => {
            if (!curr || !cleaned.some((s) => s.id === curr)) {
              const nextId = cleaned[0].id;
              localStorage.setItem('backnode_active_user_space_id', nextId);
              return nextId;
            }
            return curr;
          });
        }
      }

      setTasks(fetchedTasks || []);
      setDeals(fetchedDeals || []);
      const sanitizedPipelines = (fetchedPipelines || []).map((p) => ({
        ...p,
        icon: !p.icon || p.icon === 'building' ? 'leaderboard' : p.icon,
        color: !p.color || p.color === '#9900c2' ? '#ea580c' : p.color,
      }));
      setPipelines(sanitizedPipelines);
      if (sanitizedPipelines.length > 0) {
        setActivePipelineId((curr) => {
          if (!curr || !sanitizedPipelines.some((p) => p.id === curr)) {
            return sanitizedPipelines[0].id;
          }
          return curr;
        });
      }
      if (fetchedStages && fetchedStages.length > 0) setCrmStages(fetchedStages);
      if (fetchedCrmSettings) {
        setCrmSettings({
          ...fetchedCrmSettings,
          icon: !fetchedCrmSettings.icon || fetchedCrmSettings.icon === 'building' ? 'leaderboard' : fetchedCrmSettings.icon,
          accentColor: !fetchedCrmSettings.accentColor || fetchedCrmSettings.accentColor === '#9900c2' ? '#ea580c' : fetchedCrmSettings.accentColor,
        });
      }
      if (fetchedMembers && fetchedMembers.length > 0) {
        setMembers(fetchedMembers);
      } else if (user) {
        setMembers([
          {
            id: `tm-${user.accountId || user.account?.id || 'owner'}`,
            name: user.name || 'Workspace Owner',
            initials: (user.name || 'OW').slice(0, 2).toUpperCase(),
            email: user.email,
            role: user.role === 'OWNER' ? 'Workspace Owner' : user.role || 'Member',
            department: 'Executive',
            accessLevel: (user.role as any) === 'OWNER' ? 'OWNER' : 'ADMIN',
            activeTasks: 0,
            capacityStatus: 'Available',
            canLogin: true,
            status: 'Active',
            createdDate: new Date().toISOString(),
          } as unknown as TeamMember,
        ]);
      } else {
        setMembers(initialTeamMembers);
      }
      setDirectoryContacts(fetchedContacts || []);
      setFolders(fetchedFolders || []);
      if (fetchedFolders && fetchedFolders.length > 0) {
        setActiveSpace((curr) => {
          const allItems = fetchedFolders.flatMap((f) => getAllItemsFromFolder(f));
          if (!curr || !allItems.some((i) => i.id === curr)) {
            return allItems[0]?.id || fetchedFolders[0].id;
          }
          return curr;
        });
      }
      if (fetchedStatuses && fetchedStatuses.length > 0) setStatuses(deduplicateStatuses(fetchedStatuses));
      if (fetchedListSettings) setListSettings(fetchedListSettings);
      if (fetchedDepartments && fetchedDepartments.length > 0) {
        setDepartments(fetchedDepartments);
        try {
          localStorage.setItem(`backnode_departments_${activeUserSpaceId}`, JSON.stringify(fetchedDepartments));
          localStorage.setItem('backnode_departments', JSON.stringify(fetchedDepartments));
        } catch {}
      }
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Backend not reachable or error fetching data, using initial cache:', err);
      if (user) {
        setMembers((prev) =>
          prev && prev.length > 0
            ? prev
            : [
                {
                  id: `tm-${user.accountId || user.account?.id || 'owner'}`,
                  name: user.name || 'Workspace Owner',
                  initials: (user.name || 'OW').slice(0, 2).toUpperCase(),
                  email: user.email,
                  role: user.role === 'OWNER' ? 'Workspace Owner' : user.role || 'Member',
                  department: 'Executive',
                  accessLevel: (user.role as any) === 'OWNER' ? 'OWNER' : 'ADMIN',
                  activeTasks: 0,
                  capacityStatus: 'Available',
                  canLogin: true,
                  status: 'Active',
                  createdDate: new Date().toISOString(),
                } as unknown as TeamMember,
              ]
        );
      } else {
        setMembers((prev) => (prev && prev.length > 0 ? prev : initialTeamMembers));
      }
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    if (!token) {
      setTasks([]);
      setDeals([]);
      setPipelines([]);
      setDirectoryContacts([]);
      setFolders([]);
      setMembers([]);
      return;
    }
    loadData();
  }, [token, activeUserSpaceId]);

  // Filter tasks based on search, priority, status, assignee, and quickFilter
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = filterPriority === null || t.priority === filterPriority;
    const matchesStatus = filterStatus === null || t.status === filterStatus;
    const matchesAssignee = filterAssignee === null || (t.assignee?.name && t.assignee.name === filterAssignee);

    let matchesQuick = true;
    if (quickFilter === 'my-tasks') {
      matchesQuick = Boolean(user && t.assignee?.name?.toLowerCase() === user.name?.toLowerCase());
    } else if (quickFilter === 'due-soon') {
      matchesQuick = Boolean(t.dueDate && (t.dueDate.includes('Oct') || t.dueDate.includes('Today')));
    } else if (quickFilter === 'urgent') {
      matchesQuick = t.priority === 'Urgent';
    } else if (quickFilter === 'in-progress') {
      matchesQuick = t.status === 'In Progress';
    } else if (quickFilter === 'needs-review') {
      matchesQuick = t.status === 'In Review';
    }

    // ABAC / RBAC tasks.view scope enforcement
    if (user?.role !== 'OWNER' && effectivePermissions?.tasks) {
      const viewScope = effectivePermissions.tasks.view;
      if (viewScope === 'none') return false;
      if (viewScope === 'assigned') {
        const isAssigned =
          (t.assigneeId && t.assigneeId === user?.id) ||
          (t.assignee?.name && user?.name && t.assignee.name.toLowerCase() === user.name.toLowerCase()) ||
          t.creatorId === user?.id;
        if (!isAssigned) return false;
      }
    }

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesQuick;
  });

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // ABAC / RBAC deals.view scope enforcement
      if (user?.role !== 'OWNER' && effectivePermissions?.deals) {
        const viewScope = effectivePermissions.deals.view;
        if (viewScope === 'none') return false;
        if (viewScope === 'assigned') {
          const userName = (user?.name || '').toLowerCase();
          const userEmail = (user?.email || '').toLowerCase();
          const userId = user?.id;
          const isAssigned =
            (deal.ownerId && deal.ownerId === userId) ||
            (deal.owner && deal.owner.toLowerCase() === userName) ||
            (deal.contact?.email && deal.contact.email.toLowerCase() === userEmail);
          if (!isAssigned) return false;
        }
      }
      return true;
    });
  }, [deals, user, effectivePermissions]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const selectedDeal = deals.find((d) => d.id === selectedDealId) || null;
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  const handleSelectSpace = (space: string) => {
    setActiveSpace(space);
    setCurrentHub('task-spaces');
    setCurrentView('board');
  };

  const handleSelectView = (view: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs') => {
    setCurrentView(view);
    setSelectedTaskId(null);
  };

  const handleOpenCreateTask = (status: TaskStatus = 'Backlog') => {
    setTaskToEdit(null);
    setDealToEdit(null);
    setNewItemType('task');
    setNewItemDefaultStatus(status);
    setIsNewItemModalOpen(true);
  };

  const handleOpenCreateDeal = (stage: CrmDeal['stage'] = 'Proposal Submitted') => {
    setTaskToEdit(null);
    setDealToEdit(null);
    setNewItemType('deal');
    setNewItemDefaultDealStage(stage);
    setIsNewItemModalOpen(true);
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setTaskToEdit(task);
    setDealToEdit(null);
    setNewItemType('task');
    setIsNewItemModalOpen(true);
  };

  const handleOpenEditDeal = (deal: CrmDeal) => {
    setDealToEdit(deal);
    setTaskToEdit(null);
    setNewItemType('deal');
    setIsNewItemModalOpen(true);
  };

  const handleOpenAddTaskToColumn = (status: TaskStatus) => {
    handleOpenCreateTask(status);
  };

  const handleOpenAddDealToStage = (stage: CrmDeal['stage'] = 'Proposal Submitted') => {
    handleOpenCreateDeal(stage);
  };

  const handleOpenAddListToFolder = (folder?: SpaceFolder, subFolderId?: string) => {
    setTargetFolderForNewList(folder || folders[0] || null);
    setTargetSubFolderIdForNewList(subFolderId || null);
    setIsNewListModalOpen(true);
  };

  const handleOpenAddSubFolder = (folder?: SpaceFolder, parentSubFolderId?: string) => {
    setTargetFolderForNewSubFolder(folder || folders[0] || null);
    setTargetParentSubFolderIdForNewSubFolder(parentSubFolderId || null);
    setIsNewSubFolderModalOpen(true);
  };

  const handleOpenAddPipelineSubFolder = (pipeline?: CrmPipeline, parentSubFolderId?: string) => {
    setTargetPipelineForNewSubFolder(pipeline || pipelines[0] || null);
    setTargetParentPipelineSubFolderId(parentSubFolderId || null);
    setIsNewPipelineSubFolderModalOpen(true);
  };

  const handleAddListToFolder = (
    folderId: string,
    listName: string,
    status: string = 'Active',
    subFolderId?: string,
  ) => {
    const trimmed = listName.trim();
    if (!trimmed) return;
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;

    const newList: FolderChildItem = {
      id: `list-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: trimmed,
      taskCount: 0,
      status: status,
      active: true,
      icon: 'format_list_bulleted',
      color: target.color || '#ea580c',
    };

    let updatedTarget: SpaceFolder;
    if (subFolderId) {
      const { updated, added } = addListToSubFolderRecursively(target.subFolders, subFolderId, newList);
      if (added) {
        updatedTarget = {
          ...target,
          subFolders: updated,
        };
      } else {
        updatedTarget = {
          ...target,
          items: [...(target.items || []), newList],
        };
      }
    } else {
      updatedTarget = {
        ...target,
        items: [...(target.items || []), newList],
      };
    }

    const updatedFolders = folders.map((f) => (f.id === folderId ? updatedTarget : f));
    setFolders(updatedFolders);

    workspaceApi.updateFolder(folderId, updatedTarget).catch((err) => {
      console.error('Failed to add list to folder in DB:', err);
    });

    setActiveSpace(newList.id);
    setCurrentHub('task-spaces');
    setCurrentView('board');
    showToast(`List "${trimmed}" added to ${target.name}`);
    setIsNewListModalOpen(false);
    setTargetFolderForNewList(null);
    setTargetSubFolderIdForNewList(null);
  };

  const handleCreateTask = (newTask: Partial<TaskItem>) => {
    if (user?.role !== 'OWNER' && effectivePermissions?.tasks) {
      if (effectivePermissions.tasks.create === false) {
        showToast('Permission denied: You do not have permission to create tasks.');
        return;
      }
    }

    const allAvailableLists = folders.flatMap((f) => getAllItemsFromFolder(f));
    const effectiveListId = newTask.listId || newTask.targetCycle || activeSpace;
    const matchedList = allAvailableLists.find(
      (l) => l.id === effectiveListId || l.name.toLowerCase() === (effectiveListId || '').toLowerCase()
    );

    if (!matchedList && allAvailableLists.length === 0) {
      showToast('Error: No task lists exist. Please create a task list first.');
      return;
    }

    const finalTargetCycle = matchedList ? matchedList.id : (effectiveListId || 'sprint-14');

    const defaultAssignee: TeamMember = members[0] || {
      id: `tm-${user?.id || 'owner'}`,
      name: user?.name || 'Operator',
      initials: user?.name?.slice(0, 2).toUpperCase() || 'OP',
      role: 'Workspace Owner',
      department: 'Engineering',
      activeTasks: 1,
      capacityStatus: 'Available',
      avatarBg: '#27272a',
      avatarColor: '#ffffff',
    };
    const created: TaskItem = {
      title: 'Untitled Deliverable',
      description: '',
      specMarkdown: '',
      status: 'Backlog',
      priority: 'Normal',
      assignee: defaultAssignee,
      tags: ['Deliverable'],
      subtasks: [],
      estimation: '3 pts',
      targetCycle: finalTargetCycle,
      listId: finalTargetCycle,
      dueDate: '',
      startDate: '',
      gitBranch: '',
      replicationHash: '0x' + Math.random().toString(16).substring(2, 8),
      ...newTask,
      id: newTask.id || `BK-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      completedAt: newTask.status === 'Done' ? new Date().toISOString() : undefined,
    } as TaskItem;
    setTasks((prev) => [created, ...prev]);
    tasksApi.create(created).catch((err) => {
      console.error('Failed to create task in DB:', err);
    });
    showToast(`Task ${created.id} created successfully`);
  };

  const checkIsClosedStatus = (statusName: string): boolean => {
    const sName = statusName.toLowerCase();
    if (sName === 'done') return true;
    const def = statuses.find((s) => s.name.toLowerCase() === sName);
    return !!def?.isClosed || def?.stageMapping?.toLowerCase() === 'done';
  };

  const processRecurrenceOnCompletion = (
    currentTask: TaskItem,
    targetStatus: TaskStatus
  ): boolean => {
    if (!currentTask.isRecurring || !currentTask.recurrenceRule) return false;

    const wasClosed = checkIsClosedStatus(currentTask.status);
    const isNowClosed = checkIsClosedStatus(targetStatus);

    // Only trigger when moving from open status to closed status
    if (!isNowClosed || wasClosed) return false;

    const config = parseRecurrenceConfig(currentTask.recurrenceRule);
    const nextDueDate = calculateNextDueDate(currentTask.dueDate, config);
    const targetStatusName = (config.targetStatus || 'Backlog') as TaskStatus;

    if (config.action === 'reset_existing') {
      const resetTask: TaskItem = {
        ...currentTask,
        status: targetStatusName,
        dueDate: nextDueDate,
        subtasks: currentTask.subtasks?.map((st) => ({ ...st, done: false })) || [],
      };
      setTasks((prev) => prev.map((t) => (t.id === currentTask.id ? resetTask : t)));
      tasksApi.update(currentTask.id, resetTask).catch((err) => {
        console.error('Failed to reset recurring task in DB:', err);
      });
      showToast(`Recurring task moved back to ${targetStatusName} (Due: ${nextDueDate})`);
      return true;
    } else {
      setTimeout(() => {
        const nextCycleTask: Partial<TaskItem> = {
          title: currentTask.title,
          description: currentTask.description,
          specMarkdown: currentTask.specMarkdown,
          status: targetStatusName,
          priority: currentTask.priority,
          assignee: currentTask.assignee,
          tags: currentTask.tags ? [...currentTask.tags] : ['Deliverable'],
          subtasks: currentTask.subtasks?.map((st) => ({ ...st, done: false })) || [],
          estimation: currentTask.estimation,
          targetCycle: currentTask.targetCycle,
          dueDate: nextDueDate,
          isRecurring: true,
          recurrenceRule: currentTask.recurrenceRule,
          customLinks: currentTask.customLinks ? { ...currentTask.customLinks } : {},
          linkedCrmDeal: currentTask.linkedCrmDeal,
        };
        handleCreateTask(nextCycleTask);
        showToast(`Next cycle task scheduled in ${targetStatusName} (Due: ${nextDueDate})`);
      }, 300);
      return false;
    }
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    if (user?.role !== 'OWNER' && effectivePermissions?.tasks) {
      const updateScope = effectivePermissions.tasks.update;
      if (updateScope === 'none') {
        showToast('Permission denied: You do not have permission to update tasks.');
        return;
      }
      if (updateScope === 'assigned') {
        const userName = (user?.name || '').toLowerCase();
        const isAssigned =
          updatedTask.assigneeId === user?.id ||
          (updatedTask.assignee?.name && updatedTask.assignee.name.toLowerCase() === userName) ||
          updatedTask.creatorId === user?.id;
        if (!isAssigned) {
          showToast('Permission denied: You can only update tasks assigned to you.');
          return;
        }
      }
    }

    const existing = tasks.find((t) => t.id === updatedTask.id);
    if (existing) {
      const wasReset = processRecurrenceOnCompletion(existing, updatedTask.status);
      if (wasReset) {
        return;
      }
    }

    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    tasksApi.update(updatedTask.id, updatedTask).catch((err) => {
      console.error('Failed to update task in DB:', err);
    });
    showToast(`Task ${updatedTask.id} updated`);
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDeleteItem = tasks.find((t) => t.id === taskId);
    if (user?.role !== 'OWNER' && effectivePermissions?.tasks) {
      const deleteScope = effectivePermissions.tasks.delete;
      if (deleteScope === 'none') {
        showToast('Permission denied: You do not have permission to delete tasks.');
        return;
      }
      if (deleteScope === 'assigned' && taskToDeleteItem) {
        const userName = (user?.name || '').toLowerCase();
        const isAssigned =
          taskToDeleteItem.assigneeId === user?.id ||
          (taskToDeleteItem.assignee?.name && taskToDeleteItem.assignee.name.toLowerCase() === userName) ||
          taskToDeleteItem.creatorId === user?.id;
        if (!isAssigned) {
          showToast('Permission denied: You can only delete tasks assigned to you.');
          return;
        }
      }
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    tasksApi.delete(taskId).catch((err) => {
      console.error('Failed to delete task in DB:', err);
    });
    showToast(`Task ${taskId} archived`);
  };

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) {
      handleDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const handleUpdateDeal = (updatedDeal: CrmDeal) => {
    if (user?.role !== 'OWNER' && effectivePermissions?.deals) {
      const updateScope = effectivePermissions.deals.update;
      if (updateScope === 'none') {
        showToast('Permission denied: You do not have permission to update deals.');
        return;
      }
      if (updateScope === 'assigned') {
        const userName = (user?.name || '').toLowerCase();
        const userEmail = (user?.email || '').toLowerCase();
        const isOwner =
          updatedDeal.ownerId === user?.id ||
          (updatedDeal.owner && updatedDeal.owner.toLowerCase() === userName) ||
          (updatedDeal.contact?.email && updatedDeal.contact.email.toLowerCase() === userEmail);
        if (!isOwner) {
          showToast('Permission denied: You can only update deals assigned to you.');
          return;
        }
      }
    }
    setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)));
    dealsApi.update(updatedDeal.id, updatedDeal).catch((err) => {
      console.error('Failed to update deal in DB:', err);
    });
    showToast(`Deal ${updatedDeal.title} updated`);
  };

  const handleCreateDeal = (newDeal: Partial<CrmDeal>) => {
    if (user?.role !== 'OWNER' && effectivePermissions?.deals) {
      if (effectivePermissions.deals.create === false) {
        showToast('Permission denied: You do not have permission to create CRM deals.');
        return;
      }
    }
    const ownerName = user?.name || members[0]?.name || 'Operator';
    const ownerInitials = ownerName.slice(0, 2).toUpperCase();
    const created: CrmDeal = {
      title: 'New Commercial Opportunity',
      company: 'Enterprise Partner',
      value: 50000,
      formattedValue: '$50,000',
      stage: 'Proposal Submitted',
      probability: 50,
      targetCloseDate: 'Q4 2026',
      contact: {
        name: ownerName,
        title: 'Decision Maker',
        email: user?.email || 'lead@example.com',
        phone: '+1 (555) 000-0000',
        location: 'Remote',
        role: 'Buyer',
        initials: ownerInitials,
      },
      owner: ownerName,
      ownerInitials,
      tags: ['Enterprise'],
      linkedTasks: [],
      history: [
        {
          id: `hist-${Date.now()}`,
          type: 'note',
          title: 'Opportunity initialized',
          date: 'Just now',
        },
      ],
      ...newDeal,
      id: newDeal.id || `deal-${Date.now().toString().slice(-4)}`,
      pipelineId: newDeal.pipelineId || activePipelineId,
    } as CrmDeal;
    setDeals((prev) => [created, ...prev]);
    dealsApi.create(created).catch((err) => {
      console.error('Failed to create deal in DB:', err);
    });
    showToast(`Deal "${created.title}" launched`);
  };

  const handleDeleteDeal = (dealId: string) => {
    const targetDeal = deals.find((d) => d.id === dealId);
    if (!targetDeal) return;
    if (user?.role !== 'OWNER' && effectivePermissions?.deals) {
      const deleteScope = effectivePermissions.deals.delete;
      if (deleteScope === 'none') {
        showToast('Permission denied: You do not have permission to delete deals.');
        return;
      }
      if (deleteScope === 'assigned') {
        const userName = (user?.name || '').toLowerCase();
        const userEmail = (user?.email || '').toLowerCase();
        const isOwner =
          targetDeal.ownerId === user?.id ||
          (targetDeal.owner && targetDeal.owner.toLowerCase() === userName) ||
          (targetDeal.contact?.email && targetDeal.contact.email.toLowerCase() === userEmail);
        if (!isOwner) {
          showToast('Permission denied: You can only delete deals assigned to you.');
          return;
        }
      }
    }
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    if (selectedDealId === dealId) {
      setSelectedDealId(null);
    }
    dealsApi.delete(dealId).catch((err) => {
      console.error('Failed to delete deal in DB:', err);
    });
    showToast(`Deal "${targetDeal.title}" deleted`);
  };

  const handleAdvanceDealStage = (dealId: string, newStage: CrmDeal['stage']) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    if (user?.role !== 'OWNER' && effectivePermissions?.deals) {
      const changeStageScope = effectivePermissions.deals.change_stage;
      if (changeStageScope === 'none') {
        showToast('Permission denied: You do not have permission to advance deal stages.');
        return;
      }
      if (changeStageScope === 'assigned') {
        const userName = (user?.name || '').toLowerCase();
        const userEmail = (user?.email || '').toLowerCase();
        const isOwner =
          deal.ownerId === user?.id ||
          (deal.owner && deal.owner.toLowerCase() === userName) ||
          (deal.contact?.email && deal.contact.email.toLowerCase() === userEmail);
        if (!isOwner) {
          showToast('Permission denied: You can only advance stages for deals assigned to you.');
          return;
        }
      }
    }
    const updatedDeal: CrmDeal = {
      ...deal,
      stage: newStage,
      history: [
        {
          id: `h-${Date.now()}`,
          type: 'note',
          title: `Pipeline advanced: ${newStage}`,
          date: 'Just now',
        },
        ...deal.history,
      ],
    };
    handleUpdateDeal(updatedDeal);
  };

  const handleMoveTaskStatus = (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (user?.role !== 'OWNER' && effectivePermissions?.tasks) {
      const changeStatusScope = effectivePermissions.tasks.change_status;
      if (changeStatusScope === 'none') {
        showToast('Permission denied: You do not have permission to move or change task statuses.');
        return;
      }
      if (changeStatusScope === 'assigned' && task) {
        const userName = (user?.name || '').toLowerCase();
        const isAssigned =
          task.assigneeId === user?.id ||
          (task.assignee?.name && task.assignee.name.toLowerCase() === userName) ||
          task.creatorId === user?.id;
        if (!isAssigned) {
          showToast('Permission denied: You can only move tasks assigned to you.');
          return;
        }
      }
    }

    if (task) {
      const wasReset = processRecurrenceOnCompletion(task, newStatus);
      if (wasReset) {
        return;
      }
    }

    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;

      const updatedTask = { ...task, status: newStatus };
      const withoutTask = prev.filter((t) => t.id !== taskId);

      if (targetTaskId) {
        const destIndex = withoutTask.findIndex((t) => t.id === targetTaskId);
        if (destIndex !== -1) {
          const insertAt = position === 'after' ? destIndex + 1 : destIndex;
          const copy = [...withoutTask];
          copy.splice(insertAt, 0, updatedTask);
          return copy;
        }
      }

      if (typeof targetIndex === 'number' && targetIndex >= 0) {
        const sameStatusTasks = withoutTask.filter((t) => t.status === newStatus);
        const otherTasks = withoutTask.filter((t) => t.status !== newStatus);
        sameStatusTasks.splice(targetIndex, 0, updatedTask);
        return [...otherTasks, ...sameStatusTasks];
      }

      return [...withoutTask, updatedTask];
    });

    tasksApi.update(taskId, { status: newStatus }).catch((err) => {
      console.error('Failed to move task status in DB:', err);
    });
    showToast(`Task moved to ${newStatus}`);
  };

  const handleUpdateListSettings = (newSettings: Partial<ListSettings>) => {
    setListSettings((prev) => ({ ...prev, ...newSettings }));

    // Also propagate icon, color, and name to matching list items in space folders
    if (newSettings.icon || newSettings.name || newSettings.color) {
      setFolders((prevFolders) => {
        let changed = false;
        const targetListId = newSettings.listId || listSettings.listId;
        const updatedFolders = prevFolders.map((folder) => {
          let folderChanged = false;
          const updatedItems = folder.items.map((item) => {
            if (
              (targetListId && item.id === targetListId) ||
              (listSettings.listId && item.id === listSettings.listId) ||
              (activeSpace && item.id === activeSpace && (!newSettings.listId || newSettings.listId === item.id))
            ) {
              folderChanged = true;
              return {
                ...item,
                name: newSettings.name || item.name,
                icon: newSettings.icon || (item as any).icon,
                color: newSettings.color || (item as any).color,
              };
            }
            return item;
          });

          // Check and update subfolders recursively
          const subRes = updateListItemInSubFoldersRecursively(folder.subFolders, targetListId, {
            name: newSettings.name,
            icon: newSettings.icon,
            color: newSettings.color,
          });
          if (subRes.found) {
            folderChanged = true;
          }

          if (folderChanged) {
            changed = true;
            const updatedFolder = {
              ...folder,
              items: updatedItems,
              subFolders: subRes.found ? subRes.updated : folder.subFolders,
            };
            workspaceApi.updateFolder(updatedFolder.id, updatedFolder).catch(console.error);
            return updatedFolder;
          }
          return folder;
        });
        return changed ? updatedFolders : prevFolders;
      });
    }

    workspaceApi.updateListSettings(newSettings).catch((err) => {
      console.error('Failed to update list settings in DB:', err);
    });
    showToast('Task space settings updated');
  };

  const handleUpdateStatuses = (newStatuses: StatusDefinition[]) => {
    const deduped = deduplicateStatuses(newStatuses);
    setStatuses(deduped);
    workspaceApi.updateStatuses(deduped).catch((err) => {
      console.error('Failed to update statuses in DB:', err);
    });
    showToast('Pipeline statuses updated');
  };

  const handleRenameStatus = (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;
    setTasks((prev) =>
      prev.map((t) => (t.status === oldName ? { ...t, status: newName as TaskStatus } : t))
    );
    tasksApi
      .getAll()
      .then((allTasks) => {
        const toUpdate = allTasks.filter((t) => t.status === oldName);
        toUpdate.forEach((t) => {
          tasksApi.update(t.id, { status: newName as TaskStatus }).catch(console.error);
        });
      })
      .catch(console.error);
  };

  const handleUpdateCrmSettings = (newSettings: Partial<CrmPipelineSettingsType>) => {
    setCrmSettings((prev) => ({ ...prev, ...newSettings }));

    // Also propagate icon, color, and name to active or target CRM pipeline
    if (newSettings.icon || newSettings.accentColor || newSettings.name) {
      setPipelines((prevPipelines) => {
        const targetId = activePipelineId || prevPipelines[0]?.id;
        return prevPipelines.map((pipe) => {
          if (pipe.id === targetId) {
            const updatedPipe = {
              ...pipe,
              name: newSettings.name || pipe.name,
              icon: newSettings.icon || pipe.icon,
              color: newSettings.accentColor || pipe.color,
            };
            pipelinesApi.update(pipe.id, {
              name: updatedPipe.name,
              icon: updatedPipe.icon,
              color: updatedPipe.color,
            }).catch((err) => console.error('Failed to update pipeline icon in DB:', err));
            return updatedPipe;
          }
          return pipe;
        });
      });
    }

    pipelinesApi.updateSettings(newSettings).catch((err) => {
      console.error('Failed to update CRM settings in DB:', err);
    });
    showToast('CRM pipeline settings updated');
  };

  const handleUpdateCrmStages = (newStages: CrmStageDefinition[]) => {
    setCrmStages(newStages);
    pipelinesApi.updateStages(newStages).catch((err) => {
      console.error('Failed to update CRM stages in DB:', err);
    });
    showToast('CRM stages updated');
  };

  const handleCreateFolder = (newFolder: SpaceFolder) => {
    setFolders((prev) => [...prev, newFolder]);
    workspaceApi.createFolder(newFolder).catch((err) => {
      console.error('Failed to create folder in DB:', err);
    });
    showToast(`Folder "${newFolder.name}" created`);
    setIsNewFolderModalOpen(false);
  };

  const handleUpdateFolder = (updatedFolder: SpaceFolder) => {
    setFolders((prev) => prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)));
    workspaceApi.updateFolder(updatedFolder.id, updatedFolder).catch((err) => {
      console.error('Failed to update folder in DB:', err);
    });
    showToast(`Folder "${updatedFolder.name}" updated`);
    setFolderToEdit(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    const deletedFolder = folders.find((f) => f.id === folderId);
    const remaining = folders.filter((f) => f.id !== folderId);
    setFolders(remaining);
    const deletedItems = deletedFolder ? getAllItemsFromFolder(deletedFolder) : [];
    const deletedListIds = new Set(deletedItems.map((i) => i.id));
    const deletedListNames = new Set(deletedItems.map((i) => (i.name || '').toLowerCase()));

    // Cascade delete tasks belonging to deleted folder's child lists from state
    setTasks((prev) =>
      prev.filter((t) => {
        if (t.listId && deletedListIds.has(t.listId)) return false;
        if (t.targetCycle && deletedListIds.has(t.targetCycle)) return false;
        if (t.targetCycle && deletedListNames.has(t.targetCycle.toLowerCase())) return false;
        return true;
      })
    );

    // Cascade delete docs belonging to deleted folder or its child lists from state
    setDocs((prev) =>
      prev.filter((d) => d.folderId !== folderId && (!d.listId || !deletedListIds.has(d.listId)))
    );

    const isContained = deletedItems.some((i) => i.id === activeSpace);
    if (isContained) {
      const remainingItems = remaining.flatMap((f) => getAllItemsFromFolder(f));
      const nextSpace = remainingItems[0]?.id || 'sprint-14';
      setActiveSpace(nextSpace);
    }
    workspaceApi.deleteFolder(folderId).catch((err) => {
      console.error('Failed to delete folder in DB:', err);
    });
    showToast('Folder and all child items deleted');
  };

  const handleDeleteTaskSpace = async (listId: string): Promise<void> => {
    let deletedItemName = '';
    let targetFolderId: string | null = null;
    let updatedTargetFolder: SpaceFolder | null = null;

    const newFolders = folders.map((f) => {
      let folderChanged = false;
      let newItems = f.items;
      if (newItems && newItems.some((item) => item.id === listId)) {
        const found = newItems.find((item) => item.id === listId);
        if (found) deletedItemName = found.name;
        newItems = newItems.filter((item) => item.id !== listId);
        folderChanged = true;
      }
      let newSubFolders = f.subFolders;
      if (newSubFolders && newSubFolders.length > 0) {
        const res = deleteListItemFromSubFoldersRecursively(newSubFolders, listId);
        if (res.deleted) {
          deletedItemName = res.deleted.name;
          newSubFolders = res.updated;
          folderChanged = true;
        }
      }
      if (folderChanged) {
        const updated: SpaceFolder = {
          ...f,
          items: newItems,
          subFolders: newSubFolders,
        };
        targetFolderId = f.id;
        updatedTargetFolder = updated;
        return updated;
      }
      return f;
    });

    setFolders(newFolders);
    if (targetFolderId && updatedTargetFolder) {
      workspaceApi.updateFolder(targetFolderId, updatedTargetFolder).catch((err) => {
        console.error('Failed to delete list from folder in DB:', err);
      });
    }

    // Call backend cascade delete API
    workspaceApi.deleteList(listId).catch((err) => {
      console.error('Failed to delete list from DB:', err);
    });

    // Cascade filter out tasks mapped to this list from state
    const lowerListId = listId.toLowerCase();
    const lowerItemName = deletedItemName ? deletedItemName.toLowerCase() : '';
    setTasks((prev) =>
      prev.filter(
        (t) =>
          t.listId !== listId &&
          t.targetCycle !== listId &&
          !t.targetCycle.toLowerCase().includes(lowerListId) &&
          (!lowerItemName || !t.targetCycle.toLowerCase().includes(lowerItemName))
      )
    );

    // Cascade filter out docs mapped to this list from state
    setDocs((prev) => prev.filter((d) => d.listId !== listId));

    // If activeSpace is this list, find next available space
    if (activeSpace === listId) {
      const allRemainingItems = newFolders.flatMap((f) => getAllItemsFromFolder(f));
      const nextSpace = allRemainingItems[0]?.id || 'sprint-14';
      setActiveSpace(nextSpace);
    }

    showToast(`Task space "${deletedItemName || listId}" and all child items deleted`);
  };

  const handleMoveListToFolder = async (
    listId: string,
    targetFolderId: string,
    targetSubFolderId?: string
  ): Promise<boolean> => {
    const res = moveListToFolder(folders, listId, targetFolderId, targetSubFolderId);
    if (!res.success) {
      showToast('Failed to move list to destination folder');
      return false;
    }
    setFolders(res.updatedFolders);
    for (const f of res.updatedFolders) {
      workspaceApi.updateFolder(f.id, f).catch((err) => {
        console.error(`Failed to update folder ${f.id} after move:`, err);
      });
    }
    showToast(`List "${res.movedItem?.name || listId}" moved to "${res.targetName || targetFolderId}"`);
    return true;
  };

  const handleCreateSubFolder = (folderId: string, newSubFolder: SpaceSubFolder) => {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;

    let updatedTarget: SpaceFolder;
    if (newSubFolder.parentId === folderId) {
      updatedTarget = {
        ...target,
        subFolders: [...(target.subFolders || []), newSubFolder],
      };
    } else {
      const { updated, added } = addSubFolderRecursively(target.subFolders, newSubFolder.parentId, newSubFolder);
      if (added) {
        updatedTarget = {
          ...target,
          subFolders: updated,
        };
      } else {
        updatedTarget = {
          ...target,
          subFolders: [...(target.subFolders || []), newSubFolder],
        };
      }
    }

    const updatedFolders = folders.map((f) => (f.id === folderId ? updatedTarget : f));
    setFolders(updatedFolders);
    workspaceApi.updateFolder(folderId, updatedTarget).catch((err) => {
      console.error('Failed to create sub-folder in DB:', err);
    });
    showToast(`Sub-folder "${newSubFolder.name}" created`);
    setIsNewSubFolderModalOpen(false);
    setTargetFolderForNewSubFolder(null);
    setTargetParentSubFolderIdForNewSubFolder(null);
  };

  const handleUpdateSubFolder = (folderId: string, updatedSubFolder: SpaceSubFolder) => {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;

    const updatedSubFolders = updateSubFolderRecursively(target.subFolders, updatedSubFolder);
    const updatedTarget: SpaceFolder = {
      ...target,
      subFolders: updatedSubFolders,
    };
    const updatedFolders = folders.map((f) => (f.id === folderId ? updatedTarget : f));
    setFolders(updatedFolders);
    workspaceApi.updateFolder(folderId, updatedTarget).catch((err) => {
      console.error('Failed to update sub-folder in DB:', err);
    });
    showToast(`Sub-folder "${updatedSubFolder.name}" updated`);
    setSubFolderToEdit(null);
  };

  const handleDeleteSubFolder = (folderId: string, subFolderId: string) => {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;

    const { updated, deleted } = deleteSubFolderRecursively(target.subFolders, subFolderId);
    const updatedTarget: SpaceFolder = {
      ...target,
      subFolders: updated,
    };
    const updatedFolders = folders.map((f) => (f.id === folderId ? updatedTarget : f));
    setFolders(updatedFolders);

    if (deleted) {
      const deletedItems = getAllItemsFromSubFolder(deleted);
      if (deletedItems.some((i) => i.id === activeSpace)) {
        const remainingItems = updatedFolders.flatMap((f) => getAllItemsFromFolder(f));
        const nextSpace = remainingItems[0]?.id || 'sprint-14';
        setActiveSpace(nextSpace);
      }
    }

    workspaceApi.updateFolder(folderId, updatedTarget).catch((err) => {
      console.error('Failed to delete sub-folder in DB:', err);
    });
    showToast('Sub-folder deleted');
  };

  const handleCreatePipeline = (newPipeline: CrmPipeline) => {
    const cleaned = {
      ...newPipeline,
      icon: !newPipeline.icon || newPipeline.icon === 'building' ? 'leaderboard' : newPipeline.icon,
      color: !newPipeline.color || newPipeline.color === '#9900c2' ? '#ea580c' : newPipeline.color,
    };
    setPipelines((prev) => [...prev, cleaned]);
    setActivePipelineId(cleaned.id);
    pipelinesApi.create(cleaned).catch((err) => {
      console.error('Failed to create pipeline in DB:', err);
    });
    showToast(`Pipeline "${cleaned.name}" initialized`);
    setIsNewPipelineModalOpen(false);
  };

  const handleUpdatePipeline = (updatedPipeline: CrmPipeline) => {
    const cleaned = {
      ...updatedPipeline,
      icon: !updatedPipeline.icon || updatedPipeline.icon === 'building' ? 'leaderboard' : updatedPipeline.icon,
      color: !updatedPipeline.color || updatedPipeline.color === '#9900c2' ? '#ea580c' : updatedPipeline.color,
    };
    setPipelines((prev) => prev.map((p) => (p.id === cleaned.id ? cleaned : p)));
    pipelinesApi.update(cleaned.id, cleaned).catch((err) => {
      console.error('Failed to update pipeline in DB:', err);
    });
    showToast(`Pipeline "${cleaned.name}" updated`);
    setPipelineToEdit(null);
  };

  const handleDeletePipeline = (pipelineId: string) => {
    const remaining = pipelines.filter((p) => p.id !== pipelineId);
    setPipelines(remaining);
    if (activePipelineId === pipelineId) {
      setActivePipelineId(remaining.length > 0 ? remaining[0].id : '');
    }
    pipelinesApi.delete(pipelineId).catch((err) => {
      console.error('Failed to delete pipeline in DB:', err);
    });
    showToast('Pipeline deleted');
  };

  const handleCreatePipelineSubFolder = (pipelineId: string, newSubFolder: CrmPipelineSubFolder) => {
    const target = pipelines.find((p) => p.id === pipelineId);
    if (!target) return;

    let updatedTarget: CrmPipeline;
    if (!newSubFolder.parentId || newSubFolder.parentId === pipelineId) {
      updatedTarget = {
        ...target,
        subFolders: [...(target.subFolders || []), newSubFolder],
      };
    } else {
      const { updated, added } = addPipelineSubFolderRecursively(target.subFolders, newSubFolder.parentId, newSubFolder);
      if (added) {
        updatedTarget = {
          ...target,
          subFolders: updated,
        };
      } else {
        updatedTarget = {
          ...target,
          subFolders: [...(target.subFolders || []), newSubFolder],
        };
      }
    }

    const updatedPipelines = pipelines.map((p) => (p.id === pipelineId ? updatedTarget : p));
    setPipelines(updatedPipelines);
    pipelinesApi.update(pipelineId, updatedTarget).catch((err) => {
      console.error('Failed to create pipeline sub-folder in DB:', err);
    });
    showToast(`Pipeline sub-folder "${newSubFolder.name}" created`);
    setIsNewPipelineSubFolderModalOpen(false);
    setTargetPipelineForNewSubFolder(null);
    setTargetParentPipelineSubFolderId(null);
  };

  const handleUpdatePipelineSubFolder = (pipelineId: string, updatedSubFolder: CrmPipelineSubFolder) => {
    const target = pipelines.find((p) => p.id === pipelineId);
    if (!target) return;

    const updatedSubFolders = updatePipelineSubFolderRecursively(target.subFolders, updatedSubFolder);
    const updatedTarget: CrmPipeline = {
      ...target,
      subFolders: updatedSubFolders,
    };
    const updatedPipelines = pipelines.map((p) => (p.id === pipelineId ? updatedTarget : p));
    setPipelines(updatedPipelines);
    pipelinesApi.update(pipelineId, updatedTarget).catch((err) => {
      console.error('Failed to update pipeline sub-folder in DB:', err);
    });
    showToast(`Pipeline sub-folder "${updatedSubFolder.name}" updated`);
    setPipelineSubFolderToEdit(null);
  };

  const handleDeletePipelineSubFolder = (pipelineId: string, subFolderId: string) => {
    const target = pipelines.find((p) => p.id === pipelineId);
    if (!target) return;

    const { updated } = deletePipelineSubFolderRecursively(target.subFolders, subFolderId);
    const updatedTarget: CrmPipeline = {
      ...target,
      subFolders: updated,
    };
    const updatedPipelines = pipelines.map((p) => (p.id === pipelineId ? updatedTarget : p));
    setPipelines(updatedPipelines);

    if (activePipelineSubFolderId === subFolderId) {
      setActivePipelineSubFolderId(null);
    }

    pipelinesApi.update(pipelineId, updatedTarget).catch((err) => {
      console.error('Failed to delete pipeline sub-folder in DB:', err);
    });
    showToast('Pipeline sub-folder deleted');
  };

  const handleMovePipelineSubFolder = async (
    subFolderId: string,
    targetPipelineId: string,
    targetParentSubFolderId?: string
  ): Promise<boolean> => {
    const res = movePipelineSubFolder(pipelines, subFolderId, targetPipelineId, targetParentSubFolderId);
    if (!res.success) {
      showToast('Failed to move pipeline sub-folder');
      return false;
    }
    setPipelines(res.updatedPipelines);
    for (const p of res.updatedPipelines) {
      pipelinesApi.update(p.id, p).catch((err) => {
        console.error(`Failed to update pipeline ${p.id} after move:`, err);
      });
    }
    showToast(`Sub-folder "${res.movedSubFolder?.name || subFolderId}" moved to "${res.targetName || targetPipelineId}"`);
    return true;
  };

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete?.item?.id) return;
    if (itemToDelete.type === 'task') {
      handleDeleteTask(itemToDelete.item.id);
    } else if (itemToDelete.type === 'deal') {
      handleDeleteDeal(itemToDelete.item.id);
    } else if (itemToDelete.type === 'folder') {
      handleDeleteFolder(itemToDelete.item.id);
    } else if (itemToDelete.type === 'pipeline') {
      handleDeletePipeline(itemToDelete.item.id);
    } else if (itemToDelete.type === 'subfolder') {
      const rootFolder = folders.find(
        (f) =>
          f.id === itemToDelete.folderId ||
          flattenSubFolders(f.subFolders).some((s) => s.subFolder.id === itemToDelete.item.id)
      );
      if (rootFolder) {
        handleDeleteSubFolder(rootFolder.id, itemToDelete.item.id);
      }
    } else if (itemToDelete.type === 'pipeline-subfolder') {
      const rootPipe = pipelines.find(
        (p) =>
          p.id === itemToDelete.pipelineId ||
          flattenPipelineSubFolders(p.subFolders).some((s) => s.subFolder.id === itemToDelete.item.id)
      );
      if (rootPipe) {
        handleDeletePipelineSubFolder(rootPipe.id, itemToDelete.item.id);
      }
    } else if (itemToDelete.type === 'list') {
      handleDeleteTaskSpace(itemToDelete.item.id);
    } else if (itemToDelete.type === 'doc') {
      handleDeleteDoc(itemToDelete.item.id);
    }
    setItemToDelete(null);
  };

  const handleCreateContact = (newContact: DirectoryContact) => {
    setDirectoryContacts((prev) => [newContact, ...prev]);
    contactsApi.create(newContact).catch((err) => {
      console.error('Failed to create contact in DB:', err);
    });
    showToast(`Contact "${newContact.name}" added to directory`);
    setIsNewContactModalOpen(false);
  };

  const handleUpdateContact = (updatedContact: DirectoryContact) => {
    setDirectoryContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
    );
    contactsApi.update(updatedContact.id, updatedContact).catch((err) => {
      console.error('Failed to update contact in DB:', err);
    });
    showToast(`Contact "${updatedContact.name}" updated`);
  };

  const handleDeleteContact = (contactId: string) => {
    const target = directoryContacts.find((c) => c.id === contactId);
    setDirectoryContacts((prev) => prev.filter((c) => c.id !== contactId));
    contactsApi.delete(contactId).catch((err) => {
      console.error('Failed to delete contact in DB:', err);
    });
    showToast(`Contact "${target?.name || contactId}" removed from directory`);
  };

  const handleCreateDoc = (partialDoc?: Partial<DocItem>): DocItem => {
    const newDoc: DocItem = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: partialDoc?.title || 'Untitled Architecture RFC',
      content:
        partialDoc?.content ||
        '# New Document\n\nStart typing documentation, specifications, architecture notes, or RFCs here...',
      classification: partialDoc?.classification || 'Internal',
      tags: partialDoc?.tags && partialDoc.tags.length > 0 ? partialDoc.tags : ['Specification'],
      authorName: user?.name || 'Current Operator',
      authorInitials: (user?.name || 'CO')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
      authorDepartment: 'Engineering',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folderId: partialDoc?.folderId,
      spaceId: partialDoc?.spaceId || activeSpace,
      ...partialDoc,
    };
    setDocs((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    docsApi.create(newDoc).catch((err) => {
      console.warn('Backend doc creation failed, keeping locally:', err);
    });
    showToast(`Document "${newDoc.title}" created`);
    return newDoc;
  };

  const handleUpdateDoc = (id: string, updates: Partial<DocItem>) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc
      )
    );
    docsApi.update(id, updates).catch((err) => {
      console.warn('Backend doc update failed, applied locally:', err);
    });
  };

  const handleDeleteDoc = (id: string) => {
    const target = docs.find((d) => d.id === id);
    const remaining = docs.filter((d) => d.id !== id);
    setDocs(remaining);
    if (activeDocId === id) {
      setActiveDocId(remaining[0]?.id || '');
    }
    docsApi.delete(id).catch((err) => {
      console.warn('Backend doc deletion failed, removed locally:', err);
    });
    showToast(`Deleted document ${target?.title ? `"${target.title}"` : ''}`);
  };

  const handleDuplicateDoc = (id: string) => {
    const target = docs.find((d) => d.id === id);
    if (!target) return;
    const duplicated: DocItem = {
      ...target,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${target.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => [duplicated, ...prev]);
    setActiveDocId(duplicated.id);
    docsApi.create(duplicated).catch((err) => {
      console.warn('Backend duplicate doc failed, saved locally:', err);
    });
    showToast(`Duplicated "${target.title}"`);
  };

  const handleCreateDocFolder = async (data: Partial<DocFolder>): Promise<DocFolder> => {
    try {
      const created = await docsApi.createFolder(data);
      setDocFolders((prev) => [...prev, created]);
      showToast(`Folder "${created.name}" created`);
      return created;
    } catch (err) {
      const created: DocFolder = {
        id: `folder-${Date.now()}`,
        name: data.name || 'New Folder',
        description: data.description || '',
        icon: data.icon || 'folder',
        color: data.color || '#ea580c',
        parentFolderId: data.parentFolderId || null,
        accountId: activeUserSpaceId,
      };
      setDocFolders((prev) => [...prev, created]);
      showToast(`Folder "${created.name}" created successfully`);
      return created;
    }
  };

  const handleUpdateDocFolder = async (id: string, data: Partial<DocFolder>): Promise<DocFolder> => {
    try {
      const updated = await docsApi.updateFolder(id, data);
      setDocFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)));
      showToast(`Folder "${updated.name}" updated`);
      return updated;
    } catch (err) {
      let updatedFolder: any;
      setDocFolders((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            updatedFolder = { ...f, ...data };
            return updatedFolder;
          }
          return f;
        })
      );
      return updatedFolder;
    }
  };

  const handleDeleteDocFolder = async (id: string): Promise<void> => {
    try {
      await docsApi.deleteFolder(id);
    } catch (err) {
      console.warn('Backend delete folder failed, deleting locally:', err);
    }
    setDocFolders((prev) => prev.filter((f) => f.id !== id && f.parentFolderId !== id));
    showToast('Folder deleted');
  };

  const handleMoveDocToFolder = async (
    docId: string,
    targetFolderId: string | null
  ): Promise<boolean> => {
    try {
      await handleUpdateDoc(docId, { folderId: targetFolderId || undefined });
      const targetFolder = docFolders.find((f) => f.id === targetFolderId);
      showToast(`Document moved to ${targetFolder ? `"${targetFolder.name}"` : 'All Workspace Docs'}`);
      return true;
    } catch (err) {
      showToast('Failed to move document');
      return false;
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const res = await pluginsApi.togglePlugin(pluginId, enabled);
      if (res?.enabledPlugins) {
        setEnabledPlugins(res.enabledPlugins);
        localStorage.setItem('backnode_enabled_plugins', JSON.stringify(res.enabledPlugins));
      } else {
        const next = { ...enabledPlugins, [pluginId]: enabled };
        setEnabledPlugins(next);
        localStorage.setItem('backnode_enabled_plugins', JSON.stringify(next));
      }
      showToast(`Plugin ${pluginId.toUpperCase()} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.warn('Backend plugin toggle failed, updating locally:', err);
      const next = { ...enabledPlugins, [pluginId]: enabled };
      setEnabledPlugins(next);
      localStorage.setItem('backnode_enabled_plugins', JSON.stringify(next));
      showToast(`Plugin ${pluginId.toUpperCase()} ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        tasks,
        setTasks,
        statuses,
        setStatuses,
        listSettings,
        setListSettings,
        members,
        directoryContacts,
        setDirectoryContacts,
        folders,
        setFolders,
        syncStatus,
        pipelines,
        setPipelines,
        activePipelineId,
        setActivePipelineId,
        activePipelineSubFolderId,
        setActivePipelineSubFolderId,
        deals,
        setDeals,
        crmStages,
        setCrmStages,
        crmSettings,
        setCrmSettings,
        currentHub,
        setCurrentHub,
        activeSpace,
        setActiveSpace,
        currentView,
        setCurrentView,
        overviewMode,
        setOverviewMode,
        crmView,
        setCrmView,
        crmSettingsInitialTab,
        setCrmSettingsInitialTab,
        selectedTaskId,
        setSelectedTaskId,
        selectedDealId,
        setSelectedDealId,
        taskToEdit,
        setTaskToEdit,
        dealToEdit,
        setDealToEdit,
        taskToDelete,
        setTaskToDelete,
        folderToEdit,
        setFolderToEdit,
        subFolderToEdit,
        setSubFolderToEdit,
        pipelineToEdit,
        setPipelineToEdit,
        pipelineSubFolderToEdit,
        setPipelineSubFolderToEdit,
        itemToDelete,
        setItemToDelete,
        searchQuery,
        setSearchQuery,
        filterPriority,
        setFilterPriority,
        filterStatus,
        setFilterStatus,
        filterAssignee,
        setFilterAssignee,
        quickFilter,
        setQuickFilter,
        taskGroupBy,
        setTaskGroupBy,
        visibleColumns,
        setVisibleColumns,
        crmFilterStage,
        setCrmFilterStage,
        crmFilterOwner,
        setCrmFilterOwner,
        handleClearAllFilters,
        isNewItemModalOpen,
        setIsNewItemModalOpen,
        isNewFolderModalOpen,
        setIsNewFolderModalOpen,
        isNewSubFolderModalOpen,
        setIsNewSubFolderModalOpen,
        targetFolderForNewSubFolder,
        setTargetFolderForNewSubFolder,
        targetParentSubFolderIdForNewSubFolder,
        setTargetParentSubFolderIdForNewSubFolder,
        isNewListModalOpen,
        setIsNewListModalOpen,
        targetFolderForNewList,
        setTargetFolderForNewList,
        targetSubFolderIdForNewList,
        setTargetSubFolderIdForNewList,
        isNewContactModalOpen,
        setIsNewContactModalOpen,
        isNewPipelineModalOpen,
        setIsNewPipelineModalOpen,
        isNewPipelineSubFolderModalOpen,
        setIsNewPipelineSubFolderModalOpen,
        targetPipelineForNewSubFolder,
        setTargetPipelineForNewSubFolder,
        targetParentPipelineSubFolderId,
        setTargetParentPipelineSubFolderId,
        isNewWorkspaceModalOpen,
        setIsNewWorkspaceModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        newItemType,
        setNewItemType,
        newItemDefaultStatus,
        setNewItemDefaultStatus,
        newItemDefaultDealStage,
        setNewItemDefaultDealStage,
        toastMessage,
        showToast,
        isSpaceImportModalOpen,
        setIsSpaceImportModalOpen,
        isSpaceExportModalOpen,
        setIsSpaceExportModalOpen,
        targetSpaceForImportExport,
        setTargetSpaceForImportExport,
        targetListIdForExport,
        setTargetListIdForExport,
        handleOpenSpaceImport,
        handleOpenSpaceExport,
        filteredTasks,
        filteredDeals,
        selectedTask,
        selectedDeal,
        activePipeline,
        handleSelectSpace,
        handleSelectView,
        handleOpenAddTaskToColumn,
        handleOpenAddDealToStage,
        handleOpenAddListToFolder,
        handleOpenAddSubFolder,
        handleOpenAddPipelineSubFolder,
        handleAddListToFolder,
        handleOpenEditTask,
        handleOpenEditDeal,
        handleOpenCreateTask,
        handleOpenCreateDeal,
        handleUpdateTask,
        handleCreateTask,
        handleDeleteTask,
        handleConfirmDeleteTask,
        handleUpdateDeal,
        handleCreateDeal,
        handleDeleteDeal,
        handleAdvanceDealStage,
        handleMoveTaskStatus,
        handleUpdateListSettings,
        handleUpdateStatuses,
        handleUpdateCrmSettings,
        handleUpdateCrmStages,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
        handleDeleteTaskSpace,
        handleRenameStatus,
        handleCreateSubFolder,
        handleUpdateSubFolder,
        handleDeleteSubFolder,
        handleCreatePipeline,
        handleUpdatePipeline,
        handleDeletePipeline,
        handleCreatePipelineSubFolder,
        handleUpdatePipelineSubFolder,
        handleDeletePipelineSubFolder,
        handleConfirmDeleteItem,
        handleCreateContact,
        handleUpdateContact,
        handleDeleteContact,
        docs,
        setDocs,
        activeDocId,
        setActiveDocId,
        handleCreateDoc,
        handleUpdateDoc,
        handleDeleteDoc,
        handleDuplicateDoc,
        docFolders,
        setDocFolders,
        handleCreateDocFolder,
        handleUpdateDocFolder,
        handleDeleteDocFolder,
        handleMoveListToFolder,
        handleMovePipelineSubFolder,
        handleMoveDocToFolder,
        enabledPlugins,
        isPluginEnabled,
        handleTogglePlugin,
        userSpaces,
        activeUserSpaceId,
        setActiveUserSpaceId,
        activeUserSpace,
        handleSelectUserSpace,
        handleCreateUserSpace,
        handleUpdateWorkspace,
        handleDeleteWorkspace,
        departments,
        setDepartments,
        handleCreateDepartment,
        handleUpdateDepartment,
        handleDeleteDepartment,
        roles,
        setRoles,
        effectivePermissions,
        handleCreateRole,
        handleUpdateRole,
        handleDeleteRole,
        handleDuplicateRole,
        handleInviteMember,
        handleUpdateMemberAccess,
        handleRemoveMember,
        handleChangePassword,
        handleToggleLogin,
        refreshData: loadData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
