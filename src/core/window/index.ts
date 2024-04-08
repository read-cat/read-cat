export enum PagePath {
  HOME = '/home',
  BOOKSHELF = '/bookshelf',
  BOOKSTORE = '/bookstore',
  DETAIL = '/detail',
  READ = '/read',
  HISTORY = '/history',
  SEARCH = '/search',
}
export namespace PagePath {
  const map = new Map<string, PagePath>();
  Object.keys(PagePath).forEach(v => {
    const e = (<any>PagePath)[v];
    map.set(e.toString(), e);
  });
  export const valueOf = (val: string) => {
    return map.get(val);
  }
}