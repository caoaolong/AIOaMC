<template>
  <n-config-provider :theme="darkTheme">
    <n-layout has-sider style="min-height: 100vh">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="220"
        show-trigger="bar"
        content-style="padding: 16px;"
      >
        <n-menu
          :options="menuOptions"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>
      <n-layout-content content-style="padding: 20px;">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { darkTheme } from 'naive-ui';

const router = useRouter();

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
.n-layout-sider .n-menu {
  padding: 0;
}
</style>
