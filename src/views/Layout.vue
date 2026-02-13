<template>
  <n-config-provider :theme="darkTheme">
    <n-layout has-sider class="app-layout">
      <n-layout-sider
        bordered
        :width="220"
        :collapsed-width="0"
        :native-scrollbar="false"
        content-style="display: flex; flex-direction: column; height: 100%;"
        class="app-sider"
      >
        <div class="sider-header">
          <span class="sider-title">运维平台</span>
        </div>
        <n-menu
          :options="menuOptions"
          :value="currentKey"
          style="flex: 1; padding: 8px 0;"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>
      <n-layout class="app-main">
        <n-layout-header bordered class="app-header">
          <span class="header-title">{{ pageTitle }}</span>
        </n-layout-header>
        <n-layout-content content-style="padding: 24px;" class="app-content">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { darkTheme } from 'naive-ui';

const router = useRouter();
const route = useRoute();

const currentKey = computed(() => route.path.split('/').slice(0, 2).join('/') || '/servers');
const pageTitle = computed(() => (route.meta?.title as string) || '运维平台');

const menuOptions = [
  { label: '服务器管理', key: '/servers' },
  { label: '智能体服务管理', key: '/agent-services' },
  { label: '运维智能体', key: '/agent' },
];

function handleMenuSelect(key: string) {
  router.push(key);
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  height: 100vh;
  display: flex;
}

.app-layout :deep(.n-layout-scroll-container) {
  flex: 1;
  min-width: 0;
}

.app-sider {
  height: 100vh;
  flex-shrink: 0;
}

.sider-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.sider-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--n-text-color);
}

.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.app-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.app-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
}
</style>
