import { unzipSync, brotliDecompressSync } from 'zlib';
import { getType, isArray, isObject, isString, isUndefined } from '../is';
import { AxiosError, AxiosHeaders } from 'axios';
import { ClientRequest, IncomingMessage } from 'http';
import { CustomInternalAxiosRequestConfig } from './defined/axios';
import { newAxiosError } from '../utils';
import { RedirectableRequest } from 'follow-redirects';

export enum ContentType {
  APPLICATION_FORM_URLENCODED = 'application/x-www-form-urlencoded',
  APPLICATION_JSON = 'application/json',
  MULTIPART_FORM_DATA = 'multipart/form-data',
}

export const urlSearchParamsToObject = (params: URLSearchParams) => {
  const obj: Record<string, string> = {};
  for (const [key, val] of params) {
    obj[key] = val;
  }
  return obj;
}
export const formDataToObject = (params: FormData) => {
  const obj: Record<string, any> = {};
  for (const [key, val] of params) {
    obj[key] = val;
  }
  return obj;
}

export const decompressResponseBody = (body: Buffer, contentEncoding?: string) => {
  if (!contentEncoding) {
    return body;
  }
  contentEncoding = contentEncoding.trim().toUpperCase();
  try {
    switch (contentEncoding) {
      case 'GZIP':
      case 'DEFLATE':
        body = unzipSync(body);
        break;
      case 'BR':
        body = brotliDecompressSync(body);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error(e);
  }
  return body;
}

export const getResponseCharset = (contentType?: string) => {
  let charset: string = 'UTF-8';
  contentType = contentType?.trim();
  const i = contentType?.indexOf('charset=');
  if (contentType && !isUndefined(i) && i >= 0) {
    charset = contentType.substring(i + 8);
  }
  return charset.trim();
}

export const setHeaders = (client: RedirectableRequest<ClientRequest, IncomingMessage>, headers?: AxiosHeaders) => {
  if (!headers) {
    return;
  }
  for (const [key, val] of headers) {
    if (!val) {
      continue;
    }
    if (isArray(val)) {
      client.setHeader(key, val);
      continue;
    }
    if (isObject(val)) {
      setHeaders(client, val);
      continue;
    }
    client.setHeader(key, val.toString());
  }
}

export const handlerCookies = (config: CustomInternalAxiosRequestConfig) => {
  if (!config.cookies) {
    return;
  }
  if (isString(config.cookies)) {
    config.headers.set('Cookie', config.cookies, true);
    return;
  }
  if (isObject(config.cookies)) {
    const cookies = Object.keys(config.cookies)
      .map(key => `${key}=${String((<Record<string, string>>config.cookies)[key])};`)
      .join(' ')
      .trim();
    config.headers.set('Cookie', cookies, true);
    return;
  }
  throw newAxiosError(`Unsupported cookie type: ${getType(config.cookies)}`, AxiosError.ERR_NOT_SUPPORT, config);
}