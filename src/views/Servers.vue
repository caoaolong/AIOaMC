<template>
  <div>
    <n-space vertical size="large">
      <n-space justify="space-between">
        <n-h2 style="margin: 0">服务器管理</n-h2>
        <n-button type="primary" @click="showModal(true)">新增服务器</n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="list"
        :loading="loading"
        :row-key="(r: Server) => r.id"
        bordered
      />

      <n-modal
        v-model:show="modalVisible"
        preset="card"
        title="服务器"
        style="width: 520px"
        @after-leave="form = getEmptyForm()"
      >
        <n-form :model="form" label-placement="left" label-width="100">
          <n-form-item label="名称" path="name" required>
            <n-input v-model:value="form.name" placeholder="例如：生产机" />
          </n-form-item>
          <n-form-item label="Host" path="host" required>
            <n-input v-model:value="form.host" placeholder="IP 或域名" />
          </n-form-item>
          <n-form-item label="端口" path="port">
            <n-input-number v-model:value="form.port" :min="1" :max="65535" style="width: 100%" />
          </n-form-item>
          <n-form-item label="用户名" path="username" required>
            <n-input v-model:value="form.username" placeholder="SSH 用户名" />
          </n-form-item>
          <n-form-item label="认证方式">
            <n-radio-group v-model:value="authMode">
              <n-radio value="password">密码</n-radio>
              <n-radio value="key">私钥</n-radio>
            </n-radio-group>
          </n-form-item>
          <n-form-item v-if="authMode === 'password'" label="密码" path="password">
            <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="留空则连接时输入" />
          </n-form-item>
          <n-form-item v-if="authMode === 'key'" label="私钥" path="private_key">
            <n-input v-model:value="form.private_key" type="textarea" placeholder="PEM 私钥内容" :rows="4" />
          </n-form-item>
          <n-form-item label="备注" path="remark">
            <n-input v-model:value="form.remark" type="textarea" placeholder="可选" :rows="2" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="modalVisible = false">取消</n-button>
            <n-button type="primary" @click="submit">保存</n-button>
          </n-space>
        </template>
      </n-modal>

      <n-modal v-model:show="sshModalVisible" preset="card" title="SSH 终端" style="width: 90vw; max-width: 900px" :mask-closable="false" @after-leave="currentSshServerId = null">
        <div style="height: 420px">
          <SshTerminal v-if="currentSshServerId" :server-id="currentSshServerId" />
        </div>
      </n-modal>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NButton, NSpace, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import { serversApi, type Server } from '../api';
import SshTerminal from '../components/SshTerminal.vue';

const message = useMessage();
const router = useRouter();
const list = ref<Server[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const sshModalVisible = ref(false);
const currentSshServerId = ref<number | null>(null);
const authMode = ref<'password' | 'key'>('password');
const editingId = ref<number | null>(null);
const form = ref(getEmptyForm());

function getEmptyForm() {
  return {
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    private_key: '',
    remark: '',
  };
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '名称', key: 'name', width: 120 },
  { title: 'Host', key: 'host', width: 140 },
  { title: '端口', key: 'port', width: 70 },
  { title: '用户名', key: 'username', width: 100 },
  { title: '备注', key: 'remark', ellipsis: true },
  {
    title: '操作',
    key: 'actions',
    width: 260,
    render: (row: Server) =>
      h(NSpace, {}, () => [
        h(NButton, { size: 'small', onClick: () => openSsh(row.id) }, () => 'SSH 连接'),
        h(NButton, { size: 'small', onClick: () => router.push(`/servers/${row.id}/services`) }, () => '服务管理'),
        h(NButton, { size: 'small', onClick: () => showModal(false, row) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => doDelete(row.id) }, () => '删除'),
      ]),
  },
];

async function load() {
  loading.value = true;
  try {
    list.value = await serversApi.list();
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function showModal(isNew: boolean, row?: Server) {
  editingId.value = isNew ? null : (row?.id ?? null);
  if (row) {
    form.value = {
      name: row.name,
      host: row.host,
      port: row.port,
      username: row.username,
      password: row.password ?? '',
      private_key: row.private_key ?? '',
      remark: row.remark ?? '',
    };
    authMode.value = row.private_key ? 'key' : 'password';
  } else {
    form.value = getEmptyForm();
    authMode.value = 'password';
  }
  modalVisible.value = true;
}

async function submit() {
  const body = {
    ...form.value,
    password: authMode.value === 'password' ? (form.value.password || null) : null,
    private_key: authMode.value === 'key' ? (form.value.private_key || null) : null,
  };
  try {
    if (editingId.value) {
      await serversApi.update(editingId.value, body);
      message.success('已更新');
    } else {
      await serversApi.create(body);
      message.success('已添加');
    }
    modalVisible.value = false;
    load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

function openSsh(serverId: number) {
  currentSshServerId.value = serverId;
  sshModalVisible.value = true;
}

async function doDelete(id: number) {
  try {
    await serversApi.delete(id);
    message.success('已删除');
    load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

onMounted(load);
</script>
