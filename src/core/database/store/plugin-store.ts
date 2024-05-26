import { toRaw } from 'vue';
import { isNull, isUndefined } from '../../is';
import { PluginsStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';
import { errorHandler } from '../../utils';

export class PluginsStoreDatabase extends BaseStoreDatabase<PluginsStoreEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'PluginsStoreDatabase');
  }

  getAllByPid(pid: string): Promise<PluginsStoreEntity[] | null> {
    return new Promise<PluginsStoreEntity[] | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_pid')
          .getAll(pid);
        requ.onsuccess = () => {
          let result: PluginsStoreEntity[] | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, `getByPid pid:${pid}`, requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByPid pid:${pid}`, e);
        return reje(e);
      }
    });
  }
  getByPidAndKey(pid: string, key: string): Promise<PluginsStoreEntity | null> {
    return new Promise<PluginsStoreEntity | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_pid_key')
          .get(IDBKeyRange.only([pid, key]));
        requ.onsuccess = () => {
          let result: PluginsStoreEntity | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, `getByIdAndKey pid:${pid}, key:${key}`, requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByIdAndKey pid:${pid}, key:${key}`, e);
        return reje(e);
      }

    });
  }
  async put(val: PluginsStoreEntity): Promise<void> {
    try {
      const _val = toRaw(val);
      const raw = await this.getByPidAndKey(_val.pid, _val.key);
      await super.put({
        ..._val,
        id: isNull(raw) ? _val.id : raw.id
      });
    } catch (e) {
      return errorHandler(e);
    }
  }
  async removeByPidAndKey(pid: string, key: string): Promise<void> {
    try {
      const val = await this.getByPidAndKey(pid, key);
      if (isNull(val)) {
        return;
      }
      await this.remove(val.id);
    } catch (e) {
      GLOBAL_LOG.error(this.tag, `removeByIdAndKey pid:${pid}, key:${key}`, e);
      return errorHandler(e);
    }
  }
  removeByPid(pid: string): Promise<void> {
    return super.useCursorRemove('index_pid', [pid]);
  }
}