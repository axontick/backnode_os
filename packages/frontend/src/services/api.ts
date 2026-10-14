import axios from 'axios';
import {
  TaskItem,
  CrmDeal,
  CrmPipeline,
  CrmStageDefinition,
  CrmPipelineSettings,
  TeamMember,
  DirectoryContact,
  SpaceFolder,
  StatusDefinition,
  ListSettings,
  LoginDto,
  SignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponse,
  User,
  UserSpace,
  Department,
  WorkspaceRole,
  RolePermissions,
  DocItem,
  DocFolder,
  UpdateProfileDto,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3011/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Automatically inject JWT Bearer token and active workspace into outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('backnode_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeSpaceId = localStorage.getItem('backnode_active_user_space_id');
  if (activeSpaceId && config.headers) {
    config.headers['x-account-id'] = activeSpaceId;
  }
  return config;
});

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', dto);
    return res.data;
  },
  signup: async (dto: SignupDto): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/signup', dto);
    return res.data;
  },
  forgotPassword: async (dto: ForgotPasswordDto): Promise<{ message: string; devToken?: string }> => {
    const res = await apiClient.post<{ message: string; devToken?: string }>('/auth/forgot-password', dto);
    return res.data;
  },
  resetPassword: async (dto: ResetPasswordDto): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', dto);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<any>('/auth/me');
    return res.data?.user || res.data;
  },
  updateProfile: async (dto: UpdateProfileDto): Promise<User> => {
    const res = await apiClient.patch<any>('/auth/profile', dto);
    return res.data?.user || res.data;
  },
  uploadAvatar: async (formData: FormData): Promise<{ avatarUrl: string }> => {
    const res = await apiClient.post<{ avatarUrl: string }>('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

export const tasksApi = {
  getAll: async (params?: { status?: string; priority?: string; assigneeId?: string; listId?: string }): Promise<TaskItem[]> => {
    const res = await apiClient.get<TaskItem[]>('/tasks', { params });
    return res.data;
  },
  getById: async (id: string): Promise<TaskItem> => {
    const res = await apiClient.get<TaskItem>(`/tasks/${id}`);
    return res.data;
  },
  create: async (task: Partial<TaskItem>): Promise<TaskItem> => {
    const res = await apiClient.post<TaskItem>('/tasks', task);
    return res.data;
  },
  createMany: async (tasks: Partial<TaskItem>[]): Promise<TaskItem[]> => {
    const res = await apiClient.post<TaskItem[]>('/tasks/bulk', tasks);
    return res.data;
  },
  update: async (id: string, task: Partial<TaskItem>): Promise<TaskItem> => {
    const res = await apiClient.patch<TaskItem>(`/tasks/${id}`, task);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/tasks/${id}`);
    return res.data;
  },
};

export const dealsApi = {
  getAll: async (pipelineId?: string): Promise<CrmDeal[]> => {
    const res = await apiClient.get<CrmDeal[]>('/deals', {
      params: pipelineId ? { pipelineId } : undefined,
    });
    return res.data;
  },
  getById: async (id: string): Promise<CrmDeal> => {
    const res = await apiClient.get<CrmDeal>(`/deals/${id}`);
    return res.data;
  },
  create: async (deal: Partial<CrmDeal>): Promise<CrmDeal> => {
    const res = await apiClient.post<CrmDeal>('/deals', deal);
    return res.data;
  },
  update: async (id: string, deal: Partial<CrmDeal>): Promise<CrmDeal> => {
    const res = await apiClient.patch<CrmDeal>(`/deals/${id}`, deal);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/deals/${id}`);
    return res.data;
  },
};

export const pipelinesApi = {
  getAll: async (): Promise<CrmPipeline[]> => {
    const res = await apiClient.get<CrmPipeline[]>('/pipelines');
    return res.data;
  },
  create: async (pipeline: Partial<CrmPipeline>): Promise<CrmPipeline> => {
    const res = await apiClient.post<CrmPipeline>('/pipelines', pipeline);
    return res.data;
  },
  update: async (id: string, pipeline: Partial<CrmPipeline>): Promise<CrmPipeline> => {
    const res = await apiClient.patch<CrmPipeline>(`/pipelines/${id}`, pipeline);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/pipelines/${id}`);
    return res.data;
  },
  getStages: async (): Promise<CrmStageDefinition[]> => {
    const res = await apiClient.get<CrmStageDefinition[]>('/pipelines/stages');
    return res.data;
  },
  updateStages: async (stages: CrmStageDefinition[]): Promise<CrmStageDefinition[]> => {
    const res = await apiClient.put<CrmStageDefinition[]>('/pipelines/stages', stages);
    return res.data;
  },
  getSettings: async (): Promise<CrmPipelineSettings> => {
    const res = await apiClient.get<CrmPipelineSettings>('/pipelines/settings');
    return res.data;
  },
  updateSettings: async (settings: Partial<CrmPipelineSettings>): Promise<CrmPipelineSettings> => {
    const res = await apiClient.put<CrmPipelineSettings>('/pipelines/settings', settings);
    return res.data;
  },
};

export const membersApi = {
  getAll: async (): Promise<TeamMember[]> => {
    const res = await apiClient.get<TeamMember[]>('/members');
    return res.data;
  },
  create: async (member: Partial<TeamMember>): Promise<TeamMember> => {
    const res = await apiClient.post<TeamMember>('/members', member);
    return res.data;
  },
  update: async (id: string, member: Partial<TeamMember>): Promise<TeamMember> => {
    const res = await apiClient.patch<TeamMember>(`/members/${id}`, member);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string; success: boolean }> => {
    const res = await apiClient.delete<{ id: string; success: boolean }>(`/members/${id}`);
    return res.data;
  },
  changePassword: async (id: string, password: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/members/${id}/password`, { password });
    return res.data;
  },
  toggleLogin: async (id: string, canLogin?: boolean): Promise<TeamMember> => {
    const res = await apiClient.patch<TeamMember>(`/members/${id}/toggle-login`, { canLogin });
    return res.data;
  },
};

export const contactsApi = {
  getAll: async (): Promise<DirectoryContact[]> => {
    const res = await apiClient.get<DirectoryContact[]>('/contacts');
    return res.data;
  },
  create: async (contact: Partial<DirectoryContact>): Promise<DirectoryContact> => {
    const res = await apiClient.post<DirectoryContact>('/contacts', contact);
    return res.data;
  },
  update: async (id: string, contact: Partial<DirectoryContact>): Promise<DirectoryContact> => {
    const res = await apiClient.patch<DirectoryContact>(`/contacts/${id}`, contact);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/contacts/${id}`);
    return res.data;
  },
};

export const workspaceApi = {
  getWorkspaces: async (): Promise<UserSpace[]> => {
    const res = await apiClient.get<UserSpace[]>('/workspaces');
    return res.data;
  },
  createWorkspace: async (data: { name: string; color?: string; icon?: string }): Promise<UserSpace> => {
    const res = await apiClient.post<UserSpace>('/workspaces', data);
    return res.data;
  },
  updateWorkspace: async (id: string, data: { name?: string; color?: string; icon?: string }): Promise<UserSpace> => {
    const res = await apiClient.patch<UserSpace>(`/workspaces/${id}`, data);
    return res.data;
  },
  deleteWorkspace: async (id: string): Promise<{ id: string; success: boolean }> => {
    const res = await apiClient.delete<{ id: string; success: boolean }>(`/workspaces/${id}`);
    return res.data;
  },
  getFolders: async (): Promise<SpaceFolder[]> => {
    const res = await apiClient.get<SpaceFolder[]>('/folders');
    return res.data;
  },
  createFolder: async (folder: Partial<SpaceFolder>): Promise<SpaceFolder> => {
    const res = await apiClient.post<SpaceFolder>('/folders', folder);
    return res.data;
  },
  updateFolder: async (id: string, folder: Partial<SpaceFolder>): Promise<SpaceFolder> => {
    const res = await apiClient.patch<SpaceFolder>(`/folders/${id}`, folder);
    return res.data;
  },
  deleteFolder: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/folders/${id}`);
    return res.data;
  },
  deleteList: async (id: string): Promise<{ id: string; success: boolean }> => {
    const res = await apiClient.delete<{ id: string; success: boolean }>(`/lists/${id}`);
    return res.data;
  },
  exportSpace: async (spaceId: string, listId?: string): Promise<any> => {
    const res = await apiClient.get<any>(`/spaces/${spaceId}/export`, {
      params: listId ? { listId } : undefined,
    });
    return res.data;
  },
  importSpace: async (spaceId: string, payload: any): Promise<any> => {
    const res = await apiClient.post<any>(`/spaces/${spaceId}/import`, payload);
    return res.data;
  },
  getStatuses: async (): Promise<StatusDefinition[]> => {
    const res = await apiClient.get<StatusDefinition[]>('/statuses');
    return res.data;
  },
  updateStatuses: async (statuses: StatusDefinition[]): Promise<StatusDefinition[]> => {
    const res = await apiClient.put<StatusDefinition[]>('/statuses', statuses);
    return res.data;
  },
  getListSettings: async (): Promise<ListSettings> => {
    const res = await apiClient.get<ListSettings>('/settings/list');
    return res.data;
  },
  updateListSettings: async (settings: Partial<ListSettings>): Promise<ListSettings> => {
    const res = await apiClient.put<ListSettings>('/settings/list', settings);
    return res.data;
  },
  getDepartments: async (): Promise<Department[]> => {
    const res = await apiClient.get<Department[]>('/departments');
    return res.data;
  },
  createDepartment: async (dept: Partial<Department>): Promise<Department> => {
    const res = await apiClient.post<Department>('/departments', dept);
    return res.data;
  },
  updateDepartment: async (id: string, dept: Partial<Department>): Promise<Department> => {
    const res = await apiClient.patch<Department>(`/departments/${id}`, dept);
    return res.data;
  },
  deleteDepartment: async (id: string, reassignToDeptName?: string): Promise<{ id: string; success: boolean }> => {
    const res = await apiClient.delete<{ id: string; success: boolean }>(`/departments/${id}`, {
      data: { reassignToDeptName },
    });
    return res.data;
  },
};

export const rolesApi = {
  getAll: async (): Promise<WorkspaceRole[]> => {
    const res = await apiClient.get<WorkspaceRole[]>('/roles');
    return res.data;
  },
  getEffectivePermissions: async (): Promise<RolePermissions> => {
    const res = await apiClient.get<RolePermissions>('/roles/effective-permissions');
    return res.data;
  },
  getById: async (id: string): Promise<WorkspaceRole> => {
    const res = await apiClient.get<WorkspaceRole>(`/roles/${id}`);
    return res.data;
  },
  create: async (role: Partial<WorkspaceRole>): Promise<WorkspaceRole> => {
    const res = await apiClient.post<WorkspaceRole>('/roles', role);
    return res.data;
  },
  update: async (id: string, role: Partial<WorkspaceRole>): Promise<WorkspaceRole> => {
    const res = await apiClient.patch<WorkspaceRole>(`/roles/${id}`, role);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string; success: boolean }> => {
    const res = await apiClient.delete<{ id: string; success: boolean }>(`/roles/${id}`);
    return res.data;
  },
  duplicate: async (id: string): Promise<WorkspaceRole> => {
    const res = await apiClient.post<WorkspaceRole>(`/roles/${id}/duplicate`);
    return res.data;
  },
  getPermissionsCatalog: async () => {
    const res = await apiClient.get('/roles/permissions/catalog');
    return res.data;
  },
};

export const pluginsApi = {
  getPlugins: async (): Promise<{ plugins: any[]; enabledPlugins: Record<string, boolean> }> => {
    const res = await apiClient.get('/plugins');
    return res.data;
  },
  togglePlugin: async (id: string, enabled: boolean): Promise<{ success: boolean; enabledPlugins: Record<string, boolean> }> => {
    const res = await apiClient.post(`/plugins/${id}/toggle`, { enabled });
    return res.data;
  },
};

export const docsApi = {
  getFolders: async (): Promise<DocFolder[]> => {
    const res = await apiClient.get<DocFolder[]>('/docs/folders');
    return res.data;
  },
  createFolder: async (data: Partial<DocFolder>): Promise<DocFolder> => {
    const res = await apiClient.post<DocFolder>('/docs/folders', data);
    return res.data;
  },
  updateFolder: async (id: string, data: Partial<DocFolder>): Promise<DocFolder> => {
    const res = await apiClient.patch<DocFolder>(`/docs/folders/${id}`, data);
    return res.data;
  },
  deleteFolder: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/docs/folders/${id}`);
    return res.data;
  },
  getAll: async (params?: { folderId?: string; listId?: string }): Promise<DocItem[]> => {
    const res = await apiClient.get<DocItem[]>('/docs', { params });
    return res.data;
  },
  getById: async (id: string): Promise<DocItem> => {
    const res = await apiClient.get<DocItem>(`/docs/${id}`);
    return res.data;
  },
  create: async (data: Partial<DocItem>): Promise<DocItem> => {
    const res = await apiClient.post<DocItem>('/docs', data);
    return res.data;
  },
  update: async (id: string, data: Partial<DocItem>): Promise<DocItem> => {
    const res = await apiClient.patch<DocItem>(`/docs/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/docs/${id}`);
    return res.data;
  },
};

