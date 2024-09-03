import { storeToRefs } from 'pinia';
import { useScrollTopStore } from '../../../store/scrolltop';
import { useDetailStore } from '../../../store/detail';
import { onMounted, onUnmounted } from 'vue';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useTextContentStore } from '../../../store/text-content';

export const useScrollTop = (pid: string, detailUrl: string) => {
  const scrollTopStore = useScrollTopStore();
  const { mainElement } = storeToRefs(scrollTopStore);
  const { currentReadScrollTop } = useDetailStore();
  const { currentChapter } = storeToRefs(useTextContentStore());
  const bookshelf = useBookshelfStore();
  let scrollTop = 0;
  const listener = (e: Event) => {
    scrollTop = (<HTMLElement>e.target).scrollTop;
    bookshelf.getBookshelfEntity(pid, detailUrl).then(entity => {
      if (!entity) {
        return;
      }
      const index = currentChapter.value?.index || entity.readIndex;
      bookshelf.put({
        ...entity,
        readIndex: index,
        readScrollTop: scrollTop
      }).then(() => {
        currentReadScrollTop.chapterIndex = index;
        currentReadScrollTop.scrollTop = scrollTop;
      });
    });
  }

  onMounted(() => {
    scrollTopStore.scrollToTextContent(void 0, 'instant');
    mainElement.value.addEventListener('scrollend', listener);
  });
  onUnmounted(() => {
    mainElement.value.removeEventListener('scrollend', listener);
    bookshelf.getBookshelfEntity(pid, detailUrl).then(entity => {
      if (!entity) {
        return;
      }
      bookshelf.put({
        ...entity,
        readScrollTop: scrollTop
      });
    });
  });
}