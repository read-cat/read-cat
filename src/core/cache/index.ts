import { EventCode } from '../../../events';
import { newError } from '../utils';

export class Cache {


  public static async getCacheSize() {
    return new Promise<number>((reso, reje) => {
      GLOBAL_IPC.once(EventCode.ASYNC_GET_CACHE_SIZE, (_, { error, size }) => {
        if (error) {
          return reje(newError(error));
        }
        return reso(size);
      });
      GLOBAL_IPC.send(EventCode.ASYNC_GET_CACHE_SIZE);
    });
  }

  public static async clearCache() {
    return new Promise<void>((reso, reje) => {
      GLOBAL_IPC.once(EventCode.ASYNC_CLEAR_CACHE, (_, error) => {
        if (error) {
          return reje(newError(error));
        }
        return reso();
      });
      GLOBAL_IPC.send(EventCode.ASYNC_CLEAR_CACHE);
    });
  }
}