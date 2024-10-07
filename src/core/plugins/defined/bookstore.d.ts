import { BookStoreItem } from '../../book/book';

export interface BookStore {
  get config(): Record<string, () => Promise<BookStoreItem[]>>

  /**
   * 获取书城插件config属性值
   * 该方法由src/core/plugins/index.ts/Plugin(类)/import(方法)实现
   */
  getConfigItem(key: string): (() => Promise<BookStoreItem[]>) | undefined
}