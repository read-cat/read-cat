import { BookRefresh, useBookshelfStore } from '../../../store/bookshelf';
import { onUnmounted, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDefaultPagination } from '../../../hooks/default-pagination';

export const usePagination = (books: Ref<BookRefresh[]>, pageSize = 12) => {
  const { currentPage: bookshelfCurrentPage } = storeToRefs(useBookshelfStore());
  const {
    totalPage,
    currentPage,
    showValue,
    currentPageChange
  } = useDefaultPagination(books, pageSize, bookshelfCurrentPage.value);

  onUnmounted(() => {
    bookshelfCurrentPage.value = currentPage.value;
  });

  return {
    totalPage,
    currentPage,
    showValue,
    currentPageChange
  }
}