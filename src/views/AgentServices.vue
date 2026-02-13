<template>
  <div>
    <n-space vertical size="large">
      <n-space justify="space-between">
        <n-h2 style="margin: 0">智能体服务管理</n-h2>
        <n-button type="primary" @click="showModal(true)">新增</n-button>
      </n-space>
      <n-alert type="info" style="margin-bottom: 8px">
        管理智能体相关服务：服务地址、前端地址、后端 API、Python 环境等。
      </n-alert>
      <n-data-table
        :columns="columns"
        :data="list"
        :loading="loading"
        :row-key="(r: AgentService) => r.id"
        bordered
      />

      <n-modal v-model:show="modalVisible" preset="card" title="智能体服务" style="width: 560px" @after-leave="form = getEmptyForm()">
        <n-form :model="form" label-placement="left" label-width="120">
          <n-form-item label="名称" required>
            <n-input v-model:value="form.name" placeholder="服务名称" />
          </n-form-item>
          <n-form-item label="服务地址">
            <n-input v-model:value="form.service_url" placeholder="http(s)://..." />
          </n-form-item>
          <n-form-item label="前端地址">
            <n-input v-model:value="form.frontend_url" placeholder="前端访问地址" />
          </n-form-item>
          <n-form-item label="后端 API 地址">
            <n-input v-model:value="form.backend_api_url" placeholder="API 根地址" />
          </n-form-item>
          <n-form-item label="Python 环境路径">
            <n-input v-model:value="form.python_env_path" placeholder="如 /venv/bin/python 或 conda 环境名" />
          </n-form-item>
          <n-form-item label="备注">
            <n-input v-model:value="form.remark" type="textarea" :rows="2" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="modalVisible = false">取消</n-button>
            <n-button type="primary" @click="submit">保存</n-button>
          </n-space>
        </template>
      </n-modal>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NButton, NSpace, useMessage } from 'naive-ui';
import { agentServicesApi, type AgentService } from '../api';

const message = useMessage();
const list = ref<AgentService[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref(getEmptyForm());

function getEmptyForm() {
  return {
    name: '',
    service_url: '',
    frontend_url: '',
    backend_api_url: '',
    python_env_path: '',
    remark: '',
  };
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '名称', key: 'name', width: 120 },
  { title: '服务地址', key: 'service_url', ellipsis: true },
  { title: '前端地址', key: 'frontend_url', ellipsis: true },
  { title: '后端 API', key: 'backend_api_url', ellipsis: true },
  { title: 'Python 环境', key: 'python_env_path', ellipsis: true },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row: AgentService) =>
      h(NSpace, {}, () => [
        h(NButton, { size: 'small', onClick: () => showModal(false, row) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => doDelete(row.id) }, () => '删除'),
      ]),
  },
];

async function load() {
  loading.value = true;
  try {
    list.value = await agentServicesApi.list();
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function showModal(isNew: boolean, row?: AgentService) {
  editingId.value = isNew ? null : (row?.id ?? null);
  if (row) {
    form.value = {
      name: row.name,
      service_url: row.service_url ?? '',
      frontend_url: row.frontend_url ?? '',
      backend_api_url: row.backend_api_url ?? '',
      python_env_path: row.python_env_path ?? '',
      remark: row.remark ?? '',
    };
  } else {
    form.value = getEmptyForm();
  }
  modalVisible.value = true;
}

async function submit() {
  try {
    if (editingId.value) {
      await agentServicesApi.update(editingId.value, form.value);
      message.success('已更新');
    } else {
      await agentServicesApi.create(form.value);
      message.success('已添加');
    }
    modalVisible.value = false;
    load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

async function doDelete(id: number) {
  try {
    await agentServicesApi.delete(id);
    message.success('已删除');
    load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

onMounted(load);
</script>
