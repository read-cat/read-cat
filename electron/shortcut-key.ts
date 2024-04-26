import { BrowserWindow, globalShortcut } from 'electron';
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
        return registerGlobalBossKey(skey);

      default:
        return false;
    }
  }

  const unregister = (skey: string) => {
    globalShortcut.isRegistered(skey) && globalShortcut.unregister(skey);
  }


  const registerGlobalBossKey = (skey: string) => {
    const debo = debounce(() => {
      win.isVisible() ? win.hide() : win.show();
    }, 200);
    return globalShortcut.register(skey, debo);
  }

  return {
    register,
    unregister
  }
}