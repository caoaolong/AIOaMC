<template>
  <div class="terminal-wrap">
    <div ref="termRef" class="terminal-container"></div>
    <div v-if="status" class="terminal-status">{{ status }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getSshWsUrl } from '../api';

const props = defineProps<{ serverId: number }>();
const termRef = ref<HTMLElement | null>(null);
const status = ref('');

let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;

function connect() {
  if (!termRef.value || !props.serverId) return;
  status.value = '正在连接...';
  const url = getSshWsUrl(props.serverId);
  ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    status.value = '已连接';
    setTimeout(() => fitAddon?.fit(), 100);
  };
  ws.onmessage = (ev) => {
    if (term && ev.data) {
      const data = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer);
      term.write(data);
    }
  };
  ws.onerror = () => {
    status.value = '连接错误';
  };
  ws.onclose = () => {
    status.value = '已断开';
  };
}

function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
  status.value = '';
}

onMounted(() => {
  if (!termRef.value) return;
  term = new Terminal({
    cursorBlink: true,
    theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
    fontSize: 14,
  });
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(termRef.value);
  term.onData((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
  });
  if (props.serverId) connect();
});

onUnmounted(() => {
  disconnect();
  term?.dispose();
  term = null;
  fitAddon = null;
});

watch(() => props.serverId, (id) => {
  disconnect();
  if (id && term) connect();
});
</script>

<style scoped>
.terminal-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
}
.terminal-container {
  flex: 1;
  padding: 8px;
  background: #1e1e1e;
  border-radius: 8px;
}
.terminal-container :deep(.xterm) {
  height: 100%;
}
.terminal-status {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}
</style>
