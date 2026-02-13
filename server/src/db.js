import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'aioamg.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 22,
    username TEXT NOT NULL,
    password TEXT,
    private_key TEXT,
    name TEXT NOT NULL,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS server_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    port INTEGER,
    status TEXT DEFAULT 'unknown',
    config_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service_url TEXT,
    frontend_url TEXT,
    backend_api_url TEXT,
    python_env_path TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    system_prompt TEXT,
    model TEXT DEFAULT 'gpt-4o-mini',
    api_key_env TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;

export const serverQueries = {
  list: () => db.prepare('SELECT * FROM servers ORDER BY id').all(),
  get: (id) => db.prepare('SELECT * FROM servers WHERE id = ?').get(id),
  create: (row) => {
    const r = db.prepare(
      'INSERT INTO servers (host, port, username, password, private_key, name, remark) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(row.host, row.port ?? 22, row.username, row.password ?? null, row.private_key ?? null, row.name, row.remark ?? null);
    return r.lastInsertRowid;
  },
  update: (id, row) => {
    db.prepare(
      'UPDATE servers SET host=?, port=?, username=?, password=?, private_key=?, name=?, remark=? WHERE id=?'
    ).run(row.host, row.port ?? 22, row.username, row.password ?? null, row.private_key ?? null, row.name, row.remark ?? null, id);
    return id;
  },
  delete: (id) => db.prepare('DELETE FROM servers WHERE id = ?').run(id),
};

export const serverServiceQueries = {
  listByServer: (serverId) => db.prepare('SELECT * FROM server_services WHERE server_id = ? ORDER BY id').all(serverId),
  get: (id) => db.prepare('SELECT * FROM server_services WHERE id = ?').get(id),
  create: (row) => {
    const r = db.prepare(
      'INSERT INTO server_services (server_id, name, type, port, status, config_json) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(row.server_id, row.name, row.type, row.port ?? null, row.status ?? 'unknown', row.config_json ?? null);
    return r.lastInsertRowid;
  },
  update: (id, row) => {
    db.prepare(
      'UPDATE server_services SET name=?, type=?, port=?, status=?, config_json=? WHERE id=?'
    ).run(row.name, row.type, row.port ?? null, row.status ?? 'unknown', row.config_json ?? null, id);
    return id;
  },
  delete: (id) => db.prepare('DELETE FROM server_services WHERE id = ?').run(id),
};

export const agentServiceQueries = {
  list: () => db.prepare('SELECT * FROM agent_services ORDER BY id').all(),
  get: (id) => db.prepare('SELECT * FROM agent_services WHERE id = ?').get(id),
  create: (row) => {
    const r = db.prepare(
      'INSERT INTO agent_services (name, service_url, frontend_url, backend_api_url, python_env_path, remark) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(row.name, row.service_url ?? null, row.frontend_url ?? null, row.backend_api_url ?? null, row.python_env_path ?? null, row.remark ?? null);
    return r.lastInsertRowid;
  },
  update: (id, row) => {
    db.prepare(
      'UPDATE agent_services SET name=?, service_url=?, frontend_url=?, backend_api_url=?, python_env_path=?, remark=? WHERE id=?'
    ).run(row.name, row.service_url ?? null, row.frontend_url ?? null, row.backend_api_url ?? null, row.python_env_path ?? null, row.remark ?? null, id);
    return id;
  },
  delete: (id) => db.prepare('DELETE FROM agent_services WHERE id = ?').run(id),
};

export const agentConfigQueries = {
  list: () => db.prepare('SELECT * FROM agent_configs ORDER BY id').all(),
  get: (id) => db.prepare('SELECT * FROM agent_configs WHERE id = ?').get(id),
  create: (row) => {
    const r = db.prepare(
      'INSERT INTO agent_configs (name, system_prompt, model, api_key_env) VALUES (?, ?, ?, ?)'
    ).run(row.name, row.system_prompt ?? null, row.model ?? 'gpt-4o-mini', row.api_key_env ?? null);
    return r.lastInsertRowid;
  },
  update: (id, row) => {
    db.prepare(
      'UPDATE agent_configs SET name=?, system_prompt=?, model=?, api_key_env=? WHERE id=?'
    ).run(row.name, row.system_prompt ?? null, row.model ?? 'gpt-4o-mini', row.api_key_env ?? null, id);
    return id;
  },
  delete: (id) => db.prepare('DELETE FROM agent_configs WHERE id = ?').run(id),
};
