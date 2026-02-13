import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

function filePath(name) {
  return join(dataDir, `${name}.json`);
}

function readArray(name) {
  const path = filePath(name);
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeArray(name, arr) {
  writeFileSync(filePath(name), JSON.stringify(arr, null, 2), 'utf8');
}

function nextId(arr) {
  if (arr.length === 0) return 1;
  return Math.max(...arr.map((x) => x.id)) + 1;
}

function now() {
  return new Date().toISOString();
}

export const serverQueries = {
  list: () => readArray('servers').sort((a, b) => a.id - b.id),
  get: (id) => readArray('servers').find((x) => x.id === id),
  create: (row) => {
    const arr = readArray('servers');
    const id = nextId(arr);
    arr.push({
      id,
      host: row.host,
      port: row.port ?? 22,
      username: row.username,
      password: row.password ?? null,
      private_key: row.private_key ?? null,
      name: row.name,
      remark: row.remark ?? null,
      created_at: now(),
    });
    writeArray('servers', arr);
    return id;
  },
  update: (id, row) => {
    const arr = readArray('servers');
    const i = arr.findIndex((x) => x.id === id);
    if (i === -1) return;
    arr[i] = { ...arr[i], ...row, id };
    writeArray('servers', arr);
    return id;
  },
  delete: (id) => {
    const arr = readArray('servers').filter((x) => x.id !== id);
    writeArray('servers', arr);
  },
};

export const serverServiceQueries = {
  listByServer: (serverId) =>
    readArray('server_services')
      .filter((x) => x.server_id === serverId)
      .sort((a, b) => a.id - b.id),
  get: (id) => readArray('server_services').find((x) => x.id === id),
  create: (row) => {
    const arr = readArray('server_services');
    const id = nextId(arr);
    arr.push({
      id,
      server_id: row.server_id,
      name: row.name,
      type: row.type,
      port: row.port ?? null,
      status: row.status ?? 'unknown',
      config_json: row.config_json ?? null,
      created_at: now(),
    });
    writeArray('server_services', arr);
    return id;
  },
  update: (id, row) => {
    const arr = readArray('server_services');
    const i = arr.findIndex((x) => x.id === id);
    if (i === -1) return;
    arr[i] = { ...arr[i], ...row, id };
    writeArray('server_services', arr);
    return id;
  },
  delete: (id) => {
    const arr = readArray('server_services').filter((x) => x.id !== id);
    writeArray('server_services', arr);
  },
};

export const agentServiceQueries = {
  list: () => readArray('agent_services').sort((a, b) => a.id - b.id),
  get: (id) => readArray('agent_services').find((x) => x.id === id),
  create: (row) => {
    const arr = readArray('agent_services');
    const id = nextId(arr);
    arr.push({
      id,
      name: row.name,
      service_url: row.service_url ?? null,
      frontend_url: row.frontend_url ?? null,
      backend_api_url: row.backend_api_url ?? null,
      python_env_path: row.python_env_path ?? null,
      remark: row.remark ?? null,
      created_at: now(),
    });
    writeArray('agent_services', arr);
    return id;
  },
  update: (id, row) => {
    const arr = readArray('agent_services');
    const i = arr.findIndex((x) => x.id === id);
    if (i === -1) return;
    arr[i] = { ...arr[i], ...row, id };
    writeArray('agent_services', arr);
    return id;
  },
  delete: (id) => {
    const arr = readArray('agent_services').filter((x) => x.id !== id);
    writeArray('agent_services', arr);
  },
};

export const agentConfigQueries = {
  list: () => readArray('agent_configs').sort((a, b) => a.id - b.id),
  get: (id) => readArray('agent_configs').find((x) => x.id === id),
  create: (row) => {
    const arr = readArray('agent_configs');
    const id = nextId(arr);
    arr.push({
      id,
      name: row.name,
      system_prompt: row.system_prompt ?? null,
      model: row.model ?? 'gpt-4o-mini',
      api_key_env: row.api_key_env ?? null,
      created_at: now(),
    });
    writeArray('agent_configs', arr);
    return id;
  },
  update: (id, row) => {
    const arr = readArray('agent_configs');
    const i = arr.findIndex((x) => x.id === id);
    if (i === -1) return;
    arr[i] = { ...arr[i], ...row, id };
    writeArray('agent_configs', arr);
    return id;
  },
  delete: (id) => {
    const arr = readArray('agent_configs').filter((x) => x.id !== id);
    writeArray('agent_configs', arr);
  },
};
