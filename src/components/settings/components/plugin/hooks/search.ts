import { ref, Ref, watch, watchEffect } from 'vue';
import { Plugin } from './plugin';
import { debounce } from '../../../../../core/utils/timer';

export const useSearch = (plugins: Ref<Plugin[]>) => {
  const searchkey = ref('');
  const searchResult = ref<Plugin[]>([]);

  const filter = (values: Plugin[], key: string) => {
    searchResult.value = values.filter(v => v.searchIndex.toLowerCase().includes(key.toLowerCase()));
  }

  watch(() => plugins.value, newVal => {
    if (!searchkey.value.trim()) {
      searchResult.value = newVal;
      return;
    }
    filter(newVal, searchkey.value.trim());
  }, {
    immediate: true,
    deep: true
  });

  const func = debounce((key: string) => {
    if (!key) {
      searchResult.value = plugins.value;
      return;
    }
    filter(plugins.value, key);
  }, 500);
  watchEffect(() => {
    func(searchkey.value.trim())
  });
  /* watch(() => searchkey.value, newVal => {
    func(newVal.trim());
  }); */

  return {
    searchkey,
    searchResult
  }
}