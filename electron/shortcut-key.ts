import { BrowserWindow, globalShortcut } from 'electron';
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
    return globalShortcut.register(skey, () => {
      win.isVisible() ? win.hide() : win.show();
    });
  }

  return {
    register,
    unregister
  }
}