<template>
  <div>
    <n-space vertical size="large">
      <n-page-header @back="router.back()" title="服务管理">
        <template #extra>
          <n-button type="primary" @click="showModal(true)">新增服务</n-button>
        </template>
      </n-page-header>
      <n-descriptions v-if="server" :column="2" bordered>
        <n-descriptions-item label="服务器">{{ server.name }}</n-descriptions-item>
        <n-descriptions-item label="Host">{{ server.host }}:{{ server.port }}</n-descriptions-item>
      </n-descriptions>
      <n-data-table
        :columns="columns"
        :data="list"
        :loading="loading"
        :row-key="(r: ServerService) => r.id"
        bordered
      />

      <n-modal v-model:show="modalVisible" preset="card" title="服务" style="width: 460px" @after-leave="form = getEmptyForm()">
        <n-form :model="form" label-placement="left" label-width="80">
          <n-form-item label="名称" required>
            <n-input v-model:value="form.name" placeholder="如：MySQL、Redis" />
          </n-form-item>
          <n-form-item label="类型" required>
            <n-select v-model:value="form.type" :options="typeOptions" placeholder="选择或输入" filterable tag style="width: 100%" />
          </n-form-item>
          <n-form-item label="端口">
            <n-input-number v-model:value="form.port" :min="1" :max="65535" style="width: 100%" placeholder="可选" />
          </n-form-item>
          <n-form-item label="状态">
            <n-select v-model:value="form.status" :options="statusOptions" />
          </n-form-item>
          <n-form-item label="配置(JSON)">
            <n-input v-model:value="form.config_json" type="textarea" placeholder='{"key":"value"}' :rows="3" />
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
import { ref, h, onMounted, computed } from 'vue';
import { NButton, NSpace, useMessage } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import { serversApi, serverServicesApi, type Server, type ServerService } from '../api';

const message = useMessage();
const route = useRoute();
const router = useRouter();
const serverId = computed(() => Number(route.params.id));
const server = ref<Server | null>(null);
const list = ref<ServerService[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref(getEmptyForm());

const typeOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'Redis', value: 'redis' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MongoDB', value: 'mongodb' },
  { label: 'Nginx', value: 'nginx' },
  { label: '其他', value: 'other' },
];
const statusOptions = [
  { label: '运行中', value: 'running' },
  { label: '已停止', value: 'stopped' },
  { label: '未知', value: 'unknown' },
];

function getEmptyForm() {
  return { name: '', type: 'other', port: null as number | null, status: 'unknown', config_json: '' };
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '名称', key: 'name', width: 120 },
  { title: '类型', key: 'type', width: 100 },
  { title: '端口', key: 'port', width: 80 },
  { title: '状态', key: 'status', width: 90 },
  { title: '配置', key: 'config_json', ellipsis: true },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: (row: ServerService) =>
      h(NSpace, {}, () => [
        h(NButton, { size: 'small', onClick: () => showModal(false, row) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => doDelete(row.id) }, () => '删除'),
      ]),
  },
];

async function load() {
  if (!serverId.value) return;
  loading.value = true;
  try {
    server.value = await serversApi.get(serverId.value);
    list.value = await serverServicesApi.list(serverId.value);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function showModal(isNew: boolean, row?: ServerService) {
  editingId.value = isNew ? null : (row?.id ?? null);
  if (row) {
    form.value = {
      name: row.name,
      type: row.type,
      port: row.port,
      status: row.status,
      config_json: row.config_json ?? '',
    };
  } else {
    form.value = getEmptyForm();
  }
  modalVisible.value = true;
}

async function submit() {
  try {
    if (editingId.value) {
      await serverServicesApi.update(editingId.value, form.value);
      message.success('已更新');
    } else {
      await serverServicesApi.create(serverId.value, form.value);
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
    await serverServicesApi.delete(id);
    message.success('已删除');
    load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

onMounted(load);
</script>
