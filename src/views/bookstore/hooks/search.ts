import { storeToRefs } from 'pinia';
import { useSearchStore } from '../../../store/search';
import { useRouter } from 'vue-router';
import { PagePath } from '../../../core/window';

export const useSearch = () => {
  const router = useRouter();
  const searchStore = useSearchStore();
  const { searchBoxSearchKey, searchBoxSearchProgress } = storeToRefs(searchStore);

  const search = (searchkey: string, author: string | null, group: string = '') => {
    searchStore.search(searchkey, author || null, group, p => {
      searchBoxSearchKey.value = searchkey;
      searchBoxSearchProgress.value = p;
    });
    router.push(PagePath.SEARCH);
  }

  return {
    search
  }
}