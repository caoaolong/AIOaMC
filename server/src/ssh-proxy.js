import { Client } from 'ssh2';
import { serverQueries } from './db.js';

const conns = new Map();

function getServerConfig(serverId) {
  const row = serverQueries.get(Number(serverId));
  if (!row) return null;
  return {
    host: row.host,
    port: row.port,
    username: row.username,
    password: row.password || undefined,
    privateKey: row.private_key || undefined,
  };
}

export function createSshStream(serverId, onStream) {
  const config = getServerConfig(serverId);
  if (!config) {
    onStream(new Error('服务器不存在'));
    return;
  }

  const conn = new Client();
  conn.on('ready', () => {
    conn.shell({ term: 'xterm-256color' }, (err, stream) => {
      if (err) {
        onStream(err);
        conn.end();
        return;
      }
      conns.set(serverId, { conn, stream });
      onStream(null, stream);
    });
  }).on('error', (err) => {
    onStream(err);
  }).connect(config);
}

export function sendToSsh(serverId, data) {
  const entry = conns.get(String(serverId));
  if (entry && entry.stream && entry.stream.writable) {
    entry.stream.write(data);
  }
}

export function closeSsh(serverId) {
  const entry = conns.get(String(serverId));
  if (entry) {
    conns.delete(String(serverId));
    try {
      entry.conn.end();
    } catch (_) {}
  }
}

export function runCommand(serverId, command, callback) {
  const config = getServerConfig(serverId);
  if (!config) {
    callback(new Error('服务器不存在'));
    return;
  }

  const conn = new Client();
  conn.on('ready', () => {
    conn.exec(command, (err, stream) => {
      if (err) {
        callback(err);
        conn.end();
        return;
      }
      let out = '';
      let errOut = '';
      stream.on('data', (data) => { out += data.toString(); });
      stream.stderr.on('data', (data) => { errOut += data.toString(); });
      stream.on('close', (code) => {
        conn.end();
        callback(null, { stdout: out, stderr: errOut, code });
      });
    });
  }).on('error', (err) => callback(err)).connect(config);
}
