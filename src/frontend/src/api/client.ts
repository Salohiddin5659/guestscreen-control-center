const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('gs_auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('gs_auth_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('gs_auth_token');
  localStorage.removeItem('gs_user');
}

export function getCurrentUserFromStorage(): { id?: string; username: string; full_name?: string; role: string } | null {
  const userStr = localStorage.getItem('gs_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Сессия истекла. Пожалуйста, войдите снова.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage: string;
    if (Array.isArray(errorData.detail)) {
      // Pydantic validation errors — each item has { msg, loc, type, ctx }
      errorMessage = errorData.detail
        .map((e: any) => {
          const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : '';
          let msg = e.msg || 'Некорректное значение';
          if (e.type === 'string_too_short') {
            msg = `Минимум ${e.ctx?.min_length || 4} символов`;
          }
          const fieldNameMap: Record<string, string> = {
            username: 'Имя пользователя',
            password: 'Пароль',
            role: 'Роль',
            full_name: 'ФИО',
          };
          const translatedField = fieldNameMap[field] || field;
          return translatedField ? `${translatedField}: ${msg}` : msg;
        })
        .join('; ');
    } else if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (errorData.detail && typeof errorData.detail === 'object') {
      errorMessage = Object.values(errorData.detail).join('; ');
    } else {
      errorMessage = errorData.error || `Ошибка сервера (${response.status})`;
    }
    throw new ApiError(response.status, errorMessage, errorData);
  }

  return response.json();
}

// ==========================================
// DATA MODELS & INTERFACES (Strict FastAPI v1)
// ==========================================

export interface Region {
  id: string;
  name: string;
  code: string;
  default_full_screen_block_id?: string | null;
  default_mode32_block_id?: string | null;
}

export interface Branch {
  id: string;
  region_id: string;
  name: string;
  code: string;
  address?: string | null;
  override_full_screen_block_id?: string | null;
  override_mode32_block_id?: string | null;
}

export interface Cashier {
  id: string;
  branch_id: string;
  name: string;
  ip_address: string;
  ssh_port: number;
  ssh_username: string;
  ssh_credential_id?: string | null;
  enabled: boolean;
  override_full_screen_block_id?: string | null;
  override_mode32_block_id?: string | null;
  current_full_screen_block_id?: string | null;
  current_mode32_block_id?: string | null;
  current_content_version?: string | null;
  last_seen_at?: string | null;
  last_sync_status: 'SUCCESS' | 'OFFLINE' | 'FAILED' | 'PENDING' | 'PUBLISHED_AWAITING_RESTART' | string;
  guest_screen_version?: string | null;
  has_ssh_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashierCreateInput {
  branch_id: string;
  name: string;
  ip_address: string;
  ssh_port?: number;
  ssh_username: string;
  ssh_password: string;
  enabled?: boolean;
  override_full_screen_block_id?: string | null;
  override_mode32_block_id?: string | null;
}

export interface CashierUpdateInput {
  branch_id?: string;
  name?: string;
  ip_address?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_password?: string;
  enabled?: boolean;
  override_full_screen_block_id?: string | null;
  override_mode32_block_id?: string | null;
}

export interface ConnectionTestResult {
  online: boolean;
  response_time_ms: number | null;
  inspection: {
    guest_screen_version?: string;
    is_running?: boolean;
    monitors_count?: number;
    has_second_screen?: boolean;
    resolution?: string;
    [key: string]: any;
  } | null;
  error_message: string | null;
}

export interface MediaAsset {
  id: string;
  original_name: string;
  stored_name: string;
  media_type: 'IMAGE' | 'VIDEO';
  mime_type: string;
  size_bytes?: number;
  file_size_bytes?: number;
  sha256: string;
  width: number;
  height: number;
  version: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface TemplateUsageItem {
  id: string;
  name: string;
  area: string;
  display_mode: string;
  is_active: boolean;
}

export interface MediaUsageResponse {
  asset_id: string;
  usage_count: number;
  templates: TemplateUsageItem[];
}

export interface PlaylistItemInput {
  media_asset_id: string;
  order_index: number;
  duration_seconds: number;
}

export interface PlaylistItemResponse {
  id: string;
  media_asset_id: string;
  order_index: number;
  duration_seconds: number;
  media: {
    id: string;
    original_name: string;
    stored_name: string;
    media_type: string;
    width: number;
    height: number;
    s3_key: string;
    version: number;
  } | null;
}

export interface AdvertisingBlockListItem {
  id: string;
  name: string;
  description?: string | null;
  area: 'FULL_SCREEN' | 'MODE32_PROMO';
  display_mode: 'STATIC' | 'SLIDESHOW' | 'VIDEO';
  is_active: boolean;
  version: number;
  items_count: number;
  valid_from?: string | null;
  valid_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvertisingBlockDetail {
  id: string;
  name: string;
  description?: string | null;
  area: 'FULL_SCREEN' | 'MODE32_PROMO';
  display_mode: 'STATIC' | 'SLIDESHOW' | 'VIDEO';
  is_active: boolean;
  version: number;
  valid_from?: string | null;
  valid_to?: string | null;
  created_at: string;
  updated_at: string;
  items: PlaylistItemResponse[];
}

export interface AdvertisingBlockCreateInput {
  name: string;
  description?: string | null;
  area: 'FULL_SCREEN' | 'MODE32_PROMO';
  display_mode: 'STATIC' | 'SLIDESHOW' | 'VIDEO';
  is_active?: boolean;
  valid_from?: string | null;
  valid_to?: string | null;
  items: PlaylistItemInput[];
}

export interface AdvertisingBlockPreview {
  id: string;
  name: string;
  area: string;
  display_mode: string;
  version: number;
  aspect_ratio: string;
  resolution: string;
  scene_guid: string;
  target_area: string;
  raw_json: any;
  slides: Array<{
    order_index: number;
    duration_seconds: number;
    media_url: string;
    s3_key: string;
    original_name: string;
    media_type: string;
    width: number;
    height: number;
  }>;
  media_filenames: string[];
}

export interface PublicationDispatchInput {
  advertising_block_id: string;
  scope_type: 'REGION' | 'BRANCH' | 'CUSTOM_CASHIERS';
  scope_target_ids: string[];
}

export interface PublicationDispatchResponse {
  batch_id: string;
  status: string;
  total_cashiers: number;
  message: string;
}

export interface PublicationJob {
  id: string;
  cashier_id: string;
  cashier_name: string;
  cashier_ip: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'OFFLINE';
  attempt_count: number;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface PublicationBatchDetail {
  batch: {
    id: string;
    advertising_block_id: string;
    scope_type: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_FAILED' | 'FAILED';
    total_cashiers: number;
    success_count: number;
    awaiting_restart_count: number;
    failed_count: number;
    offline_count: number;
    content_snapshot_json?: string;
    started_at: string;
    finished_at?: string | null;
    created_at: string;
  };
  jobs: PublicationJob[];
}

export interface PublicationBatchSummary {
  id: string;
  advertising_block_id: string;
  scope_type: string;
  status: string;
  total_cashiers: number;
  success_count: number;
  awaiting_restart_count: number;
  failed_count: number;
  offline_count: number;
  started_at: string;
  finished_at?: string | null;
  created_at: string;
}

export interface UserAccount {
  id: string;
  username: string;
  full_name?: string | null;
  role: 'ADMINISTRATOR' | 'OPERATOR' | 'AUDITOR' | string;
  is_active: boolean;
  created_at: string;
}

export interface SystemSettings {
  id: number;
  worker_concurrency: number;
  max_concurrent_per_branch: number;
  ssh_connect_timeout_seconds: number;
  ssh_command_timeout_seconds: number;
  sftp_timeout_seconds: number;
  minio_media_retention_days: number;
  cashier_backup_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details?: any;
}

export interface DashboardOverview {
  total_cashiers: number;
  online_cashiers: number;
  offline_cashiers: number;
  awaiting_restart: number;
  active_advertising_blocks: number;
  recent_batches: any[];
}

// ==========================================
// REAL API CLIENT MODULES
// ==========================================

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await apiRequest<{
      access_token: string;
      token_type: string;
      user: { id: string; username: string; full_name?: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(res.access_token);
    localStorage.setItem('gs_user', JSON.stringify(res.user));
    return res;
  },

  me: () =>
    apiRequest<{ id: string; username: string; full_name?: string; role: string }>('/auth/me'),

  logout: () => {
    removeAuthToken();
    localStorage.removeItem('gs_notifications_cleared');
    sessionStorage.clear();
    window.location.href = '/login';
  },
};

export const topologyApi = {
  listRegions: () => apiRequest<Region[]>('/topology/regions'),
  createRegion: (data: { name: string; code: string; default_full_screen_block_id?: string; default_mode32_block_id?: string }) =>
    apiRequest<Region>('/topology/regions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRegion: (id: string, data: { name?: string; code?: string; default_full_screen_block_id?: string; default_mode32_block_id?: string }) =>
    apiRequest<Region>(`/topology/regions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRegion: (id: string) =>
    apiRequest<{ message: string }>(`/topology/regions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  listBranches: (region_id?: string) => {
    const qs = region_id ? `?region_id=${encodeURIComponent(region_id)}` : '';
    return apiRequest<Branch[]>(`/topology/branches${qs}`);
  },
  createBranch: (data: { region_id: string; name: string; code: string; address?: string }) =>
    apiRequest<Branch>('/topology/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBranch: (id: string, data: { region_id?: string; name?: string; code?: string; address?: string }) =>
    apiRequest<Branch>(`/topology/branches/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBranch: (id: string) =>
    apiRequest<{ message: string }>(`/topology/branches/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  listCashiers: (params?: { branch_id?: string; status_filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.branch_id) query.append('branch_id', params.branch_id);
    if (params?.status_filter && params.status_filter !== 'ALL') query.append('status_filter', params.status_filter);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<Cashier[]>(`/topology/cashiers${qs}`);
  },

  getCashier: (id: string) =>
    apiRequest<Cashier>(`/topology/cashiers/${encodeURIComponent(id)}`),

  createCashier: (data: CashierCreateInput) =>
    apiRequest<Cashier>('/topology/cashiers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCashier: (id: string, data: CashierUpdateInput) =>
    apiRequest<Cashier>(`/topology/cashiers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCashier: (id: string) =>
    apiRequest<{ message: string }>(`/topology/cashiers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  testConnection: (id: string) =>
    apiRequest<ConnectionTestResult>(`/topology/cashiers/${encodeURIComponent(id)}/test-connection`, {
      method: 'POST',
    }),
};

export const advertisingApi = {
  list: (area?: 'FULL_SCREEN' | 'MODE32_PROMO') => {
    const qs = area ? `?area=${encodeURIComponent(area)}` : '';
    return apiRequest<AdvertisingBlockListItem[]>(`/advertising-blocks${qs}`);
  },

  get: (id: string) =>
    apiRequest<AdvertisingBlockDetail>(`/advertising-blocks/${encodeURIComponent(id)}`),

  create: (data: AdvertisingBlockCreateInput) =>
    apiRequest<{ id: string; version: number; message: string }>('/advertising-blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AdvertisingBlockCreateInput> & { version?: number }) =>
    apiRequest<{ id: string; version: number; message: string }>(`/advertising-blocks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateItems: (id: string, items: PlaylistItemInput[], version?: number) =>
    apiRequest<{ id: string; version: number; items_count: number; message: string }>(
      `/advertising-blocks/${encodeURIComponent(id)}/items`,
      {
        method: 'PUT',
        body: JSON.stringify({ items, version }),
      }
    ),

  duplicate: (id: string, name?: string) =>
    apiRequest<{ id: string; name: string; version: number; message: string }>(
      `/advertising-blocks/${encodeURIComponent(id)}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify(name ? { name } : {}),
      }
    ),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/advertising-blocks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  preview: (id: string) =>
    apiRequest<AdvertisingBlockPreview>(`/advertising-blocks/${encodeURIComponent(id)}/preview`),
};

export const publicationsApi = {
  list: () => apiRequest<PublicationBatchSummary[]>('/publications'),

  dispatch: (data: PublicationDispatchInput) =>
    apiRequest<PublicationDispatchResponse>('/publications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBatch: (batchId: string) =>
    apiRequest<PublicationBatchDetail>(`/publications/${encodeURIComponent(batchId)}`),

  retryFailed: (batchId: string) =>
    apiRequest<{ retried_count: number; message: string }>(`/publications/${encodeURIComponent(batchId)}/retry`, {
      method: 'POST',
    }),

  subscribeEvents: (batchId: string, onEvent: (event: any) => void): (() => void) => {
    const sseUrl = `${API_BASE}/events/publications/${encodeURIComponent(batchId)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.error('Failed to parse publication SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE connection warning:', err);
    };

    return () => {
      eventSource.close();
    };
  },
};

export const mediaApi = {
  list: (params?: { media_type?: string; search?: string; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.media_type) query.append('media_type', params.media_type);
    if (params?.search) query.append('search', params.search);
    if (params?.skip !== undefined) query.append('skip', String(params.skip));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<MediaAsset[]>(`/media${qs}`);
  },

  get: (id: string) => apiRequest<MediaAsset>(`/media/${encodeURIComponent(id)}`),

  getFileUrl: (id: string) => `${API_BASE}/media/${encodeURIComponent(id)}/file`,

  getThumbnailUrl: (id: string) => `${API_BASE}/media/${encodeURIComponent(id)}/thumbnail`,

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{
      id: string;
      original_name: string;
      stored_name: string;
      size_bytes: number;
      sha256: string;
      width: number;
      height: number;
      mime_type: string;
      warnings?: string[];
      is_duplicate?: boolean;
    }>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiRequest<{
      uploaded_count: number;
      items: Array<{
        id: string;
        original_name: string;
        stored_name: string;
        size_bytes: number;
        sha256: string;
        width: number;
        height: number;
        mime_type: string;
      }>;
      warnings: string[];
    }>('/media/upload-multiple', {
      method: 'POST',
      body: formData,
    });
  },

  delete: (id: string, force?: boolean) =>
    apiRequest<{ message: string; physical_deleted?: boolean }>(
      `/media/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
      {
        method: 'DELETE',
      }
    ),

  getUsage: (id: string) =>
    apiRequest<MediaUsageResponse>(`/media/${encodeURIComponent(id)}/usage`),
};

export const usersApi = {
  list: () => apiRequest<UserAccount[]>('/users'),

  create: (data: { username: string; password: string; full_name?: string; role?: string }) =>
    apiRequest<UserAccount>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { username?: string; password?: string; full_name?: string; role?: string; is_active?: boolean }) =>
    apiRequest<UserAccount>(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

export const settingsApi = {
  get: () => apiRequest<SystemSettings>('/settings'),

  update: (data: Partial<{
    worker_concurrency: number;
    max_concurrent_per_branch: number;
    ssh_connect_timeout_seconds: number;
    ssh_command_timeout_seconds: number;
    sftp_timeout_seconds: number;
    minio_media_retention_days: number;
    cashier_backup_retention_days: number;
  }>) =>
    apiRequest<SystemSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const auditApi = {
  list: (params?: { action?: string; entity_type?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<AuditLog[]>(`/audit-logs${qs}`);
  },
};

export const dashboardApi = {
  getOverview: () => apiRequest<DashboardOverview>('/dashboard/overview'),
};

// ==========================================
// COMPATIBILITY ALIASES FOR AUXILIARY VIEWS
// ==========================================
export type CashboxDevice = any;
export type GroupRegion = Region;
export type GroupBranch = Branch;
export type GlobalConfig = any;
export type DeploymentPreviewResult = any;
export type DeploymentDetails = any;
export type DeploymentStep = any;

export const devicesApi = {
  list: async () => {
    const cashiers = await topologyApi.listCashiers();
    return cashiers.map((c: any) => ({
      ...c,
      ip: c.ip_address,
      computerName: c.name,
      status: c.last_sync_status === 'SUCCESS' ? 'online' : 'offline',
      branch: c.branch_id,
      regionName: 'Ташкент',
      guestScreenRunning: c.last_sync_status === 'SUCCESS',
      version: c.current_content_version ? parseInt(c.current_content_version, 10) : 1,
    }));
  },
  get: (id: string) => topologyApi.getCashier(id),
  upsert: (data: any) => topologyApi.createCashier(data),
  delete: (id: string) => topologyApi.deleteCashier(id),
};

export const groupsApi = {
  listRegions: topologyApi.listRegions,
  createRegion: (data: any) => topologyApi.createRegion(data),
  listBranches: topologyApi.listBranches,
  createBranch: (data: any) => topologyApi.createBranch(data),
};

export const configApi = {
  get: async () => ({
    version: 1,
    idleType: 'image',
    activeBanner: '',
    idleSlides: [],
    idleInterval: 10,
    orderPromoType: 'image',
    orderPromoBanner: '',
    gallerySlides: [],
    galleryInterval: 5,
  }),
  save: async () => ({ success: true, version: 1 }),
};

export const deploymentsApi = {
  getActive: async () => ({ success: true, active: [] }),
  getById: async (id: string) => ({ success: true, deployment: { id, status: 'SUCCESS' }, steps: [] }),
  create: async (data: any) => ({ success: true, deployment_id: 'dep-1' }),
};

