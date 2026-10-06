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
  AuthResponse,
  User,
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

// Automatically inject JWT Bearer token into outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('backnode_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
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
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

export const tasksApi = {
  getAll: async (params?: { status?: string; priority?: string; assigneeId?: string }): Promise<TaskItem[]> => {
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
};
