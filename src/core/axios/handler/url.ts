import { AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { toURLEncoded } from './params';
import { newAxiosError } from '../../utils';
import nodeHttp from 'node:http';
import nodeHttps from 'node:https';
import { http as httpType, https as httpsType } from 'follow-redirects';
import { URL } from 'node:url';
import { isUndefined } from '../../is';

const { http: followHttp, https: followHttps } = require('follow-redirects');
const fHttp = <typeof httpType>followHttp;
const fHttps = <typeof httpsType>followHttps;

export const getRequest = (protocol: string, config: InternalAxiosRequestConfig) => {
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw newAxiosError(`Unsupported protocol ${protocol}`, AxiosError.ERR_NOT_SUPPORT, config);
  }
  const isRedirects = !isUndefined(config.maxRedirects) && config.maxRedirects > 0;
  const http = isRedirects ? fHttp : nodeHttp;
  const https = isRedirects ? fHttps : nodeHttps;
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