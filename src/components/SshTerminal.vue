<template>
  <div ref="terminalContainer" class="terminal-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getSshWsUrl } from '../api';

const props = defineProps<{ serverId: number }>();
const terminalContainer = ref<HTMLElement | null>(null);

let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let socket: WebSocket | null = null;

function connect() {
  if (!terminalContainer.value || !props.serverId) return;

  const url = getSshWsUrl(props.serverId);
  socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';

  socket.onopen = () => {
    term?.write('*** 已连接 SSH 代理 ***\r\n');
    setTimeout(() => fitAddon?.fit(), 100);
  };

  socket.onmessage = (ev) => {
    if (term && ev.data) {
      const data =
        typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer);
      term.write(data);
    }
  };

  socket.onclose = () => {
    term?.write('\r\n*** 连接已关闭 ***\r\n');
  };

  socket.onerror = () => {
    term?.write('\r\n*** WebSocket Error ***\r\n');
  };
}

function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

function handleResize() {
  fitAddon?.fit();
}

onMounted(() => {
  if (!terminalContainer.value) return;

  term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 14,
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
    },
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalContainer.value);
  fitAddon.fit();

  // From Terminal to WebSocket（只注册一次，与参考一致）
  term.onData((data) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(data);
  });

  if (props.serverId) connect();
  else term.write('*** 请选择服务器后连接 ***\r\n');

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  disconnect();
  term?.dispose();
  term = null;
  fitAddon = null;
});

watch(
  () => props.serverId,
  (id) => {
    disconnect();
    if (id && term) connect();
  }
);
</script>

<style scoped>
.terminal-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #1e1e1e;
  padding: 10px;
  border-radius: 4px;
}

.terminal-container :deep(.xterm) {
  height: 100%;
}
</style>
