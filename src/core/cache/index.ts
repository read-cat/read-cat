import { Core } from '..';
import { EventCode } from '../../../events';
import { getDirectorySize } from '../../worker';
import { newError } from '../utils';

export class Cache {


  public static async getCacheSize() {
    if (!Core.userDataPath) {
      throw newError('userDataPath is undefined');
    }
    return await getDirectorySize(Core.userDataPath);
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