import { isFunction, isUndefined } from '../is';
import { BookSource } from './defined/booksource';
import { PluginInterface } from './defined/plugins';

export const isBookSource = (plugin: PluginInterface) => {
  const p = <BookSource>plugin.prototype;
  if (isUndefined(p.search)) {
    throw 'Function [search] not found';
  }
  if (!isFunction(p.search)) {
    throw 'Property [search] is not of function type';
  }

  if (isUndefined(p.getDetail)) {
    throw 'Function [getDetail] not found';
  }
  if (!isFunction(p.getDetail)) {
    throw 'Property [getDetail] is not of function type';
  }

  if (isUndefined(p.getTextContent)) {
    throw 'Function [getTextContent] not found';
  }
  if (!isFunction(p.getTextContent)) {
    throw 'Property [getTextContent] is not of function type';
  }
}