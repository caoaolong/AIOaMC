const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const serversApi = {
  list: () => request<Array<Server>>('/servers'),
  get: (id: number) => request<Server>(`/servers/${id}`),
  create: (body: Partial<Server>) => request<{ id: number }>('/servers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Server>) => request<{ ok: boolean }>(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: number) => request<{ ok: boolean }>(`/servers/${id}`, { method: 'DELETE' }),
};

export const serverServicesApi = {
  list: (serverId: number) => request<Array<ServerService>>(`/servers/${serverId}/services`),
  create: (serverId: number, body: Partial<ServerService>) => request<{ id: number }>(`/servers/${serverId}/services`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<ServerService>) => request<{ ok: boolean }>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: number) => request<{ ok: boolean }>(`/services/${id}`, { method: 'DELETE' }),
};

export const agentServicesApi = {
  list: () => request<Array<AgentService>>('/agent-services'),
  get: (id: number) => request<AgentService>(`/agent-services/${id}`),
  create: (body: Partial<AgentService>) => request<{ id: number }>('/agent-services', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<AgentService>) => request<{ ok: boolean }>(`/agent-services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: number) => request<{ ok: boolean }>(`/agent-services/${id}`, { method: 'DELETE' }),
};

export const agentConfigsApi = {
  list: () => request<Array<AgentConfig>>('/agent-configs'),
  get: (id: number) => request<AgentConfig>(`/agent-configs/${id}`),
  create: (body: Partial<AgentConfig>) => request<{ id: number }>('/agent-configs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<AgentConfig>) => request<{ ok: boolean }>(`/agent-configs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: number) => request<{ ok: boolean }>(`/agent-configs/${id}`, { method: 'DELETE' }),
};

export const agentChatApi = {
  chat: (configId: number, message: string, apiKey?: string) =>
    request<{ content: string; role: string }>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ configId, message, apiKey }),
    }),
};

export function getSshWsUrl(serverId: number): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ssh?serverId=${serverId}`;
}

export interface Server {
  id: number;
  host: string;
  port: number;
  username: string;
  password: string | null;
  private_key: string | null;
  name: string;
  remark: string | null;
  created_at?: string;
}

export interface ServerService {
  id: number;
  server_id: number;
  name: string;
  type: string;
  port: number | null;
  status: string;
  config_json: string | null;
  created_at?: string;
}

export interface AgentService {
  id: number;
  name: string;
  service_url: string | null;
  frontend_url: string | null;
  backend_api_url: string | null;
  python_env_path: string | null;
  remark: string | null;
  created_at?: string;
}

export interface AgentConfig {
  id: number;
  name: string;
  system_prompt: string | null;
  model: string;
  api_key_env: string | null;
  created_at?: string;
}
