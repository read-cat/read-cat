import { defineStore } from 'pinia';
import { BookmarkStoreEntity } from '../core/database/database';
import { useMessage } from '../hooks/message';
import { cloneByJSON, errorHandler } from '../core/utils';

export const useBookmarkStore = defineStore('Bookmark', {
  state: () => {
    return {
      _bookmarks: new Map<string, BookmarkStoreEntity>(),
    }
  },
  getters: {
    bookmarks(): BookmarkStoreEntity[] {
      return Array.from(this._bookmarks.values()).sort((a, b) => b.timestamp - a.timestamp);
    }
  },
  actions: {
    getBookmarkByChapterUrl(chapterUrl: string) {
      return Array.from(this._bookmarks.values()).find(b => b.chapterUrl === chapterUrl);
    },
    getBookmarkById(id: string) {
      return this._bookmarks.get(id);
    },
    getBookmarksByDetailUrl(detailUrl: string) {
      return Array.from(this._bookmarks.values()).filter(b => b.detailUrl === detailUrl);
    },
    async put(bookmark: BookmarkStoreEntity) {
      await GLOBAL_DB.store.bookmarkStore.put(bookmark);
      const id = Array.from(this._bookmarks.values()).find(v => v.chapterUrl === bookmark.chapterUrl)?.id;
      this._bookmarks.set(id || bookmark.id, bookmark);
    },
    async removeBookmarkRangeByBidAndId(bid: string, rid: string) {
      const b = this._bookmarks.get(bid);
      if (!b) {
        return;
      }
      const range = b.range.filter(r => r.id !== rid);
      if (range.length > 0) {
        const clone = cloneByJSON(b);
        clone.range = range;
        await this.put(clone);
      } else {
        await GLOBAL_DB.store.bookmarkStore.remove(bid);
        this._bookmarks.delete(b.id);
      }
    },
    async removeBookmarksByDetailUrl(detailUrl: string): Promise<void> {
      try {
        await GLOBAL_DB.store.bookmarkStore.removeByDetailUrl(detailUrl);
        Array.from(this._bookmarks.values())
          .filter(b => b.detailUrl === detailUrl)
          .forEach(({ id }) => this._bookmarks.delete(id));
      } catch (e) {
        useMessage().error(errorHandler(e, true));
        return errorHandler(e);
      }
    },
  }
});