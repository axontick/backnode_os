export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Blocked' | 'Done';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type PermissionScope = 'all' | 'assigned' | 'none';

export type OverrideScope = 'inherit' | 'all' | 'assigned' | 'none';
export type OverrideBoolean = 'inherit' | 'granted' | 'denied';

export interface TaskPermissions {
  view: PermissionScope;
  create: boolean;
  update: PermissionScope;
  delete: PermissionScope;
  change_status: PermissionScope;
  assign: boolean;
}

export interface DealPermissions {
  view: PermissionScope;
  create: boolean;
  update: PermissionScope;
  delete: PermissionScope;
  change_stage: PermissionScope;
  assign: boolean;
}

export interface CrudPermissions {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface TeamPermissions {
  manage_members: boolean;
  manage_roles: boolean;
  manage_settings: boolean;
}

export interface RolePermissions {
  tasks: TaskPermissions;
  deals: DealPermissions;
  contacts: CrudPermissions;
  spaces: CrudPermissions;
  pipelines: CrudPermissions;
  docs: CrudPermissions;
  team: TeamPermissions;
  allowedPages: string[];
  pages?: Record<string, boolean>;
}

export interface UserPermissionOverrides {
  tasks?: {
    view?: OverrideScope;
    create?: OverrideBoolean;
    update?: OverrideScope;
    delete?: OverrideScope;
    change_status?: OverrideScope;
    assign?: OverrideBoolean;
  };
  deals?: {
    view?: OverrideScope;
    create?: OverrideBoolean;
    update?: OverrideScope;
    delete?: OverrideScope;
    change_stage?: OverrideScope;
    assign?: OverrideBoolean;
  };
  contacts?: {
    view?: OverrideBoolean;
    create?: OverrideBoolean;
    update?: OverrideBoolean;
    delete?: OverrideBoolean;
  };
  spaces?: {
    view?: OverrideBoolean;
    create?: OverrideBoolean;
    update?: OverrideBoolean;
    delete?: OverrideBoolean;
  };
  pipelines?: {
    view?: OverrideBoolean;
    create?: OverrideBoolean;
    update?: OverrideBoolean;
    delete?: OverrideBoolean;
  };
  docs?: {
    view?: OverrideBoolean;
    create?: OverrideBoolean;
    update?: OverrideBoolean;
    delete?: OverrideBoolean;
  };
  team?: {
    manage_members?: OverrideBoolean;
    manage_roles?: OverrideBoolean;
    manage_settings?: OverrideBoolean;
  };
  allowedPages?: string[];
  pages?: Record<string, OverrideBoolean>;
}

export interface WorkspaceRole {
  id: string;
  name: string;
  key?: 'owner' | 'admin' | 'member' | 'viewer' | string;
  description: string;
  color: string;
  icon?: string;
  isSystem?: boolean;
  isDefault?: boolean;
  permissions: RolePermissions;
  accountId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Account {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  ownerEmail?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  roleId?: string;
  accountId: string;
  status?: 'ACTIVE' | 'DISABLED' | 'SUSPENDED' | string;
  canLogin?: boolean;
  allowedPages?: string[];
  allowedActions?: string[];
  permissionOverrides?: UserPermissionOverrides;
  account?: Account;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface SignupDto {
  email: string;
  password: string;
  name: string;
  accountName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface UserSpace {
  id: string;
  name: string;
  slug: string;
  role: string;
  color?: string;
  icon?: string;
  memberCount?: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  headMemberId?: string;
  isDefault?: boolean;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  roleId?: string;
  department: string;
  activeTasks: number;
  capacityStatus: 'Optimal' | 'Available' | 'Near capacity' | 'Overloaded' | string;
  avatarBg?: string;
  avatarColor?: string;
  accountId?: string;
  email?: string;
  accessLevel?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | string;
  status?: 'Active' | 'Invited' | 'Suspended' | 'Disabled' | string;
  invitedAt?: string;
  canLogin?: boolean;
  allowedPages?: string[];
  allowedActions?: ('read' | 'write' | 'delete' | 'publish' | 'admin' | string)[];
  permissionOverrides?: UserPermissionOverrides;
}

export interface SubtaskItem {
  id: string;
  text: string;
  done: boolean;
  author: string;
  time: string;
}

export interface ActivityEvent {
  id: string;
  type: 'commit' | 'status' | 'comment' | 'assignee';
  author: string;
  initials: string;
  role?: string;
  time: string;
  text: string;
  detail?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  specMarkdown: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignee: TeamMember;
  assigneeId?: string;
  creatorId?: string;
  tags: string[];
  subtasks: SubtaskItem[];
  estimation: {
    hours: number;
    points: number;
  };
  targetCycle: string;
  dueDate: string;
  gitBranch: string;
  replicationHash: string;
  timeInStage: string;
  linkedCrmDeal?: {
    id: string;
    name: string;
    value: string;
  };
  activity: ActivityEvent[];
  accountId?: string;
}

export interface StatusDefinition {
  id: string;
  order: number;
  name: string;
  description: string;
  color: string;
  stageMapping: string;
  activeVolume: number;
  isDefault?: boolean;
  isClosed?: boolean;
  wipLimit?: number;
  requirePrReview?: boolean;
  accountId?: string;
}

export interface ListSettings {
  name: string;
  listId: string;
  description: string;
  color: string;
  icon: string;
  defaultView: 'Board' | 'Spreadsheet' | 'Standard List' | 'Timeline' | 'Calendar';
  defaultPriority: 'P0 - Critical Blocker' | 'P1 - High Priority' | 'P2 - Medium (Normal)' | 'P3 - Low / Nice to Have';
  estimationUnit: 'Story Points' | 'Engineering Hours';
  distributedWriteLogging: boolean;
  autoArchiveDays: string;
  strictForwardProgress: boolean;
  autoArchiveDone: boolean;
  accountId?: string;
}

export interface FolderChildItem {
  id: string;
  name: string;
  taskCount: number;
  status?: string;
  active?: boolean;
  icon?: string;
  color?: string;
}

export interface SpaceSubFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  parentId: string;
  items?: FolderChildItem[];
  subFolders?: SpaceSubFolder[];
}

export interface SpaceFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  items: FolderChildItem[];
  subFolders?: SpaceSubFolder[];
  accountId?: string;
}

export interface CrmLinkedTask {
  id: string;
  title: string;
  done: boolean;
  priority?: 'Urgent' | 'High' | 'Medium' | 'Low';
  dueDate?: string;
  tag?: string;
  assignee?: string;
}

export interface CrmHistoryEvent {
  id: string;
  type: 'email' | 'call' | 'note';
  title: string;
  date: string;
  detail?: string;
}

export interface CrmPipelineSubFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  dealCount?: number;
  totalValue?: number;
  pipelineId: string;
  parentId?: string;
  subFolders?: CrmPipelineSubFolder[];
}

export interface CrmPipeline {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  dealCount: number;
  totalValue: number;
  subFolders?: CrmPipelineSubFolder[];
  accountId?: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  formattedValue: string;
  stage: 'Qualified Lead' | 'Discovery & Demo' | 'Proposal Submitted' | 'Contract & Legal' | 'Closed Won' | 'Closed Lost' | string;
  probability: number;
  targetCloseDate: string;
  contact: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    initials: string;
  };
  owner: string;
  ownerId?: string;
  ownerInitials: string;
  tags: string[];
  nextStep?: string;
  pipelineId?: string;
  subFolderId?: string;
  competitor?: string;
  lossReason?: string;
  wonReason?: string;
  cycleDays?: number;
  closedAt?: string;
  createdAt?: string;
  linkedTasks: CrmLinkedTask[];
  history: CrmHistoryEvent[];
  isArchived?: boolean;
  accountId?: string;
}

export interface CrmStageDefinition {
  id: string;
  order: number;
  name: string;
  description: string;
  color: string;
  winProbability: number;
  daysLimit: number;
  activeDealsCount: number;
  pipelineArr: number;
  isTerminal?: boolean;
  isHighlighted?: boolean;
  requiredGates: { id: string; text: string; checked: boolean }[];
  webhookEnabled: boolean;
  webhookThreshold: number;
  accountId?: string;
}

export interface CrmPipelineSettings {
  name: string;
  code: string;
  description: string;
  accentColor: string;
  icon: string;
  currency: string;
  formatNotation: 'Compact' | 'Standard';
  defaultCloseCycleDays: number;
  winProbabilityAlgorithm: string;
  targetQuarterlyRevenue: number;
  minDealValueGate: number;
  defaultView: 'Kanban Board' | 'Spreadsheet' | 'Forecast Matrix' | 'Timeline' | 'Analytics';
  cardProps: {
    displayDealAge: boolean;
    primaryContactAvatar: boolean;
    nextMilestonePill: boolean;
  };
  governance: {
    strictForwardMotion: boolean;
    stalledDealAlert: boolean;
    autoLinkDeliverables: boolean;
  };
  accountId?: string;
}

export interface DirectoryContact {
  id: string;
  name: string;
  initials: string;
  role: string;
  tag: string;
  tagColor: string;
  company: string;
  companyColor: string;
  arr: string;
  email: string;
  phone: string;
  dealName: string;
  deliverablesCount: number;
  lastActivity: string;
  lastActivityTime: string;
  healthScore: number;
  healthCategory: string;
  accountDescription: string;
  renewalDate: string;
  storageKey: string;
  replicationHash: string;
  accountId?: string;
}

export type DocClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export interface DocItem {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  spaceId?: string;
  tags: string[];
  classification: DocClassification;
  authorName: string;
  authorInitials: string;
  authorDepartment?: string;
  createdAt: string;
  updatedAt: string;
  accountId?: string;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  owner: {
    tasks: {
      view: 'all',
      create: true,
      update: 'all',
      delete: 'all',
      change_status: 'all',
      assign: true,
    },
    deals: {
      view: 'all',
      create: true,
      update: 'all',
      delete: 'all',
      change_stage: 'all',
      assign: true,
    },
    contacts: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    spaces: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    pipelines: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    docs: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    team: {
      manage_members: true,
      manage_roles: true,
      manage_settings: true,
    },
    allowedPages: ['overview', 'tasks', 'crm', 'contacts', 'docs', 'team', 'roles', 'settings'],
  },
  admin: {
    tasks: {
      view: 'all',
      create: true,
      update: 'all',
      delete: 'all',
      change_status: 'all',
      assign: true,
    },
    deals: {
      view: 'all',
      create: true,
      update: 'all',
      delete: 'all',
      change_stage: 'all',
      assign: true,
    },
    contacts: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    spaces: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    pipelines: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    docs: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    team: {
      manage_members: true,
      manage_roles: true,
      manage_settings: true,
    },
    allowedPages: ['overview', 'tasks', 'crm', 'contacts', 'docs', 'team', 'roles', 'settings'],
  },
  member: {
    tasks: {
      view: 'all',
      create: true,
      update: 'all',
      delete: 'assigned',
      change_status: 'all',
      assign: true,
    },
    deals: {
      view: 'all',
      create: true,
      update: 'all',
      delete: 'assigned',
      change_stage: 'all',
      assign: true,
    },
    contacts: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },
    spaces: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },
    pipelines: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    docs: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },
    team: {
      manage_members: false,
      manage_roles: false,
      manage_settings: false,
    },
    allowedPages: ['overview', 'tasks', 'crm', 'contacts', 'docs'],
  },
  restricted: {
    tasks: {
      view: 'assigned',
      create: true,
      update: 'assigned',
      delete: 'none',
      change_status: 'assigned',
      assign: false,
    },
    deals: {
      view: 'assigned',
      create: true,
      update: 'assigned',
      delete: 'none',
      change_stage: 'assigned',
      assign: false,
    },
    contacts: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    spaces: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    pipelines: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    docs: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    team: {
      manage_members: false,
      manage_roles: false,
      manage_settings: false,
    },
    allowedPages: ['overview', 'tasks', 'crm'],
  },
  viewer: {
    tasks: {
      view: 'all',
      create: false,
      update: 'none',
      delete: 'none',
      change_status: 'none',
      assign: false,
    },
    deals: {
      view: 'all',
      create: false,
      update: 'none',
      delete: 'none',
      change_stage: 'none',
      assign: false,
    },
    contacts: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    spaces: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    pipelines: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    docs: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    team: {
      manage_members: false,
      manage_roles: false,
      manage_settings: false,
    },
    allowedPages: ['overview', 'tasks', 'crm', 'contacts', 'docs'],
  },
};

export const INITIAL_SYSTEM_ROLES: WorkspaceRole[] = [
  {
    id: 'role-owner',
    name: 'Workspace Owner',
    key: 'owner',
    description: 'Root authority with unconstrained administrative privileges, billing control, and universal resource management.',
    color: '#ea580c',
    icon: 'shield_person',
    isSystem: true,
    isDefault: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.owner,
  },
  {
    id: 'role-admin',
    name: 'Workspace Administrator',
    key: 'admin',
    description: 'Elevated team manager. Can provision operators, configure custom roles, manage pipelines, and configure space settings.',
    color: '#6366f1',
    icon: 'admin_panel_settings',
    isSystem: true,
    isDefault: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.admin,
  },
  {
    id: 'role-member',
    name: 'Standard Contributor',
    key: 'member',
    description: 'Standard team operator. Can triage tasks, create deliverables, advance CRM deals, and manage directory contacts.',
    color: '#10b981',
    icon: 'badge',
    isSystem: true,
    isDefault: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.member,
  },
  {
    id: 'role-restricted',
    name: 'Field Contributor (Assigned Items Only)',
    key: 'restricted',
    description: 'Scoped team operator. Strictly limited to viewing and updating items directly assigned to them across tasks and pipelines.',
    color: '#f59e0b',
    icon: 'assignment_ind',
    isSystem: false,
    isDefault: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.restricted,
  },
  {
    id: 'role-viewer',
    name: 'Read-Only Viewer',
    key: 'viewer',
    description: 'Auditor or stakeholder with read-only visibility across boards, sprint cycles, deals, and reports without modification access.',
    color: '#71717a',
    icon: 'visibility',
    isSystem: true,
    isDefault: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.viewer,
  },
];

function resolveScope(base: PermissionScope, override?: OverrideScope): PermissionScope {
  if (!override || override === 'inherit') return base;
  return override;
}

function resolveBoolean(base: boolean, override?: OverrideBoolean): boolean {
  if (!override || override === 'inherit') return base;
  return override === 'granted';
}

export function resolveEffectivePermissions(
  role?: WorkspaceRole | null,
  overrides?: UserPermissionOverrides | null,
  isOwner?: boolean
): RolePermissions {
  if (isOwner || role?.key === 'owner') {
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS.owner));
  }

  const basePermissions = role?.permissions || DEFAULT_ROLE_PERMISSIONS.member;
  const base = JSON.parse(JSON.stringify(basePermissions)) as RolePermissions;

  if (!overrides) {
    return base;
  }

  // Tasks
  if (overrides.tasks) {
    base.tasks.view = resolveScope(base.tasks.view, overrides.tasks.view);
    base.tasks.create = resolveBoolean(base.tasks.create, overrides.tasks.create);
    base.tasks.update = resolveScope(base.tasks.update, overrides.tasks.update);
    base.tasks.delete = resolveScope(base.tasks.delete, overrides.tasks.delete);
    base.tasks.change_status = resolveScope(base.tasks.change_status, overrides.tasks.change_status);
    base.tasks.assign = resolveBoolean(base.tasks.assign, overrides.tasks.assign);
  }

  // Deals
  if (overrides.deals) {
    base.deals.view = resolveScope(base.deals.view, overrides.deals.view);
    base.deals.create = resolveBoolean(base.deals.create, overrides.deals.create);
    base.deals.update = resolveScope(base.deals.update, overrides.deals.update);
    base.deals.delete = resolveScope(base.deals.delete, overrides.deals.delete);
    base.deals.change_stage = resolveScope(base.deals.change_stage, overrides.deals.change_stage);
    base.deals.assign = resolveBoolean(base.deals.assign, overrides.deals.assign);
  }

  // Contacts
  if (overrides.contacts) {
    base.contacts.view = resolveBoolean(base.contacts.view, overrides.contacts.view);
    base.contacts.create = resolveBoolean(base.contacts.create, overrides.contacts.create);
    base.contacts.update = resolveBoolean(base.contacts.update, overrides.contacts.update);
    base.contacts.delete = resolveBoolean(base.contacts.delete, overrides.contacts.delete);
  }

  // Spaces
  if (overrides.spaces) {
    base.spaces.view = resolveBoolean(base.spaces.view, overrides.spaces.view);
    base.spaces.create = resolveBoolean(base.spaces.create, overrides.spaces.create);
    base.spaces.update = resolveBoolean(base.spaces.update, overrides.spaces.update);
    base.spaces.delete = resolveBoolean(base.spaces.delete, overrides.spaces.delete);
  }

  // Pipelines
  if (overrides.pipelines) {
    base.pipelines.view = resolveBoolean(base.pipelines.view, overrides.pipelines.view);
    base.pipelines.create = resolveBoolean(base.pipelines.create, overrides.pipelines.create);
    base.pipelines.update = resolveBoolean(base.pipelines.update, overrides.pipelines.update);
    base.pipelines.delete = resolveBoolean(base.pipelines.delete, overrides.pipelines.delete);
  }

  // Docs
  if (overrides.docs) {
    base.docs.view = resolveBoolean(base.docs.view, overrides.docs.view);
    base.docs.create = resolveBoolean(base.docs.create, overrides.docs.create);
    base.docs.update = resolveBoolean(base.docs.update, overrides.docs.update);
    base.docs.delete = resolveBoolean(base.docs.delete, overrides.docs.delete);
  }

  // Team
  if (overrides.team) {
    base.team.manage_members = resolveBoolean(base.team.manage_members, overrides.team.manage_members);
    base.team.manage_roles = resolveBoolean(base.team.manage_roles, overrides.team.manage_roles);
    base.team.manage_settings = resolveBoolean(base.team.manage_settings, overrides.team.manage_settings);
  }

  // Allowed pages
  if (Array.isArray(overrides.allowedPages) && overrides.allowedPages.length > 0) {
    base.allowedPages = overrides.allowedPages;
  }

  // Explicit pages dictionary
  if (overrides.pages) {
    if (!base.pages) base.pages = {};
    for (const [page, ov] of Object.entries(overrides.pages)) {
      const baseVal = base.pages[page] ?? base.allowedPages.includes(page);
      base.pages[page] = resolveBoolean(baseVal, ov);
    }
  }

  return base;
}

