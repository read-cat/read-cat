import { isUndefined } from '../../is';
import { DatabaseStoreInterface } from '../database';
import { cloneByJSON } from '../../utils';

export class BaseStoreDatabase<T> implements DatabaseStoreInterface<T> {
  public db: IDBDatabase;
  storeName: string;
  tag: string;
  constructor(db: IDBDatabase, storeName: string, tag: string) {
    this.db = db;
    this.storeName = storeName;
    this.tag = tag;
  }
  revocationProxy<R = any>(obj: R): R {
    return cloneByJSON(obj);
  }
  getById(id: string): Promise<T | null> {
    return new Promise<T | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_id')
          .get(id);
        requ.onsuccess = () => {
          let result: T | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, 'getById', id, requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'getById', id, e);
        return reje(e);
      }

    });
  }
  getAll(): Promise<T[] | null> {
    return new Promise<T[] | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .getAll();
        requ.onsuccess = () => {
          let result = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, 'getAll', requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'getAll', e);
        return reje(e);
      }
    });
  }
  /**
   * @param revocationProxy 使用cloneByJSON撤销Proxy
   * @default true
   */
  put(val: T, revocationProxy = true): Promise<void> {
    return new Promise<void>((reso, reje) => {
      try {
        const _val = revocationProxy ? this.revocationProxy(val) : val;
        const requ = this.db
          .transaction([this.storeName], 'readwrite')
          .objectStore(this.storeName)
          .put(_val);
        requ.onsuccess = () => {
          return reso();
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, 'put', requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'put', e);
        return reje(e);
      }
    });
  }
  remove(id: string): Promise<void> {
    return new Promise<void>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readwrite')
          .objectStore(this.storeName)
          .delete(id);
        requ.onsuccess = () => {
          return reso();
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, 'remove', id, requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'remove', id, e);
        return reje(e);
      }
    });
  }
  useCursorRemove(indexName: string, keys: any[]): Promise<void> {
    return new Promise<void>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readwrite')
          .objectStore(this.storeName)
          .index(indexName)
          .openCursor(IDBKeyRange.only(keys));

        requ.onsuccess = () => {
          if (!requ.result) {
            return reso();
          }
          requ.result.delete();
          requ.result.continue();
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, 'useCursorRemove', indexName, ...keys, requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'useCursorRemove', indexName, ...keys, e);
        return reje(e);
      }
    });
  }

}