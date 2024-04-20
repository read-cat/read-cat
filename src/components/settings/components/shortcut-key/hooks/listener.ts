import { onUnmounted } from 'vue';
import { isKeyboardEvent } from '../../../../../core/is';
import { debounce } from '../../../../../core/utils/timer';
import { useMessage } from '../../../../../hooks/message';
import { ShortcutKey } from '../../../../../store/defined/settings';
import { useSettingsStore } from '../../../../../store/settings';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../../../store/window';

type Listener = (e: KeyboardEvent | Event) => void;

export const useListener = () => {
  const { handlerKeyboard, shortcutKey, hasShortcutKey } = useSettingsStore();
  const message = useMessage();
  const { isSetShortcutKey } = storeToRefs(useWindowStore());

  const createKeyDownListener = (call: (raw: string, key: string) => void): Listener => {
    const debo = debounce((raw: string, key: string) => call(raw, key), 200);
    return (e: KeyboardEvent | Event) => {
      if (!isKeyboardEvent(e)) {
        return;
      }
      isSetShortcutKey.value = true;
      const { altKey, ctrlKey, shiftKey, metaKey, key } = e;
      debo(key, handlerKeyboard(altKey, ctrlKey, shiftKey, metaKey, key));
    }
  }

  const handler = (prop: keyof ShortcutKey) => createKeyDownListener((raw: string, key: string) => {
    if (raw === 'Backspace') {
      shortcutKey[prop] = '';
      isSetShortcutKey.value = false;
      return;
    }
    if (!key) {
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

  const listeners = {
    prevChapterListener: handler('prevChapter'),
    nextChapterListener: handler('nextChapter'),
    openDevToolsListener: handler('openDevTools'),
    zoomInWindowListener: handler('zoomInWindow'),
    zoomOutWindowListener: handler('zoomOutWindow'),
    zoomRestWindowListener: handler('zoomRestWindow'),
  }

  onUnmounted(() => {
    Object.keys(listeners).forEach(k => (<any>listeners)[k] = null);
  });

  return {
    ...listeners
  }
}