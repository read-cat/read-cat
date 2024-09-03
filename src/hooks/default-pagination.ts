import { ref, Ref, toRaw, watch } from 'vue';
import { chunkArray } from '../core/utils';
import { isNull } from '../core/is';

export const useDefaultPagination = <T>(val: Ref<T[]>, pageSize = 20, defaultPage = 1) => {
  const pageValue = <Ref<T[][]>>ref<T[][]>([]);
  const totalPage = ref<number>(0);
  const showValue = <Ref<T[]>>ref<T[]>([]);
  const currentPage = ref<number>(defaultPage || 1);

  let onchange: (() => void) | undefined = void 0;
  const onCurrentPageChange = (callback: () => void) => {
    onchange = callback;
  }

  const getPage = () => {
    let page = currentPage.value - 1;
    page = page < 0 ? 0 : page;
    page = page >= totalPage.value ? totalPage.value - 1 : page;
    currentPage.value = page + 1;
    return page;
  }
  const currentPageChange = (page: number) => {
    currentPage.value = page;
    showValue.value = pageValue.value[getPage()] || [];
    onchange && onchange();
  }
  watch(() => val.value, newVal => {
    if (isNull(newVal)) {
      pageValue.value = [];
      totalPage.value = 0;
      showValue.value = [];
      return;
    }
    pageValue.value = chunkArray(toRaw(newVal), pageSize || 20);
    totalPage.value = pageValue.value.length;
    showValue.value = pageValue.value[getPage()] || [];
  }, {
    immediate: true,
    deep: true
  });

  return {
    totalPage,
    showValue,
    currentPage,
    currentPageChange,
    onCurrentPageChange,
  }
}