import { BrowserWindow, globalShortcut } from 'electron';
import { EventCode } from '../../events';

const debounce = (executor: (...args: any[]) => void, ms = 1000) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      executor(...args);
      timeout = null;
    }, ms);
  }
}
export const useShortcutKey = (win: BrowserWindow) => {
  /**
   * 注册快捷键
   * @param key 快捷键名称
   * @param skey 快捷键
   */
  const register = (key: string, skey: string) => {
    switch (key) {
      case 'globalBossKey':
        return registerGlobalShortcutKey(key, skey, bossKey);

      default:
        return registerGlobalShortcutKey(key, skey);
    }
  }

  const unregister = (skey: string) => {
    globalShortcut.isRegistered(skey) && globalShortcut.unregister(skey);
  }


  const bossKey = () => {
    win.isVisible() ? win.hide() : win.show();
  }

  const registerGlobalShortcutKey = (key: string, skey: string, callback?: () => void) => {
    const debo = debounce(() => {
      win.webContents.send(EventCode.ASYNC_TRIGGER_GLOBAL_SHORTCUT_KEY, key);
      callback && callback();
    }, 200);
    return globalShortcut.register(skey, debo);
  }

  return {
    register,
    unregister
  }
}