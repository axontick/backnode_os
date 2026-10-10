import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  initialDocs,
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
} from '../types';
import { DeletionTarget } from '../components/DeleteConfirmationModal';
import {
  tasksApi,
  dealsApi,
  pipelinesApi,
  membersApi,
  contactsApi,
  workspaceApi,
} from '../services/api';
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
  crmView: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings';
  setCrmView: (v: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings') => void;
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

  // Top-left User Space Dropdown & Creation
  userSpaces: UserSpace[];
  activeUserSpaceId: string;
  setActiveUserSpaceId: (id: string) => void;
  activeUserSpace: UserSpace;
  handleSelectUserSpace: (spaceId: string) => void;
  handleCreateUserSpace: (space: { name: string; color?: string; icon?: string }) => void;
  handleUpdateWorkspace: (workspaceId: string, updates: { name?: string; color?: string; icon?: string }) => Promise<void>;
  handleDeleteWorkspace: (workspaceId: string) => Promise<void>;

  // Member & Access Control
  handleInviteMember: (data: {
    name: string;
    email: string;
    role?: string;
    accessLevel?: string;
    department?: string;
    capacityStatus?: string;
    password?: string;
    canLogin?: boolean;
    allowedPages?: string[];
    allowedActions?: string[];
  }) => Promise<TeamMember>;
  handleUpdateMemberAccess: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  handleRemoveMember: (id: string) => Promise<void>;
  handleChangePassword: (id: string, password: string) => Promise<void>;
  handleToggleLogin: (id: string, canLogin?: boolean) => Promise<void>;

  refreshData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [listSettings, setListSettings] = useState(initialListSettings);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([]);
  const [folders, setFolders] = useState<SpaceFolder[]>([]);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

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
  const [crmView, setCrmView] = useState<'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings'>('dashboard');
  const [crmSettingsInitialTab, setCrmSettingsInitialTab] = useState<'general' | 'stages'>('general');

  // Docs state
  const [docs, setDocs] = useState<DocItem[]>(() => {
    try {
      const stored = localStorage.getItem('backnode_docs_collection');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached docs:', e);
    }
    return initialDocs;
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    return localStorage.getItem('backnode_active_doc_id') || initialDocs[0]?.id || 'doc-arch-v2';
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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [taskGroupBy, setTaskGroupBy] = useState<'status' | 'priority' | 'assignee'>('status');
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
        s.id !== 'space-infra' &&
        s.id !== 'space-growth'
    );
  };

  // User Spaces state (top-left workspace selector) - Only actual workspaces that exist
  const getInitialSpace = (): UserSpace => ({
    id: user?.account?.id || 'space-main',
    name: user?.account?.name || 'Workspace',
    slug: user?.account?.slug || 'workspace',
    role: (user?.role as string) || 'Owner',
    color: '#ea580c',
    icon: 'deployed_code',
    memberCount: members.length || 1,
  });

  const getInitialSpaces = (): UserSpace[] => [
    getInitialSpace(),
    {
      id: 'space-engineering',
      name: 'Engineering Systems',
      slug: 'engineering-systems',
      role: 'Admin',
      color: '#3b82f6',
      icon: 'terminal',
      memberCount: 8,
    },
    {
      id: 'space-enterprise',
      name: 'Enterprise Deals & PoCs',
      slug: 'enterprise-deals-pocs',
      role: 'Owner',
      color: '#10b981',
      icon: 'domain',
      memberCount: 5,
    },
  ];

  const [userSpaces, setUserSpaces] = useState<UserSpace[]>(() => {
    const saved = localStorage.getItem('backnode_user_spaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const cleaned = filterRealWorkspaces(parsed);
          if (cleaned.length >= 2) {
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
    return localStorage.getItem('backnode_active_user_space_id') || user?.account?.id || 'space-main';
  });

  // Sync actual account workspace when user changes
  useEffect(() => {
    if (user?.account?.name) {
      let nextSpaces: UserSpace[] = [];
      setUserSpaces((prev) => {
        const cleaned = filterRealWorkspaces(prev);
        const matchIndex = cleaned.findIndex(
          (s) => s.id === user.account!.id || s.name.toLowerCase() === user.account!.name.toLowerCase()
        );

        if (matchIndex >= 0) {
          nextSpaces = cleaned.map((s, idx) =>
            idx === matchIndex
              ? {
                  ...s,
                  id: user.account!.id,
                  name: user.account!.name,
                  slug: user.account!.slug,
                  role: (user.role as string) || 'Owner',
                  memberCount: members.length || s.memberCount || 1,
                }
              : s
          );
        } else {
          nextSpaces = [
            {
              id: user.account!.id,
              name: user.account!.name,
              slug: user.account!.slug,
              role: (user.role as string) || 'Owner',
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
        if (savedId && nextSpaces.some((s) => s.id === savedId)) {
          return savedId;
        }
        if (curr && nextSpaces.some((s) => s.id === curr)) {
          return curr;
        }
        const targetId = user.account!.id;
        localStorage.setItem('backnode_active_user_space_id', targetId);
        return targetId;
      });
    }
  }, [user?.account?.id, user?.account?.name]);

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

  const handleInviteMember = async (data: {
    name: string;
    email: string;
    role?: string;
    accessLevel?: string;
    department?: string;
    capacityStatus?: string;
    password?: string;
    canLogin?: boolean;
    allowedPages?: string[];
    allowedActions?: string[];
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
      showToast(`Operator "${data.name}" added locally`);
      return fallbackMember;
    }
  };

  const handleUpdateMemberAccess = async (id: string, updates: Partial<TeamMember>) => {
    const target = members.find((m) => m.id === id);
    if (target?.accessLevel === 'OWNER') {
      showToast('Workspace Owner role cannot be modified or demoted.');
      return;
    }
    try {
      await membersApi.update(id, updates);
    } catch (err) {
      console.warn('Backend unavailable for member update, applying locally:', err);
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
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
      ]);

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
      setMembers(fetchedMembers && fetchedMembers.length > 0 ? fetchedMembers : initialTeamMembers);
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
      if (fetchedStatuses && fetchedStatuses.length > 0) setStatuses(fetchedStatuses);
      if (fetchedListSettings) setListSettings(fetchedListSettings);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Backend not reachable or error fetching data, using initial cache:', err);
      setMembers((prev) => (prev && prev.length > 0 ? prev : initialTeamMembers));
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
  }, [token]);

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

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesQuick;
  });

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

  const handleUpdateTask = (updatedTask: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    tasksApi.update(updatedTask.id, updatedTask).catch((err) => {
      console.error('Failed to update task in DB:', err);
    });
    showToast(`Task ${updatedTask.id} updated`);
  };

  const handleCreateTask = (newTask: Partial<TaskItem>) => {
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
      targetCycle: 'Sprint 01',
      dueDate: '',
      gitBranch: '',
      replicationHash: '0x' + Math.random().toString(16).substring(2, 8),
      ...newTask,
      id: newTask.id || `BK-${Date.now().toString().slice(-4)}`,
      createdAt: 'Just now',
    } as TaskItem;
    setTasks((prev) => [created, ...prev]);
    tasksApi.create(created).catch((err) => {
      console.error('Failed to create task in DB:', err);
    });
    showToast(`Task ${created.id} created successfully`);
  };

  const handleDeleteTask = (taskId: string) => {
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
    setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)));
    dealsApi.update(updatedDeal.id, updatedDeal).catch((err) => {
      console.error('Failed to update deal in DB:', err);
    });
    showToast(`Deal ${updatedDeal.title} updated`);
  };

  const handleCreateDeal = (newDeal: Partial<CrmDeal>) => {
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

  const handleAdvanceDealStage = (dealId: string, newStage: CrmDeal['stage']) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
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
    workspaceApi.updateListSettings(newSettings).catch((err) => {
      console.error('Failed to update list settings in DB:', err);
    });
    showToast('Task space settings updated');
  };

  const handleUpdateStatuses = (newStatuses: StatusDefinition[]) => {
    setStatuses(newStatuses);
    workspaceApi.updateStatuses(newStatuses).catch((err) => {
      console.error('Failed to update statuses in DB:', err);
    });
    showToast('Pipeline statuses updated');
  };

  const handleUpdateCrmSettings = (newSettings: Partial<CrmPipelineSettingsType>) => {
    setCrmSettings((prev) => ({ ...prev, ...newSettings }));
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
    const isContained = deletedItems.some((i) => i.id === activeSpace);
    if (isContained) {
      const remainingItems = remaining.flatMap((f) => getAllItemsFromFolder(f));
      const nextSpace = remainingItems[0]?.id || 'sprint-14';
      setActiveSpace(nextSpace);
    }
    workspaceApi.deleteFolder(folderId).catch((err) => {
      console.error('Failed to delete folder in DB:', err);
    });
    showToast('Folder deleted');
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

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete?.item?.id) return;
    if (itemToDelete.type === 'task') {
      handleDeleteTask(itemToDelete.item.id);
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
    showToast(`Document "${newDoc.title}" created`);
    return newDoc;
  };

  const handleUpdateDoc = (id: string, updates: Partial<DocItem>) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc
      )
    );
  };

  const handleDeleteDoc = (id: string) => {
    const target = docs.find((d) => d.id === id);
    const remaining = docs.filter((d) => d.id !== id);
    setDocs(remaining);
    if (activeDocId === id) {
      setActiveDocId(remaining[0]?.id || '');
    }
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
    showToast(`Duplicated "${target.title}"`);
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
        filteredTasks,
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
        handleAdvanceDealStage,
        handleMoveTaskStatus,
        handleUpdateListSettings,
        handleUpdateStatuses,
        handleUpdateCrmSettings,
        handleUpdateCrmStages,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
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
        userSpaces,
        activeUserSpaceId,
        setActiveUserSpaceId,
        activeUserSpace,
        handleSelectUserSpace,
        handleCreateUserSpace,
        handleUpdateWorkspace,
        handleDeleteWorkspace,
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
