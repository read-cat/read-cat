import { defineStore } from 'pinia';
import { BookmarkStoreEntity } from '../core/database/database';
import { useMessage } from '../hooks/message';
import { cloneByJSON, errorHandler } from '../core/utils';

export const useBookmarkStore = defineStore('Bookmark', {
  state: () => {
    return {
      _bookmarks: [] as BookmarkStoreEntity[]
    }
  },
  getters: {
    bookmarks(): BookmarkStoreEntity[] {
      return this._bookmarks.sort((a, b) => b.timestamp - a.timestamp);
    }
  },
  actions: {
    getBookmarkByChapterUrl(chapterUrl: string) {
      return this._bookmarks.find(b => b.chapterUrl === chapterUrl);
    },
    getBookmarkById(id: string) {
      return this._bookmarks.find(b => b.id === id);
    },
    getBookmarksByDetailUrl(detailUrl: string) {
      return this._bookmarks.filter(b => b.detailUrl === detailUrl);
    },
    async put(bookmark: BookmarkStoreEntity) {
      await GLOBAL_DB.store.bookmarkStore.put(bookmark);
      const i = this._bookmarks.findIndex(v => v.chapterUrl === bookmark.chapterUrl);
      if (i >= 0) {
        this._bookmarks[i] = bookmark;
      } else {
        this._bookmarks.push(bookmark);
      }
    },
    async removeBookmarkRangeByBidAndId(bid: string, rid: string) {
      const bi = this._bookmarks.findIndex(b => b.id === bid);
      if (bi < 0) {
        return;
      }
      const range = this._bookmarks[bi].range.filter(r => r.id !== rid);
      if (range.length > 0) {
        const clone = cloneByJSON(this._bookmarks[bi]);
        clone.range = range;
        await this.put(clone);
      } else {
        await GLOBAL_DB.store.bookmarkStore.remove(bid);
        this._bookmarks.splice(bi, 1)
      }
    },
    async removeBookmarksByDetailUrl(detailUrl: string): Promise<void> {
      try {
        await GLOBAL_DB.store.bookmarkStore.removeByDetailUrl(detailUrl);
        const bookmarks = this._bookmarks.filter(b => b.detailUrl === detailUrl);
        bookmarks.forEach(b => {
          const i = this._bookmarks.findIndex(v => v.id === b.id);
          this._bookmarks.splice(i, 1);
        });
      } catch (e) {
        useMessage().error(errorHandler(e, true));
        return errorHandler(e);
      }
    },
  }
});