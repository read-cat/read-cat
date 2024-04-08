import { Settings } from '../../store/defined/settings';
import { DetailEntity, Chapter } from '../book/book';


export interface DatabaseStoreInterface<V> {
  db: IDBDatabase;
  storeName: string;
  getById(id: string): Promise<V | null>;
  getAll(): Promise<V[] | null>;
  put(val: V): Promise<void>;
  remove(id: string): Promise<void>;
}
export interface PluginStoreDatabaseStoreInterface<T> extends DatabaseStoreInterface<T> {
  getByPidAndKey(pid: string, key: string): Promise<PluginsStoreEntity | null>
  removeByPidAndKey(pid: string, key: string): Promise<void>;
}

export interface DatabaseInterface {
  VERSION: number;
  NAME: string;
  new (): DatabaseClassEntity;
  prototype: DatabaseClassEntity;
}
export interface PluginsJSCodeEntity {
  id: string,
  jscode: string,
  enable: boolean
}
export interface PluginsStoreEntity {
  id: string;
  /**插件ID */
  pid: string;
  key: string;
  data: Uint8Array;
}
export interface FontsStoreEntity {
  id: string,
  name: string,
  type: string,
  data: Uint8Array
}
export interface HistoryStoreEntity {

}
export interface SearchKeyStoreEntity {
  id: string,
  searchkey: string,
  timestamp: number
}
export type BookshelfStoreEntity = {
  id: string,
  pid: string,
  detailPageUrl: string,
  pluginVersionCode: number,
  baseUrl: string,
  readIndex: number,
  readScrollTop: number,
  searchIndex: string,
  timestamp: number,
} & DetailEntity;
export interface TextContentStoreEntity {
  id: string,
  pid: string,
  detailUrl: string,
  chapter: Chapter,
  textContent: string[]
}

export type BookmarkRange = {
  id: string
  start: number
  end: number
  index: number
  content: string
  title: string
  timestamp: number
}
export type BookmarkStoreEntity = {
  id: string
  detailUrl: string
  chapterUrl: string
  chapterTitle: string
  range: BookmarkRange[]
  timestamp: number
}

export type SettingsEntity = {
  id: string,
  use: boolean,
  settings: Settings
}

export interface DatabaseClassEntity {
  store: DatabaseStore,
  open(): Promise<void>;
}