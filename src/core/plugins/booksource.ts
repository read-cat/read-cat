import { isFunction, isUndefined } from '../is';
import { newError } from '../utils';
import { BookSource } from './defined/booksource';
import { PluginInterface } from './defined/plugins';

export const isBookSource = (plugin: PluginInterface) => {
  const p = <BookSource>plugin.prototype;
  if (isUndefined(p.search)) {
    throw newError('Function [search] not found');
  }
  if (!isFunction(p.search)) {
    throw newError('Property [search] is not of function type');
  }

  if (isUndefined(p.getDetail)) {
    throw newError('Function [getDetail] not found');
  }
  if (!isFunction(p.getDetail)) {
    throw newError('Property [getDetail] is not of function type');
  }

  if (isUndefined(p.getTextContent)) {
    throw newError('Function [getTextContent] not found');
  }
  if (!isFunction(p.getTextContent)) {
    throw newError('Property [getTextContent] is not of function type');
  }
}