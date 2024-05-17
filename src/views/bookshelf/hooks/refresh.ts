import { storeToRefs } from 'pinia';
import { useBookshelfStore } from '../../../store/bookshelf';
import { ref, watch } from 'vue';

export const useRefresh = () => {
  const { books, refreshed } = storeToRefs(useBookshelfStore());
  const refreshValues = ref(books.value);
  const { refreshAll } = useBookshelfStore();

  watch(() => books.value, newVal => {
    refreshValues.value = newVal;
  });

  const refresh = () => {
    refreshAll();
  }

  if (!refreshed.value) {
    refreshed.value = true;
    refresh();
  }

  return {
    refresh,
    refreshValues
  }
}