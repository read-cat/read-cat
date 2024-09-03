import { Ref, ref, watch, watchEffect } from 'vue';
import { debounce } from '../core/utils/timer';
export interface SearchIndex {
  searchIndex: string
}
export const useDefaultSearch = <T extends SearchIndex>(values: Ref<T[]>, ignoreCase = true) => {
  const searchKey = ref('');
  const searchResult = <Ref<T[]>>ref<T[]>([]);

  const filter = (values: T[], key: string) => {
    searchResult.value = values.filter(v => {
      let key1 = key;
      let key2 = v.searchIndex;
      if (ignoreCase) {
        key1 = key1.toLowerCase();
        key2 = key2.toLowerCase();
      }
      return key2.includes(key1);
    });
  }

  watch(() => values.value, newVal => {
    if (!searchKey.value.trim()) {
      searchResult.value = newVal;
      return;
    }
    filter(newVal, searchKey.value.trim());
  }, {
    immediate: true,
    deep: true
  });

  const func = debounce((key: string) => {
    if (!key) {
      searchResult.value = values.value;
      return;
    }
    filter(values.value, key);
  }, 500);
  watchEffect(() => {
    func(searchKey.value.trim())
  });

  return {
    searchKey,
    searchResult
  }
}