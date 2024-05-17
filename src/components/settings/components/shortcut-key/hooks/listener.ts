import { onUnmounted } from 'vue';
import { isKeyboardEvent } from '../../../../../core/is';
import { debounce } from '../../../../../core/utils/timer';
import { useMessage } from '../../../../../hooks/message';
import { GlobalShortcutKey, ShortcutKey } from '../../../../../store/defined/settings';
import { useSettingsStore } from '../../../../../store/settings';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../../../store/window';
import { EventCode } from '../../../../../../events';

type Listener = (e: KeyboardEvent | Event) => void;

export const useListener = () => {
  const { handlerKeyboard, shortcutKey, hasShortcutKey } = useSettingsStore();
  const message = useMessage();
  const { isSetShortcutKey, globalShortcutKeyRegisterError } = storeToRefs(useWindowStore());

  const disableShortcutKey = [
    process.platform === 'darwin' ? 'Meta+C' : 'Ctrl+C',
  ];

  const createKeyDownListener = (call: (raw: string, key: string) => void): Listener => {
    const debo = debounce((raw: string, key: string) => call(raw, key), 200);
    return (e: KeyboardEvent | Event) => {
      e.preventDefault();
      if (!isKeyboardEvent(e)) {
        return;
      }
      isSetShortcutKey.value = true;
      const { altKey, ctrlKey, shiftKey, metaKey, key } = e;
      debo(key, handlerKeyboard(altKey, ctrlKey, shiftKey, metaKey, key));
    }
  }

  const handlerApplicationShortcutKey = (prop: keyof ShortcutKey) => createKeyDownListener((raw: string, key: string) => {
    if (raw === 'Backspace') {
      shortcutKey[prop] = '';
      isSetShortcutKey.value = false;
      return;
    }
    if (disableShortcutKey.includes(key)) {
      message.error(`不允许将${key}设置为快捷键`);
      isSetShortcutKey.value = false;
      return;
    }
    if (!key || key === shortcutKey[prop]) {
      isSetShortcutKey.value = false;
      return;
    }
    if (hasShortcutKey(key)) {
      isSetShortcutKey.value = false;
      message.warning('快捷键已存在');
      return;
    }
    shortcutKey[prop] = key;
    isSetShortcutKey.value = false;
  });
  const handlerGlobalShortcutKey = (prop: keyof GlobalShortcutKey) => createKeyDownListener((raw: string, key: string) => {
    if (raw === 'Backspace') {
      unregister(prop, shortcutKey[prop]);
      shortcutKey[prop] = '';
      isSetShortcutKey.value = false;
      return;
    }
    if (disableShortcutKey.includes(key)) {
      message.error(`不允许将${key}设置为快捷键`);
      isSetShortcutKey.value = false;
      return;
    }
    if (!key || key === shortcutKey[prop]) {
      isSetShortcutKey.value = false;
      return;
    }
    if (hasShortcutKey(key)) {
      isSetShortcutKey.value = false;
      message.warning('快捷键已存在');
      return;
    }
    GLOBAL_IPC.send(EventCode.ASYNC_REGISTER_SHORTCUT_KEY, prop, key);
    isSetShortcutKey.value = false;
  });

  const registerShortcutKeyHandler = (_: any, key: keyof GlobalShortcutKey, skey: string, flag: boolean) => {
    if (flag) {
      const old = shortcutKey[key];
      shortcutKey[key] = skey;
      unregister(key, old);
    } else {
      globalShortcutKeyRegisterError.value.set(key, '快捷键注册失败');
    }
  }
  GLOBAL_IPC.on(EventCode.ASYNC_REGISTER_SHORTCUT_KEY, registerShortcutKeyHandler);

  const unregister = (key: keyof GlobalShortcutKey, skey: string) => {
    globalShortcutKeyRegisterError.value.delete(key);
    skey && GLOBAL_IPC.send(EventCode.ASYNC_UNREGISTER_SHORTCUT_KEY, skey);
  }

  const listeners = {
    prevChapterListener: handlerApplicationShortcutKey('prevChapter'),
    nextChapterListener: handlerApplicationShortcutKey('nextChapter'),
    prevPageListener: handlerApplicationShortcutKey('prevPage'),
    nextPageListener: handlerApplicationShortcutKey('nextPage'),
    scrollUpListener: handlerApplicationShortcutKey('scrollUp'),
    scrollDownListener: handlerApplicationShortcutKey('scrollDown'),
    openDevToolsListener: handlerApplicationShortcutKey('openDevTools'),
    zoomInWindowListener: handlerApplicationShortcutKey('zoomInWindow'),
    zoomOutWindowListener: handlerApplicationShortcutKey('zoomOutWindow'),
    zoomRestWindowListener: handlerApplicationShortcutKey('zoomRestWindow'),
    fullScreenWindowListener: handlerApplicationShortcutKey('fullScreen'),
  }
  const globalShortcutKeyListeners = {
    bossKeyListener: handlerGlobalShortcutKey('globalBossKey'),
    readAloudToggleListener: handlerGlobalShortcutKey('globalReadAloudToggle'),
    readAloudPrevChapterListener: handlerGlobalShortcutKey('globalReadAloudPrevChapter'),
    readAloudNextChapterListener: handlerGlobalShortcutKey('globalReadAloudNextChapter'),
    readAloudFastForwardListener: handlerGlobalShortcutKey('globalReadAloudFastForward'),
    readAloudFastRewindListener: handlerGlobalShortcutKey('globalReadAloudFastRewind'),
  }

  onUnmounted(() => {
    Object.keys(listeners).forEach(k => (<any>listeners)[k] = null);
    GLOBAL_IPC.removeListener(EventCode.ASYNC_REGISTER_SHORTCUT_KEY, registerShortcutKeyHandler);
  });

  return {
    ...listeners,
    ...globalShortcutKeyListeners,
  }
}