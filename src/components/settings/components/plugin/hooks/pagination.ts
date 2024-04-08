import { Ref } from 'vue';
import { Plugin } from './plugin';
import { useDefaultPagination } from '../../../../../hooks/default-pagination';

export const usePagination = (plugins: Ref<Plugin[]>, pageSize = 20) => {

  const {
    totalPage,
    showValue,
    currentPage,
    currentPageChange
  } = useDefaultPagination(plugins, pageSize);

  
  return {
    totalPage,
    showValue,
    currentPage,
    currentPageChange
  }
}