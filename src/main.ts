import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import { router } from './app/router';
import { queryClient } from './app/providers/queryClient';
import { registerServiceWorker } from './app/registerServiceWorker';
import './styles.css';

createApp(App)
  .use(createPinia())
  .use(router)
  .use(VueQueryPlugin, { queryClient })
  .mount('#app');

registerServiceWorker();
