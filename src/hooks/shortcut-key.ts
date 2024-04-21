import { storeToRefs } from 'pinia';
import { debounce } from '../core/utils/timer';
import { useTextContent } from '../views/read/hooks/text-content';
import { useSettingsStore } from '../store/settings';
import { useWindowStore } from '../store/window';
import { PagePath } from '../core/window';
import { EventCode } from '../../events';
import { GlobalShortcutKey } from '../store/defined/settings';

export const useShortcutKey = () => {
  const { nextChapter, prevChapter } = useTextContent();
  const { shortcutKey, zoomFactor } = storeToRefs(useSettingsStore());
  const { handlerKeyboard } = useSettingsStore();
  const win = useWindowStore();
  const { isSetShortcutKey, globalShortcutKeyRegisterError } = storeToRefs(win);

  const handler = debounce((key: string) => {
    switch (key) {
      case shortcutKey.value.nextChapter:
        win.currentPath === PagePath.READ && nextChapter();
        break;
      case shortcutKey.value.prevChapter:
        win.currentPath === PagePath.READ && prevChapter();
        break;
      case shortcutKey.value.openDevTools:
        GLOBAL_IPC.send(EventCode.ASYNC_OPEN_DEVTOOLS);
        break;
      case shortcutKey.value.zoomInWindow:
        if (zoomFactor.value >= 2.9) break;
        zoomFactor.value = Number((zoomFactor.value + 0.1).toFixed(2));
        GLOBAL_IPC.send(EventCode.ASYNC_ZOOM_WINDOW, zoomFactor.value);
        break;
      case shortcutKey.value.zoomOutWindow:
        if (zoomFactor.value <= 0.1) break;
        zoomFactor.value = Number((zoomFactor.value - 0.1).toFixed(2));
        GLOBAL_IPC.send(EventCode.ASYNC_ZOOM_WINDOW, zoomFactor.value);
        break;
      case shortcutKey.value.zoomRestWindow:
        zoomFactor.value = 1;
        GLOBAL_IPC.send(EventCode.ASYNC_ZOOM_WINDOW, zoomFactor.value);
        break;
      default:
        break;
    }
  }, 200);

  const onKeydown = (e: KeyboardEvent) => {
    e.preventDefault();
    if (isSetShortcutKey.value) {
      return;
    }
    const { altKey, ctrlKey, shiftKey, metaKey, key } = e;
    handler(handlerKeyboard(altKey, ctrlKey, shiftKey, metaKey, key));
  }

  window.addEventListener('keydown', onKeydown);

  const initGlobalShortcutKey = () => {
    const globals = Object.keys(shortcutKey.value)
      .filter(k => k.startsWith('global'))
      .map(k => ([k, (<any>shortcutKey.value)[k]]));

    GLOBAL_IPC.send(EventCode.ASYNC_INIT_GLOBAL_SHORTCUT_KEY, globals);
  }
  GLOBAL_IPC.once(EventCode.ASYNC_INIT_GLOBAL_SHORTCUT_KEY, (_, res: [keyof GlobalShortcutKey, string, boolean][]) => {
    for (const [key, __, flag] of res) {
      if (flag) {
        continue;
      }
      globalShortcutKeyRegisterError.value.set(key, '快捷键注册失败');
    }
  });

  initGlobalShortcutKey();
}