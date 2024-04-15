import { BookStore } from './define/bookstore';
import { PluginInterface } from './define/plugins';

export const isBookStore = (plugin: PluginInterface) => {
  const p = plugin.prototype as BookStore;
  console.log(p);

  throw `unknown`;
}