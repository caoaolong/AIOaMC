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
    readyTimeout: 30000,
    // 兼容部分服务器（如老版本 OpenSSH、内网机）的算法
    algorithms: {
      kex: [
        'ecdh-sha2-nistp256',
        'ecdh-sha2-nistp384',
        'ecdh-sha2-nistp521',
        'diffie-hellman-group-exchange-sha256',
        'diffie-hellman-group14-sha256',
        'diffie-hellman-group14-sha1',
      ],
      cipher: [
        'aes128-ctr',
        'aes192-ctr',
        'aes256-ctr',
        'aes128-gcm',
        'aes256-gcm',
        'aes128-cbc',
        'aes256-cbc',
        '3des-cbc',
      ],
      serverHostKey: [
        'ssh-ed25519',
        'ecdsa-sha2-nistp256',
        'ecdsa-sha2-nistp384',
        'ecdsa-sha2-nistp521',
        'ssh-rsa',
      ],
    },
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
    conn.shell((err, stream) => {
      if (err) {
        ws.send('\r\n*** SSH Shell Error: ' + err.message + ' ***\r\n');
        ws.close();
        conn.end();
        return;
      }

      // From SSH to WebSocket
      stream.on('data', (data) => {
        if (ws.readyState === 1) ws.send(data.toString());
      });

      stream.on('close', () => {
        conn.end();
        if (ws.readyState === 1) ws.close();
      });

      // From WebSocket to SSH
      ws.on('message', (message) => {
        if (stream.writable) stream.write(message.toString());
      });

      ws.on('close', () => {
        conn.end();
      });
    });
  }).on('error', (err) => {
    const msg = err.message || String(err);
    ws.send('\r\n*** SSH Connection Error: ' + msg + ' ***\r\n');
    if (process.env.DEBUG_SSH) console.error('[SSH]', config.host, config.username, err);
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
