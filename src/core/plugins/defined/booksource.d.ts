import { SearchEntity, DetailEntity, Chapter } from '../../book/book';

export interface BookSource {
  /**
   * 搜索书本
   * @param searchkey 搜索关键词
   * @param author 作者(可选)
   * @returns 
   */
  search: (searchkey: string) => Promise<SearchEntity[]>;
  /**
   * 获取详情页内容
   * @param detailPageUrl 详情页链接
   * @returns 
   */
  getDetail: (detailPageUrl: string) => Promise<DetailEntity>;
  /**
   * 获取正文
   * @param chapter 章节
   * @returns 
   */
  getTextContent: (chapter: Chapter) => Promise<string[]>;
}