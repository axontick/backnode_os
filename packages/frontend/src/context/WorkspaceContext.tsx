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
} from '../mockData';
import {
  TaskItem,
  TaskStatus,
  CrmDeal,
  CrmStageDefinition,
  CrmPipelineSettings as CrmPipelineSettingsType,
  DirectoryContact,
  SpaceFolder,
  CrmPipeline,
  StatusDefinition,
  ListSettings,
  TeamMember,
  UserSpace,
} from '../types';
import {
  tasksApi,
  dealsApi,
  pipelinesApi,
  membersApi,
  contactsApi,
  workspaceApi,
} from '../services/api';
import { useAuth } from './AuthContext';

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
  deals: CrmDeal[];
  setDeals: React.Dispatch<React.SetStateAction<CrmDeal[]>>;
  crmStages: CrmStageDefinition[];
  setCrmStages: React.Dispatch<React.SetStateAction<CrmStageDefinition[]>>;
  crmSettings: CrmPipelineSettingsType;
  setCrmSettings: React.Dispatch<React.SetStateAction<CrmPipelineSettingsType>>;

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
  taskToDelete: TaskItem | null;
  setTaskToDelete: (task: TaskItem | null) => void;
  folderToEdit: SpaceFolder | null;
  setFolderToEdit: (folder: SpaceFolder | null) => void;
  pipelineToEdit: CrmPipeline | null;
  setPipelineToEdit: (pipeline: CrmPipeline | null) => void;
  itemToDelete: { type: 'task' | 'folder' | 'pipeline'; item: any } | null;
  setItemToDelete: (target: { type: 'task' | 'folder' | 'pipeline'; item: any } | null) => void;
  handleUpdateFolder: (updatedFolder: SpaceFolder) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdatePipeline: (updatedPipeline: CrmPipeline) => void;
  handleDeletePipeline: (pipelineId: string) => void;
  handleConfirmDeleteItem: () => void;

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
  isNewContactModalOpen: boolean;
  setIsNewContactModalOpen: (open: boolean) => void;
  isNewPipelineModalOpen: boolean;
  setIsNewPipelineModalOpen: (open: boolean) => void;
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
  handleUpdateTask: (task: TaskItem) => void;
  handleCreateTask: (task: Partial<TaskItem>) => void;
  handleDeleteTask: (taskId: string) => void;
  handleConfirmDeleteTask: () => void;
  handleUpdateDeal: (deal: CrmDeal) => void;
  handleCreateDeal: (deal: Partial<CrmDeal>) => void;
  handleAdvanceDealStage: (dealId: string, newStage: CrmDeal['stage']) => void;
  handleMoveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  handleUpdateListSettings: (newSettings: Partial<ListSettings>) => void;
  handleUpdateStatuses: (newStatuses: StatusDefinition[]) => void;
  handleUpdateCrmSettings: (newSettings: Partial<CrmPipelineSettingsType>) => void;
  handleUpdateCrmStages: (newStages: CrmStageDefinition[]) => void;
  handleCreateFolder: (folder: SpaceFolder) => void;
  handleCreatePipeline: (pipeline: CrmPipeline) => void;
  handleCreateContact: (contact: DirectoryContact) => void;

  // Top-left User Space Dropdown & Creation
  userSpaces: UserSpace[];
  activeUserSpaceId: string;
  activeUserSpace: UserSpace;
  handleSelectUserSpace: (spaceId: string) => void;
  handleCreateUserSpace: (space: { name: string; color?: string; icon?: string }) => void;

  // Member & Access Control
  handleInviteMember: (data: {
    name: string;
    email: string;
    role?: string;
    accessLevel?: string;
    department?: string;
    capacityStatus?: string;
  }) => Promise<TeamMember>;
  handleUpdateMemberAccess: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  handleRemoveMember: (id: string) => Promise<void>;

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
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [crmStages, setCrmStages] = useState<CrmStageDefinition[]>(initialCrmStages);
  const [crmSettings, setCrmSettings] = useState<CrmPipelineSettingsType>(initialCrmPipelineSettings);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [crmView, setCrmView] = useState<'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings'>('dashboard');
  const [crmSettingsInitialTab, setCrmSettingsInitialTab] = useState<'general' | 'stages'>('general');

  // Navigation state
  const [currentHub, setCurrentHub] = useState<string>('task-spaces');
  const [activeSpace, setActiveSpace] = useState<string>('sprint-14');
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs'
  >('dashboard');
  const [overviewMode, setOverviewMode] = useState<'cockpit' | 'summary'>('cockpit');

  // Inspector & Modal states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<SpaceFolder | null>(null);
  const [pipelineToEdit, setPipelineToEdit] = useState<CrmPipeline | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'task' | 'folder' | 'pipeline'; item: any } | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
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
    color: '#9900c2',
    icon: 'deployed_code',
    memberCount: members.length || 1,
  });

  const [userSpaces, setUserSpaces] = useState<UserSpace[]>(() => {
    const saved = localStorage.getItem('backnode_user_spaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = filterRealWorkspaces(parsed);
          if (cleaned.length > 0) {
            localStorage.setItem('backnode_user_spaces', JSON.stringify(cleaned));
            return cleaned;
          }
        }
      } catch {}
    }
    return [getInitialSpace()];
  });

  const [activeUserSpaceId, setActiveUserSpaceId] = useState<string>(() => {
    return localStorage.getItem('backnode_active_user_space_id') || user?.account?.id || 'space-main';
  });

  // Sync actual account workspace when user changes
  useEffect(() => {
    if (user?.account?.name) {
      setUserSpaces((prev) => {
        const cleaned = filterRealWorkspaces(prev);
        const matchIndex = cleaned.findIndex(
          (s) => s.id === user.account!.id || s.name.toLowerCase() === user.account!.name.toLowerCase()
        );

        let updated: UserSpace[];
        if (matchIndex >= 0) {
          updated = cleaned.map((s, idx) =>
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
          updated = [
            {
              id: user.account!.id,
              name: user.account!.name,
              slug: user.account!.slug,
              role: (user.role as string) || 'Owner',
              color: '#9900c2',
              icon: 'deployed_code',
              memberCount: members.length || 1,
            },
            ...cleaned,
          ];
        }
        localStorage.setItem('backnode_user_spaces', JSON.stringify(updated));
        return updated;
      });

      setActiveUserSpaceId((curr) => {
        const targetId = user.account!.id;
        localStorage.setItem('backnode_active_user_space_id', targetId);
        return targetId;
      });
    }
  }, [user?.account?.id, user?.account?.name, members.length]);

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
        color: space.color || '#9900c2',
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
        color: space.color || '#9900c2',
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

  const handleInviteMember = async (data: {
    name: string;
    email: string;
    role?: string;
    accessLevel?: string;
    department?: string;
    capacityStatus?: string;
  }) => {
    const newMemberData: Partial<TeamMember> = {
      id: `mem-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      initials: data.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      role: data.role || (data.accessLevel === 'ADMIN' ? 'Workspace Admin' : 'Product Operator'),
      accessLevel: data.accessLevel || 'MEMBER',
      status: 'Invited',
      department: (data.department as any) || 'Engineering',
      activeTasks: 0,
      capacityStatus: (data.capacityStatus as any) || 'Available',
      avatarBg: '#9900c2',
      avatarColor: '#ffffff',
      invitedAt: new Date().toISOString(),
    };

    try {
      const created = await membersApi.create(newMemberData);
      setMembers((prev) => [...prev, created]);
      showToast(`Invitation dispatched to ${data.email}`);
      return created;
    } catch (err) {
      console.warn('Backend unavailable, saving locally:', err);
      const fallbackMember = newMemberData as TeamMember;
      setMembers((prev) => [...prev, fallbackMember]);
      showToast(`Invitation dispatched to ${data.email}`);
      return fallbackMember;
    }
  };

  const handleUpdateMemberAccess = async (id: string, updates: Partial<TeamMember>) => {
    try {
      await membersApi.update(id, updates);
    } catch (err) {
      console.warn('Backend unavailable for member update, applying locally:', err);
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    showToast('Member access level updated');
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await membersApi.delete(id);
    } catch (err) {
      console.warn('Backend unavailable for member delete, removing locally:', err);
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast('Member access revoked');
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
      setPipelines(fetchedPipelines || []);
      if (fetchedPipelines && fetchedPipelines.length > 0) {
        setActivePipelineId((curr) => {
          if (!curr || !fetchedPipelines.some((p) => p.id === curr)) {
            return fetchedPipelines[0].id;
          }
          return curr;
        });
      }
      if (fetchedStages && fetchedStages.length > 0) setCrmStages(fetchedStages);
      if (fetchedCrmSettings) setCrmSettings(fetchedCrmSettings);
      setMembers(fetchedMembers && fetchedMembers.length > 0 ? fetchedMembers : initialTeamMembers);
      setDirectoryContacts(fetchedContacts || []);
      setFolders(fetchedFolders || []);
      if (fetchedFolders && fetchedFolders.length > 0) {
        setActiveSpace((curr) => {
          const allItems = fetchedFolders.flatMap((f) => f.items || []);
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

  const handleOpenAddTaskToColumn = (status: TaskStatus) => {
    setNewItemType('task');
    setNewItemDefaultStatus(status);
    setIsNewItemModalOpen(true);
  };

  const handleOpenAddDealToStage = (stage: CrmDeal['stage'] = 'Proposal Submitted') => {
    setNewItemType('deal');
    setNewItemDefaultDealStage(stage);
    setIsNewItemModalOpen(true);
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
      avatarBg: '#9900c2',
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

  const handleMoveTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
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
    if (deletedFolder?.items?.some((i) => i.id === activeSpace)) {
      const nextSpace = remaining[0]?.items?.[0]?.id || 'sprint-14';
      setActiveSpace(nextSpace);
    }
    workspaceApi.deleteFolder(folderId).catch((err) => {
      console.error('Failed to delete folder in DB:', err);
    });
    showToast('Folder deleted');
  };

  const handleCreatePipeline = (newPipeline: CrmPipeline) => {
    setPipelines((prev) => [...prev, newPipeline]);
    setActivePipelineId(newPipeline.id);
    pipelinesApi.create(newPipeline).catch((err) => {
      console.error('Failed to create pipeline in DB:', err);
    });
    showToast(`Pipeline "${newPipeline.name}" initialized`);
    setIsNewPipelineModalOpen(false);
  };

  const handleUpdatePipeline = (updatedPipeline: CrmPipeline) => {
    setPipelines((prev) => prev.map((p) => (p.id === updatedPipeline.id ? updatedPipeline : p)));
    pipelinesApi.update(updatedPipeline.id, updatedPipeline).catch((err) => {
      console.error('Failed to update pipeline in DB:', err);
    });
    showToast(`Pipeline "${updatedPipeline.name}" updated`);
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

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete?.item?.id) return;
    if (itemToDelete.type === 'task') {
      handleDeleteTask(itemToDelete.item.id);
    } else if (itemToDelete.type === 'folder') {
      handleDeleteFolder(itemToDelete.item.id);
    } else if (itemToDelete.type === 'pipeline') {
      handleDeletePipeline(itemToDelete.item.id);
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
        taskToDelete,
        setTaskToDelete,
        folderToEdit,
        setFolderToEdit,
        pipelineToEdit,
        setPipelineToEdit,
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
        isNewContactModalOpen,
        setIsNewContactModalOpen,
        isNewPipelineModalOpen,
        setIsNewPipelineModalOpen,
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
        handleCreatePipeline,
        handleUpdatePipeline,
        handleDeletePipeline,
        handleConfirmDeleteItem,
        handleCreateContact,
        userSpaces,
        activeUserSpaceId,
        activeUserSpace,
        handleSelectUserSpace,
        handleCreateUserSpace,
        handleInviteMember,
        handleUpdateMemberAccess,
        handleRemoveMember,
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
