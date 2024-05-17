import { storeToRefs } from 'pinia';
import { useScrollTopStore } from '../../../store/scrolltop';
import { useSettingsStore } from '../../../store/settings';
import { onUnmounted, ref, watchEffect } from 'vue';
import { debounce } from '../../../core/utils/timer';
import { useMessage } from '../../../hooks/message';
import { PagePath } from '../../../core/window';
import { useWindowStore } from '../../../store/window';
import { useTextContent } from './text-content';

export const useScrollToggleChapter = () => {
  const { options } = useSettingsStore();
  const { mainElement } = storeToRefs(useScrollTopStore());
  const { scrollToTextContent } = useScrollTopStore();
  const message = useMessage();
  const { currentPath } = storeToRefs(useWindowStore());
  const { nextChapter, prevChapter } = useTextContent();
  const pageHeight = ref(`${mainElement.value.clientHeight - 10}px`);
  window.addEventListener('resize', () => {
    pageHeight.value = `${mainElement.value.clientHeight - 10}px`;
  });

  const deboToggleChapter = debounce((type: 'next' | 'prev') => {
    if (type === 'next') {
      nextChapter().catch(e => e && message.error(e.message));
    } else if (type === 'prev') {
      prevChapter().catch(e => e && message.error(e.message));
    }
  }, 200);
  const scrollBottomToNextChapterListener = () => {
    const { scrollTop, clientHeight, scrollHeight } = mainElement.value;
    if (scrollTop >= scrollHeight - clientHeight) {
      deboToggleChapter('next');
    }
  }
  const scrollTopToPrevChapterListener = () => {
    const { scrollTop } = mainElement.value;
    if (scrollTop <= 0) {
      deboToggleChapter('prev');
    }
  }
  watchEffect(() => {
    if (options.enableScrollToggleChapter && currentPath.value === PagePath.READ) {
      mainElement.value.scrollTop <= 0 && scrollToTextContent(void 0, 'instant');
      mainElement.value.addEventListener('scrollend', scrollBottomToNextChapterListener);
      mainElement.value.addEventListener('scrollend', scrollTopToPrevChapterListener);
    } else {
      mainElement.value.removeEventListener('scrollend', scrollBottomToNextChapterListener);
      mainElement.value.removeEventListener('scrollend', scrollTopToPrevChapterListener);
    }
  });
  onUnmounted(() => {
    mainElement.value.removeEventListener('scrollend', scrollBottomToNextChapterListener);
    mainElement.value.removeEventListener('scrollend', scrollTopToPrevChapterListener);
  });

  return {
    pageHeight,
  }
}