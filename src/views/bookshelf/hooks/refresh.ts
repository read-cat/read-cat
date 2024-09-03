import { storeToRefs } from 'pinia';
import { useBookshelfStore } from '../../../store/bookshelf';

export const useRefresh = () => {
  const { books, refreshed } = storeToRefs(useBookshelfStore());
  const { refreshAll } = useBookshelfStore();

  const refresh = () => {
    refreshAll();
  }

  if (!refreshed.value) {
    refreshed.value = true;
    refresh();
  }

  return {
    refresh,
    refreshValues: books
  }
}