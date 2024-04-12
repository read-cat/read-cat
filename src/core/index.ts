import { Logger } from './logger';
import { EventCode } from '../../events';
import { Plugins } from './plugins';
import { Database } from './database';
import { Font } from './font';
import { IpcRenderer } from './ipc-renderer';
import path from 'path';
import metadata from '../../metadata.json';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../store/settings';
import { createUpdater } from './updater';
import { Updater } from './updater/updater';

export class Core {
  static logger: Logger;
  static ipc: IpcRenderer;
  static plugins: Plugins;
  static database: Database;
  static font: Font;
  static userDataPath: string;
  static isDev: boolean;
  static updater: Updater;

  static async init(): Promise<Error[] | undefined> {
    const error: Error[] = [];
    Core.setValue(window, 'METADATA', metadata);
    Core.initUpdater();
    // Core.initIpcRenderer();
    Core.initLogger();
    await Core.initDatabase().catch(e => error.push(e));
    await Core.initPlugins().catch(e => error.push(e));
    await Core.initFont().catch(e => error.push(e));
    GLOBAL_DB.store.bookshelfStore.read();
    Core.setValue(window, 'Core', Core);
    if (error.length > 0) {
      return Promise.reject(error);
    }
  }

  public static setValue(obj: any, key: string, value: any) {
    Object.defineProperty(obj, key, {
      set() {
        return;
      },
      get() {
        return value;
      },
    });
  }

  public static initLogger() {
    Core.setValue(Core, 'logger', new Logger({
      enableWriteToFile: !Core.isDev,
      savePath: `${path.join(Core.userDataPath, 'logs')}`,
      debug: Core.isDev
    }));
    Core.setValue(window, 'GLOBAL_LOG', Core.logger);
  }

  public static initUpdater() {
    const { updateSource } = storeToRefs(useSettingsStore());
    const updater = createUpdater(updateSource.value);
    Core.setValue(Core, 'updater', updater);
    Core.setValue(window, 'GLOBAL_UPDATER', Core.updater);
  }

  public static initIpcRenderer() {
    Core.setValue(Core, 'ipc', new IpcRenderer());
    Core.setValue(window, 'GLOBAL_IPC', Core.ipc);
    const userDataPath = Core.ipc.sendSync<string>(EventCode.SYNC_GET_USER_DATA_PATH);
    if (!userDataPath) {
      throw 'user data path is null';
    }
    Core.setValue(Core, 'userDataPath', userDataPath);
    Core.setValue(Core, 'isDev', Core.ipc.sendSync<boolean>(EventCode.SYNC_IS_DEV));
  }

  public static async initPlugins() {
    Core.setValue(Core, 'plugins', new Plugins());
    Core.setValue(window, 'GLOBAL_PLUGINS', Core.plugins);
    await Core.plugins.importPool();
    /* // 弃用 
     const load = (Module as any)._load;
     (Module as any)._load = (requests: string, parent: any, isMain: boolean) => {
     // 校验插件是否使用require导入模块, 若导入则该模块指向Error
     // 禁止在插件中使用require导入模块
     // console.log('Module load', requests, parent, GLOBAL_PLUGINS.isPlugin(parent.exports), GLOBAL_PLUGINS.tempPluginFilePaths.has(parent.filename));
     console.log(requests, parent);
     
     if (GLOBAL_PLUGINS.isPlugin(parent.exports) || GLOBAL_PLUGINS.tempPluginFilePaths.has(parent.filename)) {
       return new Error('Permission denied');
     }
     return load(requests, parent, isMain);
   } */
  }

  public static async initDatabase() {
    const db = new Database();
    await db.open();
    Core.setValue(Core, 'database', db);
    Core.setValue(window, 'GLOBAL_DB', Core.database);
  }

  public static async initFont() {
    Core.setValue(Core, 'font', new Font());
    Core.setValue(window, 'GLOBAL_FONT', Core.font);
    await Core.font.importPool();
  }
}