import { storeToRefs } from 'pinia';
import { debounce } from '../core/utils/timer';
import { useTextContent } from '../views/read/hooks/text-content';
import { useSettingsStore } from '../store/settings';
import { useWindowStore } from '../store/window';
import { PagePath } from '../core/window';
import { EventCode } from '../../events';

export const useShortcutKey = () => {
  const { nextChapter, prevChapter } = useTextContent();
  const { shortcutKey } = storeToRefs(useSettingsStore());
  const { handlerKeyboard } = useSettingsStore();
  const win = useWindowStore();
  
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
      default:
        break;
    }
  }, 200);

  const onKeydown = (e: KeyboardEvent) => {
    const { altKey, ctrlKey, shiftKey, key } = e;
    handler(handlerKeyboard(altKey, ctrlKey, shiftKey, key));
  }

  window.addEventListener('keydown', onKeydown);
}