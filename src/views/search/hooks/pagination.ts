import { Ref, onMounted, onUnmounted } from 'vue';
import { useScrollTopStore } from '../../../store/scrolltop';
import { SearchResult, useSearchStore } from '../../../store/search';
import { storeToRefs } from 'pinia';
import { useDefaultPagination } from '../../../hooks/default-pagination';


export const usePagination = (values: Ref<SearchResult[]>, pagesize = 20) => {
  const { currentPage: _cp, scrolltop } = storeToRefs(useSearchStore());
  const { scrollTop, mainElement } = useScrollTopStore();
  const {
    totalPage,
    showValue,
    currentPage,
    currentPageChange,
    onCurrentPageChange,
  } = useDefaultPagination(values, pagesize, _cp.value);
  onCurrentPageChange(() => {
    scrollTop(0);
  });
  onMounted(() => {
    scrollTop(scrolltop.value);
  });
  onUnmounted(() => {
    _cp.value = currentPage.value;
    mainElement && (scrolltop.value = mainElement.scrollTop);
  });
  
  return {
    totalPage,
    currentPage,
    showValue,
    currentPageChange
  }
}