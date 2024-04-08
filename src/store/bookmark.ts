import { defineStore } from 'pinia';
import { BookmarkStoreEntity } from '../core/database/database';
import { useMessage } from '../hooks/message';
import { errorHandler } from '../core/utils';

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