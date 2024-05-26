import { storeToRefs } from 'pinia';
import { useScrollTopStore } from '../../../store/scrolltop';
import { useSettingsStore } from '../../../store/settings';
import { onUnmounted, ref, watchEffect } from 'vue';
import { debounce } from '../../../core/utils/timer';
import { useMessage } from '../../../hooks/message';
import { PagePath } from '../../../core/window';
import { useWindowStore } from '../../../store/window';
import { useTextContentStore } from '../../../store/text-content';

export const useScrollToggleChapter = () => {
  const { options } = useSettingsStore();
  const { mainElement } = storeToRefs(useScrollTopStore());
  const { scrollToTextContent, scrollTop } = useScrollTopStore();
  const message = useMessage();
  const { currentPath } = storeToRefs(useWindowStore());
  const { nextChapter, prevChapter } = useTextContentStore();
  const pageHeight = ref(`${mainElement.value.clientHeight - 10}px`);
  window.addEventListener('resize', () => {
    pageHeight.value = `${mainElement.value.clientHeight - 10}px`;
  });

  const deboToggleChapter = debounce((type: 'next' | 'prev') => {
    if (type === 'next') {
      nextChapter().catch(e => {
        if (e) {
          message.error(e.message);
          return;
        }
        const el = document.querySelector<HTMLElement>('#text-content div[data-index]:last-child');
        if (!el) {
          return;
        }
        const el1 = document.querySelector<HTMLElement>('.scroll-bottom-to-next-chapter');
        const height = el1 ? el1.clientHeight : 0;
        scrollTop(el.offsetTop - height + el.clientHeight + 50, 'smooth');
      });
    } else if (type === 'prev') {
      prevChapter().catch(e => e && message.error(e.message));
    }
  }, 100);
  const scrollBottomToNextChapterListener = () => {
    const { scrollTop, clientHeight, scrollHeight } = mainElement.value;
    GLOBAL_LOG.debug('scrollBottomToNextChapterListener', 'sTop', Math.ceil(scrollTop), 'cHeight', clientHeight, 'sHeight', scrollHeight, 'value', Math.floor(scrollHeight - clientHeight));
    if (Math.ceil(scrollTop) >= Math.floor(scrollHeight - clientHeight)) {
      deboToggleChapter('next');
      GLOBAL_LOG.debug('scrollBottomToNextChapterListener trigger');
    }
  }
  const scrollTopToPrevChapterListener = () => {
    const { scrollTop } = mainElement.value;
    GLOBAL_LOG.debug('scrollTopToPrevChapterListener', 'sTop', Math.floor(scrollTop));
    if (Math.floor(scrollTop) <= 0) {
      deboToggleChapter('prev');
      GLOBAL_LOG.debug('scrollTopToPrevChapterListener trigger');
    }
  }
  watchEffect(() => {
    if (options.enableScrollToggleChapter && currentPath.value === PagePath.READ) {
      GLOBAL_LOG.debug('scrollToggleChapterListener addEventListener');
      Math.floor(mainElement.value.scrollTop) <= 0 && scrollToTextContent(void 0, 'instant');
      mainElement.value.addEventListener('scrollend', scrollBottomToNextChapterListener);
      mainElement.value.addEventListener('scrollend', scrollTopToPrevChapterListener);
    } else {
      mainElement.value.removeEventListener('scrollend', scrollBottomToNextChapterListener);
      mainElement.value.removeEventListener('scrollend', scrollTopToPrevChapterListener);
      GLOBAL_LOG.debug('scrollToggleChapterListener removeEventListener');
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