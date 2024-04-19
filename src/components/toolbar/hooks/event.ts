import { EventCode } from '../../../../events';
import { useWindowStore } from '../../../store/window';
import { useSettingsStore } from '../../../store/settings';

export const useEvent = () => {
  const win = useWindowStore();
  const { setTheme } = useSettingsStore();
  const minimize = () => {
    GLOBAL_IPC.send(EventCode.ASYNC_SET_WINDOW_MINIMIZE);
  }
  const maximizeOrRestore = () => {
    GLOBAL_IPC.send(EventCode.ASYNC_SET_WINDOW_MAXIMIZE_OR_RESTORE);
  }

  const close = () => {
    GLOBAL_IPC.send(EventCode.ASYNC_CLOSE_WINDOW);
  }
  GLOBAL_IPC.on(EventCode.ASYNC_CLOSE_WINDOW, close);

  const dark = () => {
    setTheme(win.isDark ? 'light' : 'dark');
  }

  const exitFullScreen = () => {
    GLOBAL_IPC.send(EventCode.ASYNC_WINDOW_SET_FULLSCREEN, false);
  }
  const refresh = () => {
    const call = win.refreshEventMap.get(win.currentPath);
    if (call) {
      call();
    }
  }

  return {
    minimize,
    maximizeOrRestore,
    close,
    dark,
    exitFullScreen,
    refresh
  }
}