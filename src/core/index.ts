import { Logger } from './logger';
import { EventCode } from '../../events';
import { Plugins } from './plugins';
import { Database } from './database';
import { IpcRenderer } from './ipc-renderer';
import path from 'path';
import metadata from '../../metadata.json';
import { useSettingsStore } from '../store/settings';
import { createUpdater } from './updater';
import { Updater } from './updater/updater';
import Module from 'module';
import { isPluginContext, newError } from './utils';
import FormDataType from 'form-data';

const NodeFormData: typeof FormDataType = require('form-data');

export type Sandbox = {
  process: NodeJS.Process
}

export class Core {
  static logger: Logger;
  static ipc: IpcRenderer;
  static plugins: Plugins;
  static database: Database;
  static userDataPath: string | undefined;
  static isDev: boolean;
  static updater: Updater;
  static sandbox: Sandbox;

  static async init(): Promise<Error[] | undefined> {
    try {
      const load = (<any>Module)._load;
      (<any>Module)._load = (requests: string, parent: any, isMain: boolean) => {
        if (isPluginContext()) {
          throw newError(`Illegal function call require('${requests}')`);
        }
        return load(requests, parent, isMain);
      }
      Core.sandbox = new Proxy({
        process
      }, {
        get(target, p) {
          if (isPluginContext()) {
            throw newError(`Permission denied to access property sandbox.${p.toString()}`);
          }
          return Reflect.get(target, p);
        },
        set() {
          return false;
        },
      });
      Core.setValue(window, 'setEnv', (key: string, value: string) => {
        Core.sandbox.process.env[key] = value;
      });
      Core.setValue(window, 'getEnv', (key: string) => {
        return Core.sandbox.process.env[key];
      });
      Core.setValue(window, 'process', {
        platform: process.platform,
        cwd: process.cwd,
        versions: process.versions
      });
      Core.setValue(window, 'module', {});
      const error: Error[] = [];
      Core.setValue(window, 'METADATA', metadata);
      Core.setValue(NodeFormData.prototype, Symbol.toStringTag, 'NodeFormData');
      Core.setValue(window, 'NodeFormData', NodeFormData);
      try {
        Core.initLogger();
      } catch (e: any) {
        error.push(e);
      }
      Core.initUpdater();
      await Core.initDatabase().catch(e => {
        error.push(e);
        return Promise.resolve();
      });
      await Core.initPlugins().catch(e => {
        error.push(e);
        return Promise.resolve();
      });

      GLOBAL_DB?.store.bookshelfStore.read();
      Core.setValue(window, 'Core', Core);
      if (error.length > 0) {
        return Promise.resolve(error);
      }
    } catch (e: any) {
      return Promise.resolve([e]);
    }
  }

  public static setValue(obj: any, key: any, value: any) {
    Object.defineProperty(obj, key, {
      get() {
        if (!Core.isDev && isPluginContext()) {
          throw newError(`Permission denied to access property or function [${String(key)}]`);
        }
        return value;
      },
      configurable: false,
    });
  }

  public static initLogger() {
    if (!Core.userDataPath) {
      throw newError('userDataPath is undefined');
    }
    Core.setValue(Core, 'logger', new Logger({
      enableWriteToFile: !Core.isDev,
      savePath: `${path.join(Core.userDataPath, 'logs')}`,
      debug: Core.isDev
    }));
    Core.setValue(window, 'GLOBAL_LOG', Core.logger);
  }

  public static initUpdater() {
    const { update } = useSettingsStore();
    const updater = createUpdater(update.source);
    Core.setValue(Core, 'updater', updater);
    Core.setValue(window, 'GLOBAL_UPDATER', Core.updater);
  }

  public static async initIpcRenderer() {
    return new Promise<void>((reso, reje) => {
      try {
        Core.setValue(Core, 'ipc', new IpcRenderer());
        Core.setValue(window, 'GLOBAL_IPC', Core.ipc);
        Core.isDev = Core.ipc.sendSync<boolean>(EventCode.SYNC_IS_DEV);
        const userDataPath = Core.ipc.sendSync<string>(EventCode.SYNC_GET_USER_DATA_PATH);
        Core.setValue(Core, 'userDataPath', userDataPath || void 0);
        return reso();
      } catch (e) {
        return reje(e);
      }
    });
  }

  public static async initPlugins() {
    Core.setValue(Core, 'plugins', new Plugins());
    Core.setValue(window, 'GLOBAL_PLUGINS', Core.plugins);
    await Core.plugins.importPool();
  }

  public static async initDatabase() {
    const db = new Database();
    await db.open();
    await db.store.settingsStore.read().finally(() => db.store.settingsStore.watch());
    Core.setValue(Core, 'database', db);
    Core.setValue(window, 'GLOBAL_DB', Core.database);
  }
}