export interface SearchEntity {
  //书名
  bookname: string,
  //作者
  author: string,
  //封面图片链接
  coverImageUrl?: string,
  //详情页链接
  detailPageUrl: string,
  //最新章节标题
  latestChapterTitle?: string,
}
export type Chapter = {
  title: string,
  url: string,
  index: number
}
export type DetailEntity = {
  bookname: string,
  author: string,
  coverImageUrl: string,
  latestChapterTitle?: string,
  intro?: string,
  chapterList: Chapter[]
}
export type BookStoreItem = {
  bookname: string,
  author?: string,
  coverImageUrl?: string,
  intro?: string
}