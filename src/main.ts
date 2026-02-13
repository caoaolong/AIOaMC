import { createApp } from 'vue';
import naive from 'naive-ui';
import '@xterm/xterm/css/xterm.css';
import App from './App.vue';
import router from './router';
import './style.css';

createApp(App).use(naive).use(router).mount('#app');
