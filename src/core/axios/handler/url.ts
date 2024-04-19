import { AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { isUndefined } from '../../is';
import http from 'http';
import https from 'https';
import { toURLEncoded } from './params';
import { newAxiosError } from '../../utils';

export const getRequest = (protocol: string, config: InternalAxiosRequestConfig) => {
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw newAxiosError(`Unsupported protocol ${protocol}`, AxiosError.ERR_NOT_SUPPORT, config);
  }
  if (isUndefined(config.method) || ['GET', 'DOWNLOAD'].includes(config.method.toUpperCase())) {
    return protocol === 'http:' ? http.get : https.get;
  }
  return protocol === 'http:' ? http.request : https.request;
}

export const joinUrl = (config: InternalAxiosRequestConfig) => {
  let { baseURL, url } = config;

  if (baseURL && url) {
    if (url.startsWith('http')) {
      return url;
    }
    const _baseURL = baseURL.endsWith('/') ? baseURL.slice(0, baseURL.length - 1) : baseURL;
    const _url = url.startsWith('/') ? url : `/${url}`;
    return _baseURL + _url;
  }
  if (baseURL) {
    return baseURL;
  }
  if (url) {
    return url;
  }
  throw newAxiosError('url is empty or undefined', AxiosError.ERR_INVALID_URL, config);
}

export const createURL = (config: InternalAxiosRequestConfig) => {
  try {
    let url = joinUrl(config);
    const i = url.indexOf('?');
    const method = config.method?.trim().toUpperCase() || 'GET';
    if (!['DOWNLOAD', 'GET', 'DELETE', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH'].includes(method)) {
      throw newAxiosError(`Unsupported method ${method}`, AxiosError.ERR_NOT_SUPPORT, config);
    }
    config.method = method;

    const paramsStr = toURLEncoded(config);
    if (!paramsStr) {
      return new URL(url);
    }
    if (i <= 0) {
      return new URL(`${url}?${paramsStr}`);
    }
    if (i === url.length - 1 || url.endsWith('&')) {
      return new URL(`${url}${paramsStr}`);
    }
    return new URL(`${url}&${paramsStr}`);
  } catch (e: any) {
    throw isAxiosError(e) ? e : newAxiosError(e.message, AxiosError.ERR_INVALID_URL, config);
  }
}