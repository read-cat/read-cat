import { existsSync, readFileSync } from 'fs';
import { chunkArray, errorHandler, md5, newError } from '../utils';
import { isArray, isDate, isFunction, isNewerVersionPlugin, isNull, isNumber, isString, isUndefined } from '../is';
import { load } from 'cheerio';
import { usePluginsStore } from '../../store/plugins';
import { timeout, interval, sleep } from '../utils/timer';
import { nanoid } from 'nanoid';
import { storeToRefs } from 'pinia';
import { createPluginStore } from './store';
import { useSettingsStore } from '../../store/settings';
import { get as requestGet, post as requestPost } from '../request';
import {
  BasePluginStoreInterface,
  Console,
  CreatePluginStore,
  PluginBaseProps,
  PluginFilter,
  PluginId,
  PluginImportOptions,
  PluginInterface,
  PluginRequestConfig,
  PluginsOptions,
} from './defined/plugins';
import { BookSource } from './defined/booksource';
import { BookStore } from './defined/bookstore';
import { RequestProxy } from '../request/defined/request';
import { isBookSource } from './booksource';
import { isBookStore } from './bookstore';
import { isTTSEngine } from './ttsengine';
import { TextToSpeechEngine } from './defined/ttsengine';
import { EdgeTTSEngine } from './built-in/tts/edge';
import { AliyunTTSEngine } from './built-in/tts/aliyun';
import { Chapter } from '../book/book';
import type { VM } from 'vm2';
import NodeCrypto from 'crypto';
import { uuid, sanitizeHTML, escapeHTML, escapeXML } from '../utils/html';
import { BaiduTTSEngine } from './built-in/tts/baidu';
import { WebSocket } from 'ws';
import { AzureTTSEngine } from './built-in/tts/azure';
import { Core } from '..';
import { SherpaOnnxTTSEngine } from "./built-in/tts/sherpa-onnx";

const WebSocketClient: WebSocket = require('ws').WebSocket;

export enum PluginType {
  BOOK_SOURCE,
  BOOK_STORE,
  TTS_ENGINE,
}
export namespace PluginType {
  const map = new Map<number, PluginType>();
  Object.keys(PluginType).forEach(k => {
    const v = (<any>PluginType)[k];
    if (!isNumber(v)) {
      return;
    }
    map.set(v, v);
  });
  export const valueOf = (val: number) => {
    return map.get(val);
  }
}
export type PluginEventType = 'imported' | 'created' | 'deleted' | 'enabled' | 'disabled';
export class Plugins {
  private pluginsPool: Map<PluginId, {
    enable: boolean,
    updating: boolean,
    // props: PluginBaseProps,
    pluginClass: PluginInterface,
    instance: BookSource | BookStore | TextToSpeechEngine | null,
    builtIn: boolean
  }> = new Map();
  public static readonly UGLIFY_JS = require('uglify-js');
  private pluginsStore: Map<PluginId, BasePluginStoreInterface> = new Map();
  public static readonly PLUGIN_STORE_MAX_BYTE_LENGTH = 4 * 1024 * 1024;
  private storeCreateFunction: CreatePluginStore;
  private consoleImplement: Console;
  private VM: typeof VM = require('vm2').VM;
  private listeners: Map<PluginEventType, Record<string, (pid: string) => void>> = new Map();

  constructor(options?: PluginsOptions) {
    const defaultOptions = {
      storeCreateFunction: createPluginStore,
      console: {
        log: window.console.log.bind(window),
        info: window.console.info.bind(window),
        error: window.console.error.bind(window),
        warn: window.console.warn.bind(window),
        debug: window.console.debug.bind(window),
      },
    }
    const { storeCreateFunction, console } = {
      ...defaultOptions,
      ...options
    }
    this.storeCreateFunction = storeCreateFunction;
    this.consoleImplement = console;
    this.importBuiltIn();
  }
  public on(type: PluginEventType, listener: (pid: string) => void) {
    const key = md5(listener.toString());
    this.listeners.set(type, {
      ...(this.listeners.get(type) || {}),
      [key]: listener
    });
  }
  private callListener(type: PluginEventType, pid: string) {
    const funcs = this.listeners.get(type);
    if (!funcs) {
      return;
    }
    for (const key in funcs) {
      if (Object.hasOwn(funcs, key)) {
        funcs[key](pid);
      }
    }
  }

  public getPluginStore(id: PluginId) {
    let s = this.pluginsStore.get(id);
    if (s) {
      return s;
    }
    s = this.storeCreateFunction(id, Plugins.PLUGIN_STORE_MAX_BYTE_LENGTH);
    this.pluginsStore.set(id, s);
    return s;
  }
  public async disable(id: PluginId): Promise<void> {
    try {
      const plugin = await GLOBAL_DB.store.pluginsJSCode.getById(id);
      const p = this.pluginsPool.get(id);
      if (isUndefined(p)) {
        throw newError(`Cannot find plugin, id:${id}`);
      }
      if (isNull(plugin)) {
        p.enable = false;
        p.instance = null;
        this.callListener('disabled', id);
        return;
      }
      await GLOBAL_DB.store.pluginsJSCode.put({
        ...plugin,
        enable: false
      });
      this.pluginsPool.set(id, {
        enable: false,
        updating: false,
        pluginClass: p.pluginClass,
        instance: null,
        builtIn: false
      });
      this.callListener('disabled', id);
    } catch (e) {
      return errorHandler(e);
    }
  }
  public async enable(id: PluginId): Promise<void> {
    try {
      const plugin = await GLOBAL_DB.store.pluginsJSCode.getById(id);
      const p = this.pluginsPool.get(id);
      if (isUndefined(p)) {
        throw newError(`Cannot find plugin, id:${id}`);
      }
      if (isNull(plugin)) {
        p.enable = true;
        p.instance = this.createPluginClassInstance(p.pluginClass);
        this.callListener('enabled', id);
        return;
      }
      await GLOBAL_DB.store.pluginsJSCode.put({
        ...plugin,
        enable: true
      });
      await this.import(null, plugin.jscode, {
        force: true,
        minify: true,
        enable: true
      });
      this.callListener('enabled', id);
    } catch (e) {
      return errorHandler(e);
    }
  }

  public isEnable(id: PluginId) {
    const p = this.pluginsPool.get(id);
    if (isUndefined(p)) {
      throw newError(`Cannot find plugin, id:${id}`);
    }
    return p.enable;
  }

  public setUpdating(id: PluginId, value: boolean) {
    const p = this.pluginsPool.get(id);
    if (!p) {
      return;
    }
    p.updating = value;
  }
  public getUpdating(id: PluginId) {
    const p = this.pluginsPool.get(id);
    if (!p) {
      return false;
    }
    return p.updating;
  }
  public getPluginInstanceById<R = BookSource | BookStore | TextToSpeechEngine>(id: PluginId): R | null | undefined {
    const val = this.pluginsPool.get(id);
    return val && (<R>val.instance);
  }
  public getPluginClassById(id: string) {
    const val = this.pluginsPool.get(id);
    return val?.pluginClass;
  }
  public getAllPlugins() {
    return Array.from(this.pluginsPool.values());
  }

  private getProps(pluginClass: PluginInterface): PluginBaseProps {
    const props: PluginBaseProps = <any>{};
    for (const key in pluginClass) {
      if (!Object.hasOwn(pluginClass, key)) continue;
      Reflect.set(props, key, (<Record<string, any>>pluginClass)[key]);
    }
    return props;
  }

  public getPluginPropsById(id: PluginId): PluginBaseProps | undefined {
    const val = this.pluginsPool.get(id);
    if (!val) {
      return void 0;
    }
    return this.getProps(val.pluginClass);
  }

  public getPluginById<R>(id: PluginId): {
    props: PluginBaseProps,
    instance: R | null
  } | undefined {
    const plugin = this.pluginsPool.get(id);
    if (isUndefined(plugin)) {
      return;
    }
    const { pluginClass, instance } = plugin;
    const props = this.getProps(pluginClass);
    return { props, instance: (<R>instance) }
  }
  public getPluginsByType(type: PluginType.BOOK_SOURCE, filter?: PluginFilter): {
    props: PluginBaseProps,
    instance: BookSource | null
  }[];
  public getPluginsByType(type: PluginType.BOOK_STORE, filter?: PluginFilter): {
    props: PluginBaseProps,
    instance: BookStore | null
  }[];
  public getPluginsByType(type: PluginType.TTS_ENGINE, filter?: PluginFilter): {
    props: PluginBaseProps,
    instance: TextToSpeechEngine | null
  }[];
  public getPluginsByType(type: PluginType, filter?: PluginFilter): {
    props: PluginBaseProps,
    instance: BookSource | BookStore | TextToSpeechEngine | null
  }[] {
    filter = {
      enable: true,
      group: '',
      ...filter
    }
    return Array.from(this.pluginsPool.values())
      .filter(({ pluginClass }) => {
        if (pluginClass.TYPE !== type) {
          return false;
        }
        if (filter.group && filter.group !== pluginClass.GROUP) {
          return false;
        }
        return true;
      })
      .filter(({ enable }) => enable === filter.enable)
      .filter(({ instance }) => !isNull(instance))
      .map(({ pluginClass, instance }) => {
        return {
          props: this.getProps(pluginClass),
          instance: <BookSource | BookStore | TextToSpeechEngine>instance
        }
      });
  }

  public getPluginInstanceByType(type: PluginType.BOOK_SOURCE, filter?: PluginFilter): (BookSource | null)[];
  public getPluginInstanceByType(type: PluginType.BOOK_STORE, filter?: PluginFilter): (BookStore | null)[];
  public getPluginInstanceByType(type: number, filter?: PluginFilter): (BookSource | BookStore | null)[] {
    return this.getPluginsByType(type, filter).map(p => {
      return p.instance;
    });
  }

  public async delete(id: PluginId) {
    const p = this.pluginsPool.get(id);
    if (p && p.builtIn) {
      throw newError('无法删除内置插件');
    }
    await GLOBAL_DB.store.pluginsJSCode.remove(id);
    usePluginsStore().removeRequire(id);
    GLOBAL_DB.store.pluginsStore.removeByPid(id);
    this.pluginsPool.delete(id);
    this.callListener('deleted', id);
  }

  public async importPool(): Promise<void> {
    try {
      const all = await GLOBAL_DB.store.pluginsJSCode.getAll();
      if (isNull(all)) {
        GLOBAL_LOG.warn('Plugins importPool all:', all);
        return;
      }
      const { loadStats } = storeToRefs(usePluginsStore());
      const { threadsNumber } = storeToRefs(useSettingsStore());
      for (const arr of chunkArray(all, threadsNumber.value)) {
        const ps = [];
        for (const { id, jscode, enable } of arr) {
          ps.push(this.importJSCode(jscode, {
            minify: false,
            force: true,
            enable
          }).then(() => {
            loadStats.value.push({
              id
            });
          }).catch(e => {
            loadStats.value.push({
              id,
              error: e.message
            });
            GLOBAL_DB.store.pluginsJSCode.remove(id);
            return Promise.resolve();
          }));
        }
        await Promise.all(ps);
      }
    } catch (e) {
      GLOBAL_LOG.error('Plugins importPool', e);
      return errorHandler(e);
    }
  }

  public async importJSCode(jscode: string, options?: PluginImportOptions): Promise<BookSource | BookStore | TextToSpeechEngine> {
    return this.import(null, jscode, options);
  }
  public async importPluginFile(pluginFilePath: string, options?: PluginImportOptions): Promise<BookSource | BookStore | TextToSpeechEngine> {
    return this.import(pluginFilePath, null, options);
  }

  private createPluginClassInstance(cls: PluginInterface) {
    try {
      const settings = useSettingsStore();
      const require = usePluginsStore().getRequire(cls.ID);
      if (cls.REQUIRE) {
        for (const key in cls.REQUIRE) {
          if (require && Object.hasOwn(require, key)) {
            // 如新是新版插件
            if (isNewerVersionPlugin(cls.REQUIRE[key])) {
              cls.REQUIRE[key].value = require[key];
            }
            // 兼容旧插件
            else {
              cls.REQUIRE[key] = require[key];
            }
          } else {
            // 若是新版插件且require仓库没有该key的值则设置为default
            if (isNewerVersionPlugin(cls.REQUIRE[key])) {
              cls.REQUIRE[key].value = cls.REQUIRE[key].default;
            }
          }
        }
      }
      return new cls({
        request: {
          async get(url: string, config?: PluginRequestConfig) {
            let proxy: RequestProxy | undefined = void 0;
            if (config?.proxy) {
              if (settings.options.enableProxy) {
                proxy = settings.proxy;
              } else {
                throw newError('Proxy not enabled');
              }
            }
            return requestGet(url, {
              ...config,
              proxy
            });
          },
          async post(url: string, config?: PluginRequestConfig) {
            let proxy: RequestProxy | undefined = void 0;
            if (config?.proxy) {
              if (settings.options.enableProxy) {
                proxy = settings.proxy;
              } else {
                throw newError('Proxy not enabled');
              }
            }
            return requestPost(url, {
              ...config,
              proxy
            });
          },
        },
        store: this.getPluginStore(cls.ID),
        cheerio: load,
        nanoid: () => nanoid(),
        uuid
      });
    } finally {
      this.callListener('created', cls.ID);
    }
  }

  private importBuiltIn() {
    const engines = [EdgeTTSEngine, AliyunTTSEngine, BaiduTTSEngine, AzureTTSEngine, SherpaOnnxTTSEngine];
    for (const Engine of engines) {
      const instance = this.createPluginClassInstance(Engine);
      this.pluginsPool.set(Engine.ID, {
        enable: true,
        updating: false,
        pluginClass: Engine,
        instance,
        builtIn: true
      });
    }
  }

  private async import(pluginFilePath: string | null, jscode: string | null, options?: PluginImportOptions): Promise<BookSource | BookStore | TextToSpeechEngine> {
    try {
      if (!isNull(pluginFilePath)) {
        if (!existsSync(pluginFilePath)) {
          throw newError(`Plugin file "${pluginFilePath}" not found`);
        }
        jscode = readFileSync(pluginFilePath, 'utf-8');
      }
      if (isNull(jscode)) {
        throw newError('Plugin jscode not found');
      }
      const { PluginClass, code } = await this.checkout(jscode, options);
      if (!options?.force && this.pluginsPool.has(PluginClass.ID)) {
        throw newError(`Plugin exists ID:${PluginClass.ID}`);
      }
      const {
        ID,
        TYPE,
        DEPRECATED
      } = PluginClass;
      const instance = this.createPluginClassInstance(PluginClass);

      //拦截书源插件getTextContent方法
      if (TYPE === PluginType.BOOK_SOURCE) {
        (<any>PluginClass.prototype)._getTextContent = (<BookSource>PluginClass.prototype).getTextContent;
        (<BookSource>PluginClass.prototype).getTextContent = async (chapter: Chapter) => {
          const res: string[] = await (<any>PluginClass.prototype)._getTextContent.call(instance, chapter);
          //对HTML字符串消毒
          return res.map(v => sanitizeHTML(v)).filter(v => v !== '');
        }
      }
      if (TYPE === PluginType.BOOK_STORE) {
        (<any>PluginClass.prototype).getConfigItem = (key: string) => {
          if (isUndefined(key) || !isString(key)) {
            throw newError('Invalid parameters');
          }
          if (!Object.hasOwn((<BookStore>instance).config, key)) {
            return void 0;
          }
          return (<BookStore>instance).config[key].bind(instance);
        }
      }
      if (!options?.debug) {
        await GLOBAL_DB.store.pluginsJSCode.put({
          id: ID,
          jscode: code,
          enable: !!options?.enable
        });
      }
      this.pluginsPool.set(ID, {
        enable: DEPRECATED ? false : !!options?.enable,
        updating: false,
        pluginClass: PluginClass,
        instance: DEPRECATED || !options?.enable ? null : instance,
        builtIn: false
      });
      this.callListener('imported', ID);
      return instance;
    } catch (e) {
      GLOBAL_LOG.error('Plugins import', e);
      return errorHandler(e);
    }
  }
  /**校验插件 */
  public async checkout(jscode: string, options?: PluginImportOptions) {
    try {
      if (!options || options.minify) {
        const { error, code } = Plugins.UGLIFY_JS.minify(jscode, {
          compress: {
            drop_debugger: !options?.debug
          }
        });
        if (error) throw error;
        jscode = code;
      }
      const plugin = await this.pluginExports(jscode);
      this._isPlugin(plugin);
      return { PluginClass: plugin, code: jscode };
    } catch (e) {
      return errorHandler(e);
    }
  }
  private _isPlugin(plugin: PluginInterface) {
    if (isUndefined(plugin.ID)) {
      throw newError('Static property [ID] not found');
    }
    if (!isString(plugin.ID)) {
      throw newError('Static property [ID] is not of string type');
    }
    if (!/[A-Za-z0-9_\-]/.test(plugin.ID) || plugin.ID.trim() !== plugin.ID) {
      throw newError('The ID format is not standard');
    }
    if (plugin.ID.length < 16 || plugin.ID.length > 32) {
      throw newError(`Static property [ID] Length:${plugin.ID.length}, ID range in length [16,32]`);
    }

    if (isUndefined(plugin.TYPE)) {
      throw newError('Static property [TYPE] not found');
    }
    if (!isNumber(plugin.TYPE)) {
      throw newError('Static property [TYPE] is not of number type');
    }
    if (isUndefined(PluginType.valueOf(plugin.TYPE))) {
      throw newError('Static property [TYPE] is unknown plugin type');
    }

    if (isUndefined(plugin.GROUP)) {
      throw newError('Static property [GROUP] not found');
    }
    if (!isString(plugin.GROUP)) {
      throw newError('Static property [GROUP] is not of string type');
    }
    if (plugin.GROUP.trim() !== plugin.GROUP) {
      throw newError('The GROUP format is not standard');
    }
    if (plugin.GROUP.length < 1 || plugin.GROUP.length > 15) {
      throw newError(`Static property [GROUP] Length:${plugin.GROUP.length}, GROUP range in length [2,15]`);
    }

    if (isUndefined(plugin.NAME)) {
      throw newError('Static property [NAME] not found');
    }
    if (!isString(plugin.NAME)) {
      throw newError('Static property [NAME] is not of string type');
    }
    if (plugin.NAME.trim() !== plugin.NAME) {
      throw newError('The NAME format is not standard');
    }
    if (plugin.NAME.length < 1 || plugin.NAME.length > 15) {
      throw newError(`Static property [NAME] Length:${plugin.NAME.length}, NAME range in length [2,15]`);
    }

    if (isUndefined(plugin.VERSION)) {
      throw newError('Static property [VERSION] not found');
    }
    if (!isString(plugin.VERSION)) {
      throw newError('Static property [VERSION] is not of string type');
    }
    if (plugin.VERSION.trim() !== plugin.VERSION) {
      throw newError('The VERSION format is not standard');
    }
    if (plugin.VERSION.length < 0 || plugin.VERSION.length > 8) {
      throw newError(`Static property [VERSION] Length:${plugin.VERSION.length}, VERSION range in length [1,8]`);
    }

    if (isUndefined(plugin.VERSION_CODE)) {
      throw newError('Static property [VERSION_CODE] not found');
    }
    if (!isNumber(plugin.VERSION_CODE)) {
      throw newError('Static property [VERSION_CODE] is not of number type');
    }

    if (isUndefined(plugin.PLUGIN_FILE_URL)) {
      throw newError('Static property [PLUGIN_FILE_URL] not found');
    }
    if (!isString(plugin.PLUGIN_FILE_URL)) {
      throw newError('Static property [PLUGIN_FILE_URL] is not of string type');
    }
    if (plugin.PLUGIN_FILE_URL.trim() && !/^https?:\/\/.*?\.js$/i.test(plugin.PLUGIN_FILE_URL)) {
      throw newError('The [PLUGIN_FILE_URL] format is not standard');
    }

    if ([PluginType.BOOK_SOURCE, PluginType.BOOK_STORE].includes(plugin.TYPE)) {
      if (isUndefined(plugin.BASE_URL)) {
        throw newError('Static property [BASE_URL] not found');
      }
      if (!isString(plugin.BASE_URL)) {
        throw newError('Static property [BASE_URL] is not of string type');
      }
      if (!plugin.BASE_URL.trim()) {
        throw newError('Static property [BASE_URL] is empty');
      }
      if (!/^https?:\/\/.*?/i.test(plugin.BASE_URL)) {
        throw newError('The [BASE_URL] format is not standard');
      }
    }

    switch (plugin.TYPE) {
      case PluginType.BOOK_STORE:
        isBookStore(plugin);
        break;
      case PluginType.TTS_ENGINE:
        isTTSEngine(plugin);
        break;
      case PluginType.BOOK_SOURCE:
      default:
        isBookSource(plugin);
        break;
    }

  }
  public isPlugin(plugin: PluginInterface) {
    try {
      this._isPlugin(plugin);
      return true;
    } catch (e) {
      return false;
    }
  }



  private runPluginScript(script: string, isDev = false) {
    const _console = this.consoleImplement;
    const sandbox = {
      plugin: {
        exports: null as PluginInterface | null,
        type: PluginType
      },
      console: {
        log: function (...data: any[]) {
          _console.log(`[plugin debug id="${(<any>this).exports.ID}", name="${(<any>this).exports.NAME}"]`, ...data);
        },
        info: function (...data: any[]) {
          _console.info(`[plugin debug id="${(<any>this).exports.ID}", name="${(<any>this).exports.NAME}"]`, ...data);
        },
        warn: function (...data: any[]) {
          _console.warn(`[plugin debug id="${(<any>this).exports.ID}", name="${(<any>this).exports.NAME}"]`, ...data);
        },
        error: function (...data: any[]) {
          _console.error(`[plugin debug id="${(<any>this).exports.ID}", name="${(<any>this).exports.NAME}"]`, ...data);
        },
      },
      String,
      Number,
      Boolean,
      Date,
      Buffer,
      Blob,
      Math,
      RegExp,
      JSON,
      Promise,
      isNaN,
      isNull,
      isUndefined,
      isString,
      isNumber,
      isArray,
      isDate,
      isFunction,
      Timer: {
        timeout,
        interval,
        sleep
      },
      URLSearchParams,
      WebSocketClient,
      Uint8Array,
      NodeCrypto,
      DOMParser,
      XPathResult,
      XPathEvaluator,
      XPathExpression,
      Error,
      AbortSignal,
      AbortController,
      URL,
      escapeHTML,
      chunkArray,
      escapeXML,
      setTimeout,
      setInterval
    };
    (<any>sandbox.console).__proto__ = sandbox.plugin;
    if (isDev) {
      (new Function('sandbox', `with(sandbox){${script}}`))(sandbox);
    } else {
      new this.VM({
        timeout: 1 * 1000,
        allowAsync: true,
        sandbox
      }).run(script);
    }
    return function () {
      return sandbox.plugin.exports;
    }
  }
  private pluginExports(jscode: string) {
    return new Promise<PluginInterface>((reso, reje) => {
      try {
        let exports = null;
        if (Core.isDev) {
          GLOBAL_LOG.warn('Run the plugin script in the development environment.');
          exports = this.runPluginScript(jscode, true)();
        } else {
          exports = this.runPluginScript(jscode)();
        }
        if (!exports) {
          throw newError('Cannot find plugin');
        }
        return reso(exports);
      } catch (e) {
        return reje(newError(errorHandler(e, true)));
      }
    });
  }
}