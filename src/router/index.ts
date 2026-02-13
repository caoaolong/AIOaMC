import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../views/Layout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      children: [
        { path: '', redirect: '/servers' },
        { path: 'servers', name: 'Servers', component: () => import('../views/Servers.vue'), meta: { title: '服务器管理' } },
        { path: 'servers/:id/services', name: 'ServerServices', component: () => import('../views/ServerServices.vue'), meta: { title: '服务管理' } },
        { path: 'agent-services', name: 'AgentServices', component: () => import('../views/AgentServices.vue'), meta: { title: '智能体服务管理' } },
        { path: 'agent', name: 'Agent', component: () => import('../views/Agent.vue'), meta: { title: '运维智能体' } },
      ],
    },
  ],
});

router.afterEach((to) => {
  const title = (to.meta?.title as string) || '运维平台';
  document.title = title;
});

export default router;
