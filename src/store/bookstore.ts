import { defineStore } from 'pinia';
import { useSettingsStore } from './settings';
import { BookStore } from '../core/plugins/defined/bookstore';
import { useMessage } from '../hooks/message';
import { BookStoreItem } from '../core/book/book';
import { PluginType } from '../core/plugins';

export type BookStoreData = {
  value: BookStoreItem[],
  isRun: boolean
}
export type BookStoreSource = {
  id: string,
  name: string
}

export const useBookstoreStore = defineStore('BookStore', {
  state: () => {
    return {
      /**键为navItem */
      data: new Map<string, BookStoreData>(),
      _navItem: [] as string[],
      _source: [] as BookStoreSource[],
      /**被选中的navItem */
      selected: '' as string,
    }
  },
  getters: {
    navItem(): string[] {
      return this._navItem;
    },
    /**书城插件 */
    source(): BookStoreSource[] {
      return this._source;
    }
  },
  actions: {
    refreshNavItem() {
      const id = useSettingsStore().bookStore.use;
      const instance = GLOBAL_PLUGINS.getPluginInstanceById<BookStore>(id);
      if (!instance) {
        this._navItem = [];
        return;
      }
      const _keys = Object.keys(instance.config);
      if (_keys.length > 0 && !_keys.includes(this.selected)) {
        this.selected = _keys[0];
      }
      this._navItem = _keys;
    },
    refreshSource() {
      const plugins = GLOBAL_PLUGINS.getPluginsByType(PluginType.BOOK_STORE, { enable: true });
      this._source = plugins.map(({ props }) => ({
        id: props.ID,
        name: props.NAME
      }));
    },
    refreshData(key: string, force = false) {
      const id = useSettingsStore().bookStore.use;
      if (!id) {
        GLOBAL_LOG.error('BookStore refreshData id:', id);
        return;
      }
      const instance = GLOBAL_PLUGINS.getPluginInstanceById<BookStore>(id);
      const message = useMessage();
      if (!instance) {
        message.error(`插件不存在或未启用, ID:${id}`);
        return;
      }
      const func = instance.getConfigItem(key);
      if (!this.data.get(key)) {
        this.data.set(key, {
          isRun: false,
          value: []
        });
      }
      const data = this.data.get(key);
      if (!data || data.isRun || !func) {
        return;
      }
      if (!force && data.value.length > 0) {
        return;
      }
      data.isRun = true;
      func()
        .then(items => data.value = items)
        .catch(e => {
          GLOBAL_LOG.error('bookstore refreshData', `plugin_id="${id}"`, `key="${key}"`, e);
          message.error(e.message);
        })
        .finally(() => data.isRun = false);
    },


  }
});