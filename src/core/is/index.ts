import NodeFormData from 'form-data';

export const toStringCall = (val: any): string => {
  return Object.prototype.toString.call(val);
}

export const isNull = (val: any): val is null => {
  return toStringCall(val) === '[object Null]';
}
export const isUndefined = (val: any): val is undefined => {
  return toStringCall(val) === '[object Undefined]';
}
export const isString = (val: any): val is string => {
  return toStringCall(val) === '[object String]';
}
export const isNumber = (val: any): val is number => {
  return toStringCall(val) === '[object Number]';
}
export const isArray = (val: any): val is Array<any> => {
  return toStringCall(val) === '[object Array]';
}
export const isDate = (val: any): val is Date => {
  return toStringCall(val) === '[object Date]';
}
export const isObject = (val: any): val is object => {
  return toStringCall(val) === '[object Object]';
}
export const isSymbol = (val: any): val is symbol => {
  return toStringCall(val) === '[object Symbol]';
}
export const isFunction = (val: any): val is Function => {
  return toStringCall(val).includes('Function');
}
export const isError = (val: any): val is Error => {
  return toStringCall(val) === '[object Error]';
}
export const isDOMException = (val: any): val is DOMException => {
  return toStringCall(val) === '[object DOMException]';
}
export const isUint8Array = (val: any): val is Uint8Array => {
  return toStringCall(val) === '[object Uint8Array]';
}
export const isPromise = <T = any>(val: any): val is Promise<T> => {
  return toStringCall(val) === '[object Promise]';
}
export const isURLSearchParams = (val: any): val is URLSearchParams => {
  return toStringCall(val) === '[object URLSearchParams]';
}
export const isFormData = (val: any): val is FormData => {
  return toStringCall(val) === '[object FormData]';
}
export const isNodeFormData = (val: any): val is NodeFormData => {
  return toStringCall(val) === '[object NodeFormData]';
}
export const isFile = (val: any): val is File => {
  return toStringCall(val) === '[object File]';
}
export const getType = (val: any): string => {
  const str = toStringCall(val);
  return str.substring(1, str.length - 1).replace('object ', '');
}