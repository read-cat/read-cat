import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { isError, isNumber, isObject, isString } from '../is';
import DOMPurify from 'dompurify';

export function errorHandler(error: any, toString?: false): Promise<never>;
export function errorHandler(error: any, toString: true): string;
export function errorHandler(error: any, toString: any): Promise<never> | string {
  let err: Error;
  if (isError(error)) {
    err = error;
  } else if (isString(error)) {
    err = newError(error);
  } else {
    err = newError(String(error));
  }
  return toString ? err.message : Promise.reject(err);
}

export const isHexColor = (color: string) => {
  if (/^#[abcdef0-9]{3,6}$/i.test(color)) {
    return true;
  }
  return false;
}

/**
 * 转换十六进制颜色为RGB
 * @param hexColor 十六进制颜色值
 * @returns 
 */
export const getColorRGB = (hexColor: string): [number, number, number] => {
  hexColor = hexColor.trim();
  if (/^#[abcdef0-9]{6}$/i.test(hexColor)) {
    const r = hexColor.substring(1, 3);
    const g = hexColor.substring(3, 5);
    const b = hexColor.substring(5, 7);
    return [Number(`0x${r}`), Number(`0x${g}`), Number(`0x${b}`)];
  }
  if (/^#[abcdef0-9]{3}$/i.test(hexColor)) {
    const r = hexColor.substring(1, 2);
    const g = hexColor.substring(2, 3);
    const b = hexColor.substring(3, 4);
    return [Number(`0x${r}${r}`), Number(`0x${g}${g}`), Number(`0x${b}${b}`)];
  }
  throw newError('Not a hex color');
}

/**
 * 判断RGB颜色是否为亮色
 * @param r R
 * @param g G
 * @param b B
 * @returns 
 */
export const colorIsLight = (r: number, g: number, b: number) => {
  return (r * 0.299 + g * 0.578 + b * 0.114 >= 192);
}

/**
 * 数组分割
 * @param array 数组
 * @param size 每个数组中的元素个数
 * @returns 
 */
export const chunkArray = <T>(array: T[], size = 1) => {
  size = Math.max(Math.ceil(Number(size)), 0);
  const length = array == null ? 0 : array.length;
  if (!length || size < 1) {
    return [];
  }
  let index = 0;
  let resIndex = 0;
  const result = new Array<T[]>(Math.ceil(length / size));

  while (index < length) {
    result[resIndex++] = array.slice(index, (index += size));
  }
  return result;
}

export const replaceInvisibleStr = <T extends Record<string, any>>(obj: T): T => {
  let val: any = {};
  Object.keys(obj).forEach((key: string) => {
    val[key] = isString(obj[key]) ? obj[key].trim() : isObject(obj[key]) ? replaceInvisibleStr(obj[key]) : obj[key];
  });
  return val;
}

/**
 * 对HTML字符串消毒
 * @param removeTags 是否移除HTML标签
 */
export const sanitizeHTML = (() => {
  const divContainer = document.createElement('div');
  return (html: string, removeTags = false) => {
    let str = DOMPurify.sanitize(html, {
      ALLOWED_ATTR: ['style', 'src']
    });
    if (removeTags) {
      divContainer.innerHTML = str;
      str = divContainer.innerText;
      divContainer.innerHTML = '';
    }
    return str.trim();
  }
})();


export const newError = (message?: string) => new Error(message);
export const newAxiosError = <T = any, D = any>(
  message?: string,
  code?: string,
  config?: InternalAxiosRequestConfig<D>,
  request?: any,
  response?: AxiosResponse<T, D>
) => new AxiosError(message, code, config, request, response);

export const isPluginContext = () => {
  const { stack } = new Error;
  if (!stack) {
    return true;
  }
  if (
    stack.includes('setStoreValue') ||
    stack.includes('getStoreValue') ||
    stack.includes('removeStoreValue')
  ) {
    return false;
  }
  if (
    stack.includes('createPluginClassInstance') ||
    stack.includes('runPluginScript')
  ) {
    return true;
  }
  return false;
}

export const cloneByJSON = <T>(val: T): T => {
  return JSON.parse(JSON.stringify(val));
}

export const handlerVueProp = (val: any, defaultVal = '') => {
  if (isNumber(val)) {
    return `${val}px`;
  }
  if (isString(val)) {
    return /\d$/.test(val) ? `${val}px` : val;
  }
  return defaultVal;
}