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
} from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status} on ${endpoint}: ${errorText}`);
  }

  return response.json();
}

export const tasksApi = {
  getAll: (params?: { status?: string; priority?: string; assigneeId?: string }): Promise<TaskItem[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<TaskItem[]>(`/tasks${queryString}`);
  },
  getById: (id: string): Promise<TaskItem> => request<TaskItem>(`/tasks/${id}`),
  create: (task: Partial<TaskItem>): Promise<TaskItem> =>
    request<TaskItem>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  update: (id: string, task: Partial<TaskItem>): Promise<TaskItem> =>
    request<TaskItem>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(task),
    }),
  delete: (id: string): Promise<{ id: string }> =>
    request<{ id: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

export const dealsApi = {
  getAll: (pipelineId?: string): Promise<CrmDeal[]> => {
    const query = pipelineId ? `?pipelineId=${encodeURIComponent(pipelineId)}` : '';
    return request<CrmDeal[]>(`/deals${query}`);
  },
  getById: (id: string): Promise<CrmDeal> => request<CrmDeal>(`/deals/${id}`),
  create: (deal: Partial<CrmDeal>): Promise<CrmDeal> =>
    request<CrmDeal>('/deals', {
      method: 'POST',
      body: JSON.stringify(deal),
    }),
  update: (id: string, deal: Partial<CrmDeal>): Promise<CrmDeal> =>
    request<CrmDeal>(`/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(deal),
    }),
  delete: (id: string): Promise<{ id: string }> =>
    request<{ id: string }>(`/deals/${id}`, {
      method: 'DELETE',
    }),
};

export const pipelinesApi = {
  getAll: (): Promise<CrmPipeline[]> => request<CrmPipeline[]>('/pipelines'),
  create: (pipeline: Partial<CrmPipeline>): Promise<CrmPipeline> =>
    request<CrmPipeline>('/pipelines', {
      method: 'POST',
      body: JSON.stringify(pipeline),
    }),
  getStages: (): Promise<CrmStageDefinition[]> => request<CrmStageDefinition[]>('/pipelines/stages'),
  updateStages: (stages: CrmStageDefinition[]): Promise<CrmStageDefinition[]> =>
    request<CrmStageDefinition[]>('/pipelines/stages', {
      method: 'PUT',
      body: JSON.stringify(stages),
    }),
  getSettings: (): Promise<CrmPipelineSettings> => request<CrmPipelineSettings>('/pipelines/settings'),
  updateSettings: (settings: Partial<CrmPipelineSettings>): Promise<CrmPipelineSettings> =>
    request<CrmPipelineSettings>('/pipelines/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

export const membersApi = {
  getAll: (): Promise<TeamMember[]> => request<TeamMember[]>('/members'),
  create: (member: Partial<TeamMember>): Promise<TeamMember> =>
    request<TeamMember>('/members', {
      method: 'POST',
      body: JSON.stringify(member),
    }),
};

export const contactsApi = {
  getAll: (): Promise<DirectoryContact[]> => request<DirectoryContact[]>('/contacts'),
  create: (contact: Partial<DirectoryContact>): Promise<DirectoryContact> =>
    request<DirectoryContact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
  update: (id: string, contact: Partial<DirectoryContact>): Promise<DirectoryContact> =>
    request<DirectoryContact>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(contact),
    }),
  delete: (id: string): Promise<{ id: string }> =>
    request<{ id: string }>(`/contacts/${id}`, {
      method: 'DELETE',
    }),
};

export const workspaceApi = {
  getFolders: (): Promise<SpaceFolder[]> => request<SpaceFolder[]>('/folders'),
  createFolder: (folder: Partial<SpaceFolder>): Promise<SpaceFolder> =>
    request<SpaceFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify(folder),
    }),
  updateFolder: (id: string, folder: Partial<SpaceFolder>): Promise<SpaceFolder> =>
    request<SpaceFolder>(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(folder),
    }),
  deleteFolder: (id: string): Promise<{ id: string }> =>
    request<{ id: string }>(`/folders/${id}`, {
      method: 'DELETE',
    }),
  getStatuses: (): Promise<StatusDefinition[]> => request<StatusDefinition[]>('/statuses'),
  updateStatuses: (statuses: StatusDefinition[]): Promise<StatusDefinition[]> =>
    request<StatusDefinition[]>('/statuses', {
      method: 'PUT',
      body: JSON.stringify(statuses),
    }),
  getListSettings: (): Promise<ListSettings> => request<ListSettings>('/settings/list'),
  updateListSettings: (settings: Partial<ListSettings>): Promise<ListSettings> =>
    request<ListSettings>('/settings/list', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
