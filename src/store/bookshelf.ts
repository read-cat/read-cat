import { defineStore } from 'pinia';
import { BookshelfStoreEntity } from '../core/database/database';
import { useMessage } from '../hooks/message';
import { chunkArray, errorHandler, replaceInvisibleStr } from '../core/utils';
import { isNull, isUndefined } from '../core/is';
import { BookSource } from '../core/plugins/plugins';
import { useSettingsStore } from './settings';

export type Book = {
  id: string,
  pid: string,
  detailPageUrl: string,
  bookname: string,
  author: string,
  coverImageUrl: string,
  latestChapterTitle?: string,
  searchIndex: string,
  readIndex: number,
  readChapterTitle: string,
  timestamp: number,
  pluginVersionCode: number,
  baseUrl: string,
  group: string,
  pluginName: string
}
export type BookRefresh = {
  isRunningRefresh: boolean,
  error?: string,
} & Book;

export const useBookshelfStore = defineStore('Bookshelf', {
  state: () => {
    return {
      _books: [] as BookRefresh[],
      currentPage: 1,
      refreshed: false
    }
  },
  getters: {
    books(): BookRefresh[] {
      this._books.length <= 0 && (this.currentPage = 1);
      return this._books.sort((a, b) => b.timestamp - a.timestamp);
    },
  },
  actions: {
    async getBookshelfEntity(pid: string, detailPageUrl: string) {
      try {
        return await GLOBAL_DB.store.bookshelfStore.getByPidAndDetailPageUrl(pid, detailPageUrl);
      } catch (e: any) {
        useMessage().error(e.message);
        return errorHandler(e);
      }
    },
    exist(pid: string, detailPageUrl: string) {
      return this._books.findIndex(v => v.pid === pid && v.detailPageUrl === detailPageUrl) >= 0;
    },
    async put(entity: BookshelfStoreEntity): Promise<void> {
      try {
        const _entity = replaceInvisibleStr(entity);
        if (!entity.id.trim()) {
          throw `ID为空`;
        }
        if (!entity.pid.trim() || !entity.detailPageUrl.trim()) {
          throw `PID或DetailUrl为空`;
        }
        await GLOBAL_DB.store.bookshelfStore.put(_entity);
        const {
          id,
          pid,
          detailPageUrl,
          bookname,
          author,
          coverImageUrl,
          chapterList,
          latestChapterTitle,
          searchIndex,
          readIndex,
          timestamp,
          pluginVersionCode,
          baseUrl
        } = _entity;
        const props = GLOBAL_PLUGINS.getPluginPropsById(pid);
        if (isUndefined(props)) {
          throw new Error('插件属性获取失败');
        }
        const obj: Book = {
          id,
          pid,
          detailPageUrl,
          bookname,
          author,
          coverImageUrl,
          latestChapterTitle,
          searchIndex,
          readIndex,
          readChapterTitle: chapterList[readIndex]?.title,
          timestamp,
          pluginVersionCode,
          baseUrl,
          group: props.GROUP,
          pluginName: props.NAME
        }
        const i = this._books.findIndex(v => v.id === id);
        if (i >= 0) {
          this._books[i] = {
            isRunningRefresh: false,
            error: void 0,
            ...obj
          };
        } else {
          this._books.push({
            isRunningRefresh: false,
            error: void 0,
            ...obj
          });
        }
      } catch (e: any) {
        useMessage().error(e.message);
        return errorHandler(e);
      }
    },
    async remove(id: string) {
      try {
        const i = this._books.findIndex(v => v.id = id);
        if (i >= 0) {
          await GLOBAL_DB.store.bookshelfStore.remove(id);
          this._books.splice(i, 1);
        }
      } catch (e: any) {
        useMessage().error(e.message);
        return errorHandler(e);
      }
    },
    async removeByPidAndDetailUrl(pid: string, detailUrl: string): Promise<void> {
      try {
        const i = this._books.findIndex(v => v.pid === pid && v.detailPageUrl === detailUrl);
        if (i >= 0) {
          await GLOBAL_DB.store.bookshelfStore.removeByPidAndDetailPageUrl(pid, detailUrl);
          this._books.splice(i, 1);
        }
      } catch (e: any) {
        useMessage().error(e.message);
        return errorHandler(e);
      }
    },
    async refresh(id: string): Promise<void> {
      const index = this._books.findIndex(b => b.id === id);
      if (index < 0 || this._books[index].isRunningRefresh) {
        return;
      }
      const db = await GLOBAL_DB.store.bookshelfStore.getById(id);
      if (isNull(db)) {
        return;
      }
      try {
        const { pid, detailPageUrl } = this._books[index];
        const plugin = GLOBAL_PLUGINS.getPluginById<BookSource>(pid);
        if (isUndefined(plugin)) {
          throw `无法获取插件, 插件ID:${pid}`;
        }
        const { props, instance } = plugin;
        if (props.BASE_URL.trim() !== this._books[index].baseUrl.trim()) {
          throw `插件请求目标链接[BASE_URL]不匹配`;
        }
        this._books[index].isRunningRefresh = true;
        const detail = await instance.getDetail(detailPageUrl);
        await this.put({
          id: db.id,
          pid: db.pid,
          detailPageUrl: db.detailPageUrl,
          pluginVersionCode: db.pluginVersionCode,
          readIndex: db.readIndex,
          readScrollTop: db.readScrollTop,
          searchIndex: db.searchIndex,
          timestamp: db.timestamp,
          baseUrl: db.baseUrl,
          ...detail
        });
      } catch (e: any) {
        this._books[index].error = e;
        GLOBAL_LOG.error(`Bookshelf refresh bookId:${id}`, e);
        return errorHandler(e);
      } finally {
        this._books[index].isRunningRefresh = false;
      }

    },
    async refreshAll() {
      const { threadsNumber } = useSettingsStore();
      const threads = chunkArray(this._books, threadsNumber);
      for (const thread of threads) {
        const ps: Promise<void>[] = [];
        for (const book of thread) {
          if (book.isRunningRefresh) {
            continue;
          }
          ps.push(this.refresh(book.id));
        }
        await Promise.allSettled(ps);
      }
    },
  }
});