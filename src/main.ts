import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { Core } from './core';
import { useWindowStore } from './store/window';
import { EventCode } from '../events';
import 'animate.css/animate.min.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './assets/style/index.css';
import './assets/style/dark/index.css';
import './assets/style/font/harmony-os-sans.css';
import { isUndefined } from './core/is';
import { useMessage } from './hooks/message';
import { ElLoading } from 'element-plus';
import metadata from '../metadata.json';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.directive('loading', ElLoading.directive);

const startListener = () => {
  const win = useWindowStore();
  GLOBAL_IPC.on(EventCode.ASYNC_WINDOW_IS_FULLSCREEN, (_, is: boolean) => {
    win.isFullScreen = is;
  });

  GLOBAL_IPC.on(EventCode.ASYNC_WINDOW_IS_MAXIMIZE, (_, is: boolean) => {
    win.isMaximize = is;
  });
}

app.mount('#app').$nextTick().then(() => {
  Core.init().catch(es => Promise.resolve(es)).then(es => {
    startListener();
    GLOBAL_LOG.info(metadata);
    postMessage({ payload: 'removeLoading' }, '*');
    if (!isUndefined(es)) {
      const message = useMessage();
      for (const e of es) {
        message.error(`init error: ${e.message}`);
      }
    }
  });
});