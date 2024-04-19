import { defineStore, storeToRefs } from 'pinia';
import { isNull } from '../core/is';
import { PluginType } from '../core/plugins';
import { chunkArray, errorHandler } from '../core/utils';
import { useWindowStore } from './window';
import { useSettingsStore } from './settings';
import { SearchKeyStoreEntity } from '../core/database/database';
import { PagePath } from '../core/window';
import { SearchEntity } from '../core/book/book';
import { useMessage } from '../hooks/message';

export interface SearchResult extends SearchEntity {
  pid: string,
  sourceName: string,
  group: string
  time: number
}
export const useSearchStore = defineStore('Search', {
  state: () => {
    return {
      searchkey: [] as SearchKeyStoreEntity[],
      isRunningSearch: false,
      searchResult: [] as SearchResult[],
      currentPage: 0,
      scrolltop: 0,

    }
  },
  getters: {

  },
  actions: {
    addSearchKey(entity: SearchKeyStoreEntity) {
      GLOBAL_DB.store.searchKeyStore.put(entity).then(() => {
        this.searchkey.unshift(entity);
      }).catch(e => {
        useMessage().error(e.message);
      });
    },
    removeSearchKey(id: string) {
      GLOBAL_DB.store.searchKeyStore.remove(id).then(() => {
        const i = this.searchkey.findIndex(v => v.id === id);
        i >= 0 && this.searchkey.splice(i, 1);
      }).catch(e => {
        useMessage().error(e.message);
      });

    },
    async search(searchkey: string, author: string | null, group: string, callback?: (progress: number) => void): Promise<void> {
      const win = useWindowStore();
      const { searchBoxHeaderText } = storeToRefs(win);
      const { threadsNumber } = storeToRefs(useSettingsStore());
      try {
        if (this.isRunningSearch) {
          return;
        }
        this.searchResult = [];
        this.isRunningSearch = true;
        win.disableShowSearchBox.set(PagePath.SEARCH, true);
        this.currentPage = 0;
        this.scrolltop = 0;
        let searchProgress = 0;
        searchBoxHeaderText.value = `正在搜索(${searchProgress * 100}%) ${searchkey}`;
        let finish = 0;
        const plugins = GLOBAL_PLUGINS.getPluginsByType(PluginType.BOOK_SOURCE, {
          enable: true,
          group
        });
        const threads = chunkArray(plugins, threadsNumber.value);
        for (const bookSources of threads) {
          const p = [];
          for (const { props, instance } of bookSources) {
            const start = Date.now();
            p.push(instance.search(searchkey).then(vs => {
              const end = Date.now();
              this.searchResult.push(...vs.filter(v => {
                if (isNull(author)) {
                  return v.bookname.includes(searchkey) || v.author.includes(searchkey);
                } else {
                  return v.author.trim() === author;
                }
              }).map<SearchResult>(e => ({
                bookname: e.bookname?.trim(),
                author: e.author?.trim(),
                coverImageUrl: e.coverImageUrl?.trim(),
                detailPageUrl: e.detailPageUrl?.trim(),
                latestChapterTitle: e.latestChapterTitle?.trim(),
                sourceName: props.NAME,
                group: props.GROUP,
                pid: props.ID,
                time: end - start
              })));
            }).catch((e: any) => {
              GLOBAL_LOG.error(`Search ${searchkey} ID:${props.ID}, NAME:${props.NAME}`, e);
            }).finally(() => {
              searchProgress = Number(((++finish) / plugins.length).toFixed(2));
              callback && callback(searchProgress);
            }));
          }
          await Promise.allSettled(p);
        }
      } catch (e) {
        GLOBAL_LOG.error('Search store search', e);
        return errorHandler(e);
      } finally {
        searchBoxHeaderText.value = searchkey;
        this.isRunningSearch = false;
        win.disableShowSearchBox.set(PagePath.SEARCH, false);
      }
    }
  }
});