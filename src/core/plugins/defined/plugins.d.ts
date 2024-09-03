import { Charset, Params, ResponseType } from '../../request/defined/request';
import { IncomingHttpHeaders } from 'http';
import { BookSource } from './booksource';
import { BookStore } from './bookstore';
import { TextToSpeechEngine } from './ttsengine';
import { SearchEntity } from '../../book/book';
export type PluginId = string;

export interface PluginImportOptions {
  /**强制导入插件 */
  force?: boolean,
  /**压缩插件JS代码 */
  minify?: boolean,
  /**开启调试模式 */
  debug?: boolean,
  /**启用插件 */
  enable?: boolean
}

export interface BasePluginStoreInterface {
  getStoreValue<R = any>(key: string): Promise<R | null>;
  setStoreValue<V = any>(key: string, value: V): Promise<void>;
  removeStoreValue(key: string): Promise<void>;
}
export interface PluginStoreInterface extends BasePluginStoreInterface {
  currentSize(): Promise<number>;
}
export type CreatePluginStore = (pid: string, maxByteLength: number) => BasePluginStoreInterface;
export type Console = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}
export interface PluginRequestMethod {
  get(url: string, config?: PluginRequestConfig): Promise<{ body: any, code?: number, headers: IncomingHttpHeaders }>;
  post(url: string, config?: PluginRequestConfig): Promise<{ body: any, code?: number, headers: IncomingHttpHeaders }>;
}
export type PluginConstructorParams = {
  request: PluginRequestMethod,
  store: BasePluginStoreInterface,
  cheerio,
  nanoid: () => string,
  uuid: (noDash?: boolean) => string
}
export type SearchFilter = boolean | ((entity: SearchEntity, searchKey: string, author?: string) => boolean);
/** 插件设置项 */
export type RequireItem = {
  /** 要显示的标签 */
  label: string
  /** 字段类型 */
  type: 'number' | 'string' | 'list' | 'password' | 'boolean'
  /** 字段值 */
  value?: any
  /** 字段默认值 */
  default: any
  /** 列表类型的数据，ElSelect 的数据源格式 */
  data?: any
  /** 字段说明 */
  description?: string
  /**  字段输入提示 */
  placeholder?: string
}
export interface PluginBaseProps {
  /**插件ID */
  readonly ID: PluginId;
  /**插件类型 */
  readonly TYPE: number;
  /**插件分组 */
  readonly GROUP: string;
  /**插件名称 */
  readonly NAME: string;
  /**插件版本号 用于显示 */
  readonly VERSION: string;
  /**插件版本号代码 用于版本比较 */
  readonly VERSION_CODE: number;
  /**插件文件更新地址 */
  readonly PLUGIN_FILE_URL: string;
  /**书源、书城的请求链接 */
  readonly BASE_URL?: string;
  /**需要的参数 */
  // readonly REQUIRE?: Record<string, string>;
  readonly REQUIRE?: Record<string, RequireItem | string>;
  /**书源搜索结果过滤器 */
  readonly SEARCH_FILTER?: SearchFilter;
}
export interface PluginInterface extends PluginBaseProps {
  new(params: PluginConstructorParams): BookSource | BookStore | TextToSpeechEngine;
  prototype: BookSource | BookStore | TextToSpeechEngine;
}

export type PluginFilter = {
  enable?: boolean,
  group?: string
}

export type PluginRequestConfig = {
  params?: Params | URLSearchParams,
  headers?: IncomingHttpHeaders,
  proxy?: boolean,
  urlencode?: Charset,
  charset?: Charset,
  signal?: AbortSignal,
  responseType?: ResponseType
}

export type PluginsOptions = {
  storeCreateFunction?: CreatePluginStore
  console?: Console
  requestCompress?: boolean
}