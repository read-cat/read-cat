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
import './assets/style/font/HarmonyOS_Sans_SC/index.css';
import { isUndefined } from './core/is';
import { useMessage } from './hooks/message';
import { ElLoading } from 'element-plus';
import { useShortcutKey } from './hooks/shortcut-key';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.directive('loading', ElLoading.directive);

(<any>window).GLOBAL_DB = void 0;
(<any>window).GLOBAL_IPC = void 0;
(<any>window).GLOBAL_LOG = void 0;
(<any>window).GLOBAL_PLUGINS = void 0;
(<any>window).GLOBAL_UPDATER = void 0;

const startListener = () => {
  const win = useWindowStore();
  GLOBAL_IPC.on(EventCode.ASYNC_WINDOW_IS_FULLSCREEN, (_, is: boolean) => {
    win.isFullScreen = is;
  });

  GLOBAL_IPC.on(EventCode.ASYNC_WINDOW_IS_MAXIMIZE, (_, is: boolean) => {
    win.isMaximize = is;
  });
  GLOBAL_IPC.once(EventCode.ASYNC_WINDOW_IS_TRANSPARENT, (_, is: boolean) => {
    if (!is) {
      win.transparentWindow = false;
      return;
    }
    win.transparentWindow = true;
    GLOBAL_IPC.send(EventCode.ASYNC_SET_WINDOW_BACKGROUND_COLOR, '#00000000');
  });
}

const initHeaderColor = () => {
  const win = useWindowStore();
  win.inited = true;
  let headerColor = win.isDark ? '#1D1E1F' : '#F2F6FC';
  let headerTextColor = win.isDark ? '#AAAAB5' : '#2D2D2D';
  const root = document.querySelector<HTMLElement>(':root');
  if (root) {
    headerColor = getComputedStyle(root).getPropertyValue(`--rc-header-color-${win.isDark ? 'dark' : 'light'}`);
    headerTextColor = getComputedStyle(root).getPropertyValue(`--rc-text-color-${win.isDark ? 'dark' : 'light'}`);
  }
  GLOBAL_IPC.send(EventCode.ASYNC_SET_TITLE_BAR_STYLE, headerColor, headerTextColor);
}
Core.initIpcRenderer();
startListener();
app.mount('#app').$nextTick().then(() => {
  Core.init().then(es => {
    postMessage({ payload: 'removeLoading' }, '*');
    (process.platform === 'win32') && initHeaderColor();
    useShortcutKey();
    if (!isUndefined(es)) {
      const message = useMessage();
      for (const e of es) {
        message.error(`init error: ${e.message}`);
      }
    }
  });
});