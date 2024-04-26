import { isNull } from '../is';
import { SearchKeyStoreDatabase } from './store/searchkey-store';
import { HistoryStoreDatabase } from './store/history-store';
import { PluginsStoreDatabase } from './store/plugin-store';
import { PluginsJSCodeDatabase } from './store/plugins-jscode';
import { BookshelfStoreDatabase } from './store/bookshelf-store';
import { TextContentStoreDatabase } from './store/text-content-store';
import { BookmarkStoreDatabase } from './store/bookmark-store';
import { SettingsStoreDatabase } from './store/settings-store';
import { newError } from '../utils';
import { ReadColorStoreDatabase } from './store/read-color-store';

export enum StoreName {
  PLUGINS = 'store_plugins_jscode',
  PLUGINS_STORE = 'store_plugins_store',
  HISTORY = 'store_history',
  SEARCH_KEY = 'store_searchkey',
  BOOKSHELF = 'store_bookshelf',
  TEXT_CONTENT = 'store_text_content',
  BOOKMARK = 'store_bookmark',
  SETTINGS = 'store_settings',
  READ_COLOR = 'store_read_color',
}

export class Database {
  public static readonly VERSION: number = 7;
  public static readonly NAME: string = 'ReadCatDatabase';

  private db: IDBDatabase | null = null;

  private _store: {
    pluginsJSCode: PluginsJSCodeDatabase,
    pluginsStore: PluginsStoreDatabase,
    historyStore: HistoryStoreDatabase,
    searchKeyStore: SearchKeyStoreDatabase,
    bookshelfStore: BookshelfStoreDatabase,
    textContentStore: TextContentStoreDatabase,
    bookmarkStore: BookmarkStoreDatabase,
    settingsStore: SettingsStoreDatabase,
    readColorStore: ReadColorStoreDatabase,
  } | null = null;
  constructor() {

  }

  public get store() {
    if (isNull(this._store)) {
      throw newError('Database opening failure');
    }
    return this._store;
  }
  private initStore() {
    if (isNull(this.db)) {
      throw newError('Database opening failure');
    }
    if (isNull(this._store)) {
      this._store = {
        pluginsJSCode: new PluginsJSCodeDatabase(this.db, StoreName.PLUGINS),
        pluginsStore: new PluginsStoreDatabase(this.db, StoreName.PLUGINS_STORE),
        historyStore: new HistoryStoreDatabase(this.db, StoreName.HISTORY),
        searchKeyStore: new SearchKeyStoreDatabase(this.db, StoreName.SEARCH_KEY),
        bookshelfStore: new BookshelfStoreDatabase(this.db, StoreName.BOOKSHELF),
        textContentStore: new TextContentStoreDatabase(this.db, StoreName.TEXT_CONTENT),
        bookmarkStore: new BookmarkStoreDatabase(this.db, StoreName.BOOKMARK),
        settingsStore: new SettingsStoreDatabase(this.db, StoreName.SETTINGS),
        readColorStore: new ReadColorStoreDatabase(this.db, StoreName.READ_COLOR),
      };
    }

  }
  public open() {
    return new Promise<void>((reso, reje) => {
      try {
        const requ = indexedDB.open(Database.NAME, Database.VERSION);
        requ.onupgradeneeded = async () => {
          this.db = requ.result;
          await this.createDatabase();
          this.initStore();
          return reso();
        }
        requ.onsuccess = () => {
          this.db = requ.result;
          this.initStore();
          return reso();
        }
        requ.onerror = () => {
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error('Database open', e);
        return reje(e);
      }
    });
  }
  public close() {
    this.db?.close();
  }

  private createStore(storeName: string, storeParams: IDBObjectStoreParameters | null, indexs: {
    name: string,
    keyPath: string | Iterable<string>,
    options?: IDBIndexParameters
  }[] | null) {
    return new Promise<void>((reso, reje) => {
      try {
        if (isNull(this.db)) {
          throw newError('Database opening failure');
        }
        if (this.db.objectStoreNames.contains(storeName)) {
          return;
        }
        const store = this.db.createObjectStore(storeName, isNull(storeParams) ? void 0 : storeParams);
        if (!isNull(indexs)) {
          for (const index of indexs) {
            store.createIndex(index.name, index.keyPath, index.options);
          }
        }
        store.transaction.oncomplete = () => {
          return reso();
        }
        store.transaction.onerror = () => {
          throw store.transaction.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(`Database createStore ${storeName}`, e);
        return reje(e);
      }
    });
  }
  private async createDatabase() {
    return Promise.all([
      this.createStore(StoreName.PLUGINS, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }]),
      this.createStore(StoreName.PLUGINS_STORE, {
        keyPath: 'id'
      }, [{
        name: 'index_pid_key',
        keyPath: ['pid', 'key'],
        options: {
          unique: true
        }
      }, {
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }]),
      this.createStore(StoreName.SEARCH_KEY, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }]),
      this.createStore(StoreName.BOOKSHELF, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }, {
        name: 'index_pid_url',
        keyPath: ['pid', 'detailPageUrl'],
        options: {
          unique: true
        }
      }]),
      this.createStore(StoreName.TEXT_CONTENT, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }, {
        name: 'index_pid_chapterUrl',
        keyPath: ['pid', 'chapter.url'],
        options: {
          unique: true
        }
      }, {
        name: 'index_pid_detailUrl',
        keyPath: ['pid', 'detailUrl'],
        options: {
          unique: false
        }
      }]),
      this.createStore(StoreName.BOOKMARK, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }, {
        name: 'index_chapterUrl',
        keyPath: ['chapterUrl'],
        options: {
          unique: false
        }
      }, {
        name: 'index_detailUrl',
        keyPath: ['detailUrl'],
        options: {
          unique: false
        }
      }]),
      this.createStore(StoreName.SETTINGS, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }]),
      this.createStore(StoreName.READ_COLOR, {
        keyPath: 'id'
      }, [{
        name: 'index_id',
        keyPath: 'id',
        options: {
          unique: true
        }
      }]),
    ]);
  }
}