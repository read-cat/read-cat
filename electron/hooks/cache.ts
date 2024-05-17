import { session, ipcMain, app } from 'electron';
import { EventCode } from '../../events';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export const useCache = () => {
  const cachePath = session.defaultSession.storagePath || app.getPath('userData');
  let running = false;

  const getDirSize = async (path: string): Promise<number> => {
    const files = await fs.readdir(path);
    let size = 0;
    for (const file of files) {
      try {
        const fullpath = join(path, file);
        const stat = await fs.stat(fullpath);
        if (stat.isDirectory()) {
          size += await getDirSize(fullpath);
        } else if (stat.isFile()) {
          size += stat.size;
        }
      } catch (e) {
        continue;
      }
    }
    return size;
  }

  ipcMain.on(EventCode.ASYNC_GET_CACHE_SIZE, e => {
    if (running) {
      return;
    }
    running = true;
    getDirSize(cachePath).then(size => {
      e.sender.send(EventCode.ASYNC_GET_CACHE_SIZE, {
        error: void 0,
        size
      });
    }).catch(err => {
      e.sender.send(EventCode.ASYNC_GET_CACHE_SIZE, {
        error: err.message,
        size: void 0
      });
    }).finally(() => {
      running = false;
    });
  });

  ipcMain.on(EventCode.ASYNC_CLEAR_CACHE, async e => {
    try {
      await session.defaultSession.clearCache();
      await session.defaultSession.clearStorageData();
      const userData = app.getPath('userData');
      const logs = join(userData, 'logs');
      const pluginDevtools = join(userData, 'plugin-devtools');
      try {
        if (existsSync(pluginDevtools)) {
          await fs.rm(pluginDevtools, {
            recursive: true,
            force: true
          });
        }
      } catch (e) { }
      try {
        if (existsSync(logs)) {
          await fs.rm(logs, {
            recursive: true,
            force: true
          });
        }
      } catch (e) { }
      e.sender.send(EventCode.ASYNC_CLEAR_CACHE, void 0);
    } catch (err: any) {
      e.sender.send(EventCode.ASYNC_CLEAR_CACHE, err.message);
    }
  });

}
