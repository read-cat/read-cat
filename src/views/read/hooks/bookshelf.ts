import { storeToRefs } from 'pinia';
import { useScrollTopStore } from '../../../store/scrolltop';
import { useDetailStore } from '../../../store/detail';
import { onMounted, onUnmounted } from 'vue';
import { useBookshelfStore } from '../../../store/bookshelf';

export const useBookshelf = (pid: string, detailUrl: string) => {
  const scrollTopStore = useScrollTopStore();
  const { mainElement } = storeToRefs(scrollTopStore);
  const { currentReadScrollTop } = storeToRefs(useDetailStore());
  const bookshelf = useBookshelfStore();
  let _scrollTop = 0;
  if (mainElement.value) {
    mainElement.value.addEventListener('scroll', () => {
      mainElement.value && (_scrollTop = mainElement.value.scrollTop);
    });
  }
  onMounted(() => {
    scrollTopStore.scrollTop(currentReadScrollTop.value);
  });
  onUnmounted(() => {
    bookshelf.getBookshelfEntity(pid, detailUrl).then(entity => {
      if (!entity) {
        return;
      }
      bookshelf.put({
        ...entity,
        readScrollTop: _scrollTop
      }).then(() => {
        currentReadScrollTop.value = _scrollTop;
      });
    });
  });
}