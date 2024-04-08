import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../../../store/detail';
import { ref, toRaw, watch } from 'vue';
import { Chapter } from '../../../../../core/book/book';
import { isNull } from '../../../../../core/is';
import { chunkArray } from '../../../../../core/utils';

export const usePagination = (pageSize = 20) => {
  const { detailResult, currentReadIndex } = storeToRefs(useDetailStore());
  const currentChapterTitle = ref('');
  const currentChapterPage = ref(0);
  const pid = ref('');
  const totalPage = ref(0);
  const currentPage = ref(Math.ceil((currentReadIndex.value + 1) / pageSize));
  const pageValue = ref<Chapter[][]>([]);
  const showValue = ref<Chapter[]>([]);
  const getPage = () => {
    let page = currentPage.value - 1;
    page = page < 0 ? 0 : page;
    page = page >= totalPage.value ? totalPage.value - 1 : page;
    return page;
  }
  const currentPageChange = (page: number) => {
    currentPage.value = page;
    showValue.value = pageValue.value[getPage()];
  }
  watch(() => detailResult.value, (newVal, _) => {
    if (isNull(newVal)) {
      return;
    }
    pid.value = newVal.pid;
    currentChapterTitle.value = newVal.chapterList[currentReadIndex.value].title;
    pageValue.value = chunkArray(toRaw(newVal.chapterList), pageSize);
    totalPage.value = pageValue.value.length;
    showValue.value = pageValue.value[getPage()];
  }, {
    immediate: true,
    deep: true
  });
  watch(() => currentReadIndex.value, (newVal) => {
    currentChapterPage.value = Math.ceil((newVal + 1) / pageSize);
    currentPageChange(currentChapterPage.value);
    if (isNull(detailResult.value)) {
      return;
    }
    currentChapterTitle.value = detailResult.value.chapterList[newVal].title;
  }, {
    immediate: true
  });

  return {
    pid,
    totalPage,
    currentPage,
    showValue,
    currentPageChange,
    currentChapterTitle,
    currentChapterPage
  }
}