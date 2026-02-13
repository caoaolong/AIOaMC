import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  serverQueries,
  serverServiceQueries,
  agentServiceQueries,
  agentConfigQueries,
} from './store.js';
import { handleSshConnection } from './ssh-proxy.js';
import { chatWithAgent } from './agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const PORT = 3001;
const WS_PATH = '/ssh';

// ---------- 服务器 CRUD ----------
app.get('/api/servers', (req, res) => {
  try {
    const list = serverQueries.list();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/servers/:id', (req, res) => {
  const row = serverQueries.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: '不存在' });
  res.json(row);
});

app.post('/api/servers', (req, res) => {
  try {
    const id = serverQueries.create(req.body);
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/servers/:id', (req, res) => {
  try {
    serverQueries.update(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/servers/:id', (req, res) => {
  try {
    serverQueries.delete(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- 服务器下的服务管理 ----------
app.get('/api/servers/:id/services', (req, res) => {
  try {
    const list = serverServiceQueries.listByServer(Number(req.params.id));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/servers/:id/services', (req, res) => {
  try {
    const id = serverServiceQueries.create({ ...req.body, server_id: Number(req.params.id) });
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/services/:sid', (req, res) => {
  try {
    serverServiceQueries.update(Number(req.params.sid), req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/services/:sid', (req, res) => {
  try {
    serverServiceQueries.delete(Number(req.params.sid));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- 智能体服务管理 ----------
app.get('/api/agent-services', (req, res) => {
  try {
    const list = agentServiceQueries.list();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/agent-services/:id', (req, res) => {
  const row = agentServiceQueries.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: '不存在' });
  res.json(row);
});

app.post('/api/agent-services', (req, res) => {
  try {
    const id = agentServiceQueries.create(req.body);
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/agent-services/:id', (req, res) => {
  try {
    agentServiceQueries.update(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/agent-services/:id', (req, res) => {
  try {
    agentServiceQueries.delete(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- 运维智能体配置 ----------
app.get('/api/agent-configs', (req, res) => {
  try {
    const list = agentConfigQueries.list();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/agent-configs/:id', (req, res) => {
  const row = agentConfigQueries.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: '不存在' });
  res.json(row);
});

app.post('/api/agent-configs', (req, res) => {
  try {
    const id = agentConfigQueries.create(req.body);
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/agent-configs/:id', (req, res) => {
  try {
    agentConfigQueries.update(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/agent-configs/:id', (req, res) => {
  try {
    agentConfigQueries.delete(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- 运维智能体对话 ----------
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { configId, message, apiKey } = req.body;
    const result = await chatWithAgent(configId, message, apiKey);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- WebSocket SSH 隧道（xterm 用）：HTTP upgrade 到 /ssh ----------
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname === '/ssh') {
    const serverId = new URL(request.url || '', `http://${request.headers.host}`).searchParams.get('serverId');
    if (!serverId) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      handleSshConnection(ws, serverId);
    });
  } else {
    socket.destroy();
  }
});

// 静态前端（生产时可交给 nginx）
app.use(express.static(join(__dirname, '..', '..', 'dist')));

httpServer.listen(PORT, () => {
  console.log(`API + WebSocket 运行在 http://localhost:${PORT}`);
  console.log(`SSH WebSocket: ws://localhost:${PORT}${WS_PATH}?serverId=xxx`);
});
