import { serialize, deserialize } from 'v8';
import { isNull, isUndefined } from '../is';
import { nanoid } from 'nanoid';
import { errorHandler } from '../utils';
import { CreatePluginStore, PluginStoreInterface } from './plugins';

export const createPluginStore: CreatePluginStore = (pid: string, maxByteLength: number) => {
  return new PluginStore(pid, maxByteLength);
}

class PluginStore implements PluginStoreInterface {
  private readonly pid: string;
  private readonly maxByteLength: number;
  constructor(pid: string, maxByteLength: number) {
    this.pid = pid;
    this.maxByteLength = maxByteLength;
  }
  async currentSize(): Promise<number> {
    let size = 0;
    const obj = await GLOBAL_DB.store.pluginsStore.getById(this.pid);
    if (!isNull(obj)) {
      size += obj.data.byteLength;
    }
    return size;
  }
  async getStoreValue<R = any>(key: string): Promise<R | null> {
    try {
      const val = await GLOBAL_DB.store.pluginsStore.getByPidAndKey(this.pid, key);
      if (isNull(val)) {
        return null;
      }
      if (isUndefined(val.data)) {
        return null;
      }
      return deserialize(val.data);
    } catch (e) {
      GLOBAL_LOG.error(`Plugin getStoreValue PLUGIN_ID:${this.pid}, error:`, e);
      return errorHandler(e);
    }
  }
  async setStoreValue<V = any>(key: string, value: V): Promise<void> {
    try {
      const data = new Uint8Array(serialize(value));
      const csize = await this.currentSize();
      if (csize >= this.maxByteLength || (csize + data.byteLength) >= this.maxByteLength) {
        throw `The current store size is ${csize} bytes, and the maximum support is ${this.maxByteLength} bytes`;
      }
      await GLOBAL_DB.store.pluginsStore.put({
        id: nanoid(),
        pid: this.pid,
        key,
        data
      });
    } catch (e) {
      GLOBAL_LOG.error(`Plugin setStoreValue PLUGIN_ID:${this.pid}, error:`, e);
      return errorHandler(e);
    }
  }
  async removeStoreValue(key: string): Promise<void> {
    try {
      await GLOBAL_DB.store.pluginsStore.removeByPidAndKey(this.pid, key);
    } catch (e) {
      return errorHandler(e);
    }
  }
}