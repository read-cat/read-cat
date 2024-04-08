import { Ref, nextTick, ref, toRaw, watch } from 'vue';
import { Chapter } from '../../../core/book/book';
import { DetailPageResult, useDetailStore } from '../../../store/detail';
import { chunkArray } from '../../../core/utils';
import { storeToRefs } from 'pinia';

export const useChapterPagination = (result: Ref<DetailPageResult | null>, pageSize = 60) => {
  const detailStore = storeToRefs(useDetailStore());
  const pageValue = ref<Chapter[][][]>([]);
  const totalPage = ref<number>(0);
  const { currentPage, currentReadIndex } = detailStore;
  const showValue = ref<Chapter[][]>([]);
  const getPage = () => {
    let page = currentPage.value - 1;
    page = page < 0 ? 0 : page;
    page = page >= totalPage.value ? totalPage.value - 1 : page;
    return page;
  }
  const currentPageChange = (page: number) => {
    currentPage.value = page;
    showValue.value = pageValue.value[getPage()];
    nextTick(() => {
      const ele = document.querySelector<HTMLElement>('#detail-result-box .chapter .list');
      if (ele) {
        ele.scrollTop = 0;
      }
    });
  }
  watch(() => result.value, (newVal, _) => {
    if (!newVal) {
      pageValue.value = [];
      totalPage.value = 0;
      showValue.value = [];
      return;
    }
    currentPage.value = Math.ceil((currentReadIndex.value + 1) / pageSize);
    if (currentReadIndex.value >= 0) {
      nextTick(() => {
        const list = document.querySelector<HTMLDivElement>('#detail-result-box .chapter .list');
        if (!list) {
          return;
        }
        const span = document.querySelector<HTMLSpanElement>(`#detail-result-box .chapter .list span[data-index='${currentReadIndex.value}']`);
        const row = span?.parentElement?.parentElement;
        if (!row) {
          return;
        }
        if (row.offsetTop > 0) {
          list.scrollTop = row.offsetTop - (list.clientHeight + row.clientHeight - list.clientHeight / 3);
        }
      });
    }
    const { chapterList } = toRaw(newVal);
    const rows = chunkArray(chapterList, 3);
    pageValue.value = chunkArray(rows, pageSize / 3);
    totalPage.value = pageValue.value.length;
    showValue.value = pageValue.value[getPage()];
  }, {
    immediate: true,
    deep: true
  });
  return {
    totalPage,
    currentPage,
    showValue,
    currentPageChange,
    currentReadIndex
  }
}