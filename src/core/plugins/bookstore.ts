import { isFunction, isObject, isUndefined } from '../is';
import { newError } from '../utils';
import { BookStore } from './defined/bookstore';
import { PluginInterface } from './defined/plugins';

export const isBookStore = (plugin: PluginInterface) => {
  const p = <BookStore>plugin.prototype;
  if (isUndefined(p.config)) {
    throw newError('Property [config] not found');
  }
  if (!isObject(p.config)) {
    throw newError('Property [config] is not of object type');
  }
  const keys = Object.keys(p.config);
  if (keys.length < 1) {
    throw newError('Unknown bookstore configuration');
  }
  for (const key of keys) {
    if (!p.config[key] || !isFunction(p.config[key])) {
      throw newError('Unknown bookstore configuration');
    }
  }
}