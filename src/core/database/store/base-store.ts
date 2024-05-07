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
          throw requ.error;
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
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'getAll', e);
        return reje(e);
      }
    });
  }
  put(val: T): Promise<void> {
    return new Promise<void>((reso, reje) => {
      try {
        const _val = this.revocationProxy(val);
        const requ = this.db
          .transaction([this.storeName], 'readwrite')
          .objectStore(this.storeName)
          .put(_val);
        requ.onsuccess = () => {
          return reso();
        }
        requ.onerror = () => {
          throw requ.error;
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
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, 'remove', id, e);
        return reje(e);
      }
    });
  }
  
}