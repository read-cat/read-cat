import { toRaw } from 'vue';
import { isNull, isUndefined } from '../../is';
import { PluginsStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class PluginsStoreDatabase extends BaseStoreDatabase<PluginsStoreEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'PluginsStoreDatabase');
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
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByIdAndKey pid:${pid}, key:${key}`, e);
        return reje(e);
      }

    });
  }
  put(val: PluginsStoreEntity): Promise<void> {
    return new Promise<void>(async (reso, reje) => {
      try {
        const _val = toRaw(val);
        const raw = await this.getByPidAndKey(_val.pid, _val.key);
        await super.put({
          ..._val,
          id: isNull(raw) ? _val.id : raw.id
        });
        return reso();
      } catch (e) {
        return reje(e);
      }
    });
  }
  removeByPidAndKey(pid: string, key: string): Promise<void> {
    return new Promise<void>(async (reso, reje) => {
      try {
        const val = await this.getByPidAndKey(pid, key);
        if (isNull(val)) {
          return reso();
        }
        await this.remove(val.id);
        return reso();
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `removeByIdAndKey pid:${pid}, key:${key}`, e);
        return reje(e);
      }
    });
  }

}