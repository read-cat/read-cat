import { storeToRefs } from 'pinia';
import { useTextContent } from './text-content';
import { useSettingsStore } from '../../../store/settings';
import { onMounted, onUnmounted } from 'vue';
import { debounce } from '../../../core/utils/timer';

export const useShortcutKey = () => {
  const { nextChapter, prevChapter } = useTextContent();
  const { shortcutKey } = storeToRefs(useSettingsStore());
  const { handlerKeyboard } = useSettingsStore();

  const handler = debounce((key: string) => {
    switch (key) {
      case shortcutKey.value.nextChapter:
        nextChapter();
        break;
      case shortcutKey.value.prevChapter:
        prevChapter();
        break;

      default:
        break;
    }
  }, 200);

  const onKeydown = (e: KeyboardEvent) => {
    const { altKey, ctrlKey, shiftKey, key } = e;
    handler(handlerKeyboard(altKey, ctrlKey, shiftKey, key));
  }

  onMounted(() => document.body.addEventListener('keydown', onKeydown));
  onUnmounted(() => document.body.removeEventListener('keydown', onKeydown));


}