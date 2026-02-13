<template>
  <div class="agent-page">
    <n-space vertical size="large">
      <n-h2 style="margin: 0">运维智能体</n-h2>
      <n-alert type="info">
        基于 LangChain 的运维助手，可查询服务器与服务信息。请先在下拉中选择或新增智能体配置，并确保已配置 OpenAI API Key（可在下方输入或设置环境变量）。
      </n-alert>

      <n-space>
        <n-select
          v-model:value="currentConfigId"
          :options="configOptions"
          placeholder="选择智能体配置"
          style="width: 240px"
          @update:value="loadConfig"
        />
        <n-button quaternary @click="showConfigModal(true)">管理配置</n-button>
      </n-space>

      <n-card title="对话" size="small">
        <div ref="chatRef" class="chat-list">
          <div v-for="(msg, i) in messages" :key="i" :class="['chat-item', msg.role]">
            <div class="chat-role">{{ msg.role === 'user' ? '我' : '助手' }}</div>
            <div class="chat-content">{{ msg.content }}</div>
          </div>
        </div>
        <n-space style="margin-top: 12px">
          <n-input
            v-model:value="inputText"
            type="textarea"
            placeholder="输入问题..."
            :rows="2"
            :disabled="loading"
            @keydown.enter.ctrl="send"
          />
          <n-button type="primary" :loading="loading" @click="send">发送</n-button>
        </n-space>
        <n-input
          v-if="!useEnvKey"
          v-model:value="apiKey"
          type="password"
          placeholder="OpenAI API Key（可选，也可用环境变量）"
          show-password-on="click"
          style="margin-top: 8px"
        />
        <n-checkbox v-model:checked="useEnvKey" style="margin-top: 8px">使用环境变量中的 API Key</n-checkbox>
      </n-card>
    </n-space>

    <n-modal v-model:show="configModalVisible" preset="card" title="智能体配置" style="width: 560px">
      <n-data-table :columns="configColumns" :data="configList" :row-key="(r: AgentConfig) => r.id" size="small" bordered />
      <template #footer>
        <n-button @click="showConfigForm(null)">新增配置</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="configFormVisible" preset="card" title="配置" style="width: 500px" @after-leave="configForm = getEmptyConfig()">
      <n-form :model="configForm" label-placement="left" label-width="100">
        <n-form-item label="名称" required>
          <n-input v-model:value="configForm.name" />
        </n-form-item>
        <n-form-item label="模型">
          <n-input v-model:value="configForm.model" placeholder="如 gpt-4o-mini" />
        </n-form-item>
        <n-form-item label="系统提示词">
          <n-input v-model:value="configForm.system_prompt" type="textarea" :rows="4" placeholder="定义助手行为" />
        </n-form-item>
        <n-form-item label="API Key 环境变量名">
          <n-input v-model:value="configForm.api_key_env" placeholder="如 OPENAI_API_KEY" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="configFormVisible = false">取消</n-button>
          <n-button type="primary" @click="saveConfig">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, nextTick } from 'vue';
import { NButton, NSpace, useMessage } from 'naive-ui';
import { agentConfigsApi, agentChatApi, type AgentConfig } from '../api';

const message = useMessage();
const messages = ref<Array<{ role: string; content: string }>>([]);
const inputText = ref('');
const loading = ref(false);
const apiKey = ref('');
const useEnvKey = ref(false);
const currentConfigId = ref<number | null>(null);
const configList = ref<AgentConfig[]>([]);
const configModalVisible = ref(false);
const configFormVisible = ref(false);
const configForm = ref(getEmptyConfig());
const editingConfigId = ref<number | null>(null);
const chatRef = ref<HTMLElement | null>(null);

const configOptions = ref<Array<{ label: string; value: number }>>([]);

const configColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '名称', key: 'name', width: 120 },
  { title: '模型', key: 'model', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row: AgentConfig) =>
      h(NSpace, {}, () => [
        h(NButton, { size: 'small', onClick: () => showConfigForm(row) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => doDeleteConfig(row.id) }, () => '删除'),
      ]),
  },
];

function getEmptyConfig(): Partial<AgentConfig> {
  return { name: '', model: 'gpt-4o-mini', system_prompt: '', api_key_env: '' };
}

async function loadConfigs() {
  try {
    configList.value = await agentConfigsApi.list();
    configOptions.value = configList.value.map((c) => ({ label: c.name, value: c.id }));
  } catch (e) {
    message.error((e as Error).message);
  }
}

function loadConfig() {
  // optional: load selected config details
}

function showConfigModal(open: boolean) {
  configModalVisible.value = open;
  if (open) loadConfigs();
}

function showConfigForm(row: AgentConfig | null) {
  configModalVisible.value = false;
  editingConfigId.value = row?.id ?? null;
  if (row) {
    configForm.value = {
      name: row.name,
      model: row.model,
      system_prompt: row.system_prompt ?? '',
      api_key_env: row.api_key_env ?? '',
    };
  } else {
    configForm.value = getEmptyConfig();
  }
  configFormVisible.value = true;
}

async function saveConfig() {
  try {
    if (editingConfigId.value) {
      await agentConfigsApi.update(editingConfigId.value, configForm.value);
      message.success('已更新');
    } else {
      const r = await agentConfigsApi.create(configForm.value);
      message.success('已添加');
      currentConfigId.value = r.id;
    }
    configFormVisible.value = false;
    loadConfigs();
  } catch (e) {
    message.error((e as Error).message);
  }
}

async function doDeleteConfig(id: number) {
  try {
    await agentConfigsApi.delete(id);
    message.success('已删除');
    loadConfigs();
    if (currentConfigId.value === id) currentConfigId.value = configOptions.value[0]?.value ?? null;
  } catch (e) {
    message.error((e as Error).message);
  }
}

async function send() {
  const text = inputText.value?.trim();
  if (!text) return;
  if (!currentConfigId.value) {
    message.warning('请先选择或创建智能体配置');
    return;
  }
  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  loading.value = true;
  try {
    const key = useEnvKey.value ? undefined : (apiKey.value || undefined);
    const res = await agentChatApi.chat(currentConfigId.value, text, key);
    messages.value.push({ role: res.role || 'assistant', content: res.content });
    nextTick(() => {
      chatRef.value?.scrollTo({ top: chatRef.value.scrollHeight, behavior: 'smooth' });
    });
  } catch (e) {
    message.error((e as Error).message);
    messages.value.push({ role: 'assistant', content: '请求失败：' + (e as Error).message });
  } finally {
    loading.value = false;
  }
}

onMounted(loadConfigs);
</script>

<style scoped>
.agent-page {
  max-width: 800px;
}
.chat-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}
.chat-item {
  margin-bottom: 12px;
}
.chat-item.user .chat-content {
  background: rgba(24, 160, 88, 0.2);
  margin-left: 0;
  margin-right: 40px;
}
.chat-item.assistant .chat-content {
  background: rgba(51, 51, 51, 0.6);
  margin-left: 40px;
  margin-right: 0;
}
.chat-role {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}
.chat-content {
  padding: 8px 12px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
