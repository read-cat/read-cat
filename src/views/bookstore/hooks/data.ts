import { computed, onMounted, ref } from 'vue';
import { useDefaultPagination } from '../../../hooks/default-pagination';
import { useBookstoreStore } from '../../../store/bookstore';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../store/window';
import { useSettingsStore } from '../../../store/settings';

export const useData = () => {
  const win = useWindowStore();
  const settings = useSettingsStore();
  const bookstore = useBookstoreStore();
  const { data, navItem, source, selected } = storeToRefs(bookstore);
  /**正在使用的书城插件是否启用 */
  const enabled = ref(false);
  const pagination = useDefaultPagination(computed(() => {
    const d = data.value.get(selected.value);
    if (!d) {
      return [];
    }
    return d.value;
  }), 30);
  const isRun = computed(() => {
    const d = data.value.get(selected.value);
    if (!d) {
      return false;
    }
    return d.isRun;
  });

  const refresh = () => {
    bookstore.refreshNavItem();
    bookstore.refreshSource();
  }

  const clear = () => {
    data.value.clear();
  }

  win.addEventListener('inited', () => {
    refresh();
    GLOBAL_PLUGINS.on('imported', pid => {
      GLOBAL_LOG.debug('plugin imported pid:', pid);
      refresh();
    });
    GLOBAL_PLUGINS.on('deleted', pid => {
      GLOBAL_LOG.debug('plugin deleted pid:', pid);
      refresh();
      if (settings.bookStore.use === pid) {
        enabled.value = false;
        clear();
        settings.bookStore.use = source.value.length > 0 ? source.value[0].id : '';
        bookstore.refreshNavItem();
        bookstore.refreshData(selected.value);
      }
    });
    GLOBAL_PLUGINS.on('disabled', pid => {
      GLOBAL_LOG.debug('plugin disabled pid:', pid);
      refresh();
      if (settings.bookStore.use === pid) {
        enabled.value = false;
        clear();
        settings.bookStore.use = source.value.length > 0 ? source.value[0].id : '';
        bookstore.refreshNavItem();
        bookstore.refreshData(selected.value);
      }
      
    });
    GLOBAL_PLUGINS.on('enabled', pid => {
      GLOBAL_LOG.debug('plugin enabled pid:', pid);
      refresh();
      if (settings.bookStore.use === pid) {
        enabled.value = true;
        bookstore.refreshData(selected.value);
      }
    });
    if (navItem.value.length <= 0) {
      return;
    }
    bookstore.refreshData(selected.value, true);
  });
  onMounted(() => {
    if (!win.inited || navItem.value.length <= 0) {
      return;
    }
    bookstore.refreshData(selected.value);
  });

  /**是否禁用书城源选中框 */
  const disableSelect = computed(() => {
    for (const item of Array.from(data.value.values())) {
      if (item.isRun) {
        return true;
      }
    }
    return false;
  });

  const isEmpty = computed(() => {
    const books = data.value.get(selected.value);
    if (!books || books.value.length < 1) {
      return true;
    }
    return false;
  });


  return {
    ...pagination,
    isRun,
    navItem,
    source,
    disableSelect,
    enabled,
    selected,
    clear,
    isEmpty
  }
}