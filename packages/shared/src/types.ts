export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Blocked' | 'Done';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Account {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  accountId: string;
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

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: 'Engineering' | 'Product' | 'Design';
  activeTasks: number;
  capacityStatus: 'Optimal' | 'Available' | 'Near capacity' | 'Overloaded';
  avatarBg?: string;
  avatarColor?: string;
  accountId?: string;
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
}

export interface SpaceFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  items: FolderChildItem[];
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

export interface CrmPipeline {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  dealCount: number;
  totalValue: number;
  accountId?: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  company: string;
  value: number;
  formattedValue: string;
  stage: 'Qualified Lead' | 'Discovery & Demo' | 'Proposal Submitted' | 'Contract & Legal' | 'Closed Won';
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
  ownerInitials: string;
  tags: string[];
  nextStep?: string;
  pipelineId?: string;
  linkedTasks: CrmLinkedTask[];
  history: CrmHistoryEvent[];
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



