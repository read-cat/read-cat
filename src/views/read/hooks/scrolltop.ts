import { storeToRefs } from 'pinia';
import { useScrollTopStore } from '../../../store/scrolltop';
import { useDetailStore } from '../../../store/detail';
import { nextTick, onMounted, onUnmounted } from 'vue';
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
      bookshelf.put({
        ...entity,
        readScrollTop: scrollTop
      }).then(() => {
        currentReadScrollTop.chapterIndex = entity.readIndex;
        currentReadScrollTop.scrollTop = scrollTop;
      });
    });
  }

  onMounted(() => {
    nextTick(() => {
      if (currentReadScrollTop.chapterIndex === currentChapter.value?.index) {
        scrollTopStore.scrollTop(currentReadScrollTop.scrollTop);
      }
      mainElement.value.addEventListener('scrollend', listener);
    });
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