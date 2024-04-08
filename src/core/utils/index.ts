import { isError, isString } from '../is';

export function errorHandler(error: any, toString?: false): Promise<never>;
export function errorHandler(error: any, toString: true): string;
export function errorHandler(error: any, toString: any): Promise<never> | string {
  let err: Error;
  if (isError(error)) {
    err = error;
  } else if (isString(error)) {
    err = new Error(error);
  } else {
    err = new Error(String(error));
  }
  return toString ? err.message : Promise.reject(err);
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
  throw `Not a hex color`;
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
    val[key] = isString(obj[key]) ? obj[key].trim() : obj[key];
  });
  return val;
}