import { newError } from '../utils';
import { BookStore } from './defined/bookstore';
import { PluginInterface } from './defined/plugins';

export const isBookStore = (plugin: PluginInterface) => {
  const p = plugin.prototype as BookStore;
  console.log(p);

  throw newError('unknown');
}