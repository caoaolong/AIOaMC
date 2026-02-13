import { Client } from 'ssh2';
import { serverQueries } from './store.js';

function getServerConfig(serverId) {
  const row = serverQueries.get(Number(serverId));
  if (!row) return null;

  const password = row.password && String(row.password).trim() ? row.password : undefined;
  let privateKey = row.private_key && String(row.private_key).trim() ? row.private_key : undefined;
  if (privateKey && typeof privateKey === 'string') privateKey = privateKey.trim();

  const config = {
    host: row.host,
    port: Number(row.port) || 22,
    username: row.username,
  };

  if (privateKey) config.privateKey = privateKey;
  if (password) config.password = password;

  if (password) {
    config.tryKeyboard = true;
    config.onKeyboardInteractive = (name, instr, lang, prompts, finish) => {
      finish(prompts.map(() => password));
    };
  }

  return config;
}

/**
 * 处理 WebSocket 连接：创建 SSH 连接，建立 shell 流与 ws 的双向绑定
 * 参考：ws 连接 -> SSH Client -> shell -> stream <-> ws
 */
export function handleSshConnection(ws, serverId) {
  const config = getServerConfig(serverId);
  if (!config) {
    ws.send('\r\n*** 服务器不存在 ***\r\n');
    ws.close();
    return;
  }

  const conn = new Client();

  conn.on('ready', () => {
    conn.shell({ term: 'xterm-256color' }, (err, stream) => {
      if (err) {
        ws.send('\r\n*** SSH Shell 错误: ' + err.message + ' ***\r\n');
        ws.close();
        conn.end();
        return;
      }

      // SSH stream -> WebSocket
      stream.on('data', (data) => {
        if (ws.readyState === 1) ws.send(data.toString());
      });

      stream.on('close', () => {
        conn.end();
        if (ws.readyState === 1) ws.close();
      });

      // WebSocket -> SSH stream
      ws.on('message', (message) => {
        const data = Buffer.isBuffer(message) ? message : Buffer.from(message);
        if (stream.writable) stream.write(data.toString());
      });

      ws.on('close', () => {
        conn.end();
      });
    });
  }).on('error', (err) => {
    ws.send('\r\n*** SSH 连接错误: ' + err.message + ' ***\r\n');
    ws.close();
  }).connect(config);
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
