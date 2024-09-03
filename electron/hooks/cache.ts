import { session, ipcMain, app } from 'electron';
import { EventCode } from '../../events';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export const useCache = () => {
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
