import { BookRefresh } from '../../../store/bookshelf';
import { Ref, ref } from 'vue';
import { debounce } from '../../../core/utils/timer';

export const useSearch = (books: Ref<BookRefresh[]>) => {
  
  const searchValues = ref<BookRefresh[]>(books.value);
  const searchDebounce = debounce((searchkey: string) => {
    if (searchkey.trim() === '') {
      searchValues.value = books.value;
      return;
    }
    searchValues.value = books.value.filter(v => v.searchIndex.includes(searchkey.trim()));
  }, 500);
  const search = (searchkey: string) => {
    searchDebounce(searchkey);
  }

  return {
    search,
    searchValues
  }

}