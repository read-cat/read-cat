import { HttpsProxyAgent } from 'https-proxy-agent';
import { encode as encodeUrl } from 'urlencode';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { RequestConfig, RequestProxy, Response } from './defined/request';
import axios from '../axios';
import { isUndefined } from '../is';
import { newError } from '../utils';

export const handlerProxy = (proxy?: RequestProxy) => {
  if (isUndefined(proxy)) {
    return void 0;
  }
  const { protocol, host, port, username, password } = proxy;
  if (!host.trim()) {
    throw newError('host is empty');
  }
  const url = new URL(`${protocol}://${host.trim()}:${port}`);
  url.username = username?.trim() || '';
  url.password = password?.trim() || '';
  return new (protocol.includes('socks') ? SocksProxyAgent : HttpsProxyAgent)(url);
}


export const get = async <T = any>(url: string, config?: RequestConfig): Promise<Response<T>> => {
  const { status, statusText, headers, data } = await axios.get(url, {
    params: config?.params,
    headers: config?.headers,
    httpsAgent: handlerProxy(config?.proxy),
    responseEncoding: config?.charset,
    responseType: config?.responseType || 'text',
    maxRedirects: config?.maxRedirects,
    signal: config?.signal,
    timeout: config?.timeout,
    paramsSerializer: (params) => {
      return Object.keys(params)
        .map(key => `${key}=${encodeUrl(params[key], config?.urlencode)}`)
        .join('&');
    }
  });
  return {
    code: status,
    message: statusText,
    headers,
    body: data
  }
}

export const post = async <T = any>(url: string, config?: RequestConfig): Promise<Response<T>> => {
  const { status, statusText, headers, data } = await axios.post(url, config?.params, {
    headers: config?.headers,
    httpsAgent: handlerProxy(config?.proxy),
    responseEncoding: config?.charset,
    responseType: config?.responseType || 'text',
    maxRedirects: config?.maxRedirects,
    signal: config?.signal,
    timeout: config?.timeout,
    paramsSerializer: (params) => {
      return Object.keys(params)
        .map(key => `${key}=${encodeUrl(params[key], config?.urlencode)}`)
        .join('&');
    }
  });
  return {
    code: status,
    message: statusText,
    headers,
    body: data
  }
}
