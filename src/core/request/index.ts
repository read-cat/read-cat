import https from 'https';
import http from 'http';
import { decode } from 'iconv-lite';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { encode as encodeUrl } from 'urlencode';
import { isDOMException, isURLSearchParams, isUndefined } from '../is';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Logger } from '../logger';
import { unzipSync, brotliDecompressSync } from 'zlib';
import { Params, RequestConfig, RequestMethod, RequestProxy, Response } from './defined/request';
import { ResponseError } from './error';
import e from 'express';

const defaultConfig: RequestConfig = {
  urlencode: 'UTF8',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    'accept-encoding': 'gzip, deflate, br'
  },
  responseType: 'string',
}

const getRequestFunction = (method: RequestMethod, protocol: string) => {
  if (protocol === 'http:') {
    return method === 'GET' ? http.get : http.request;
  } else if (protocol === 'https:') {
    return method === 'GET' ? https.get : https.request;
  } else {
    throw new Error('Unsupported request protocol');
  }
}

const handlerProxy = (proxy?: RequestProxy) => {
  if (isUndefined(proxy)) {
    return void 0;
  }
  const { protocol, host, port, username, password } = proxy;
  const account = !username || !password ? '' : `${username}:${password}@`;
  const agentUrl = `${protocol}://${account}${host}:${port}`;
  if (protocol.includes('socks')) {
    return new SocksProxyAgent(agentUrl);
  }
  return new HttpsProxyAgent(agentUrl);
}
const handlerParams = (url: URL, method: RequestMethod, urlencode?: string, type?: string, params?: Params | URLSearchParams) => {
  if (isUndefined(params)) {
    return void 0;
  }
  const tojson = type?.includes('application/json');
  if (!isURLSearchParams(params)) {
    const arr = [];
    const obj: Record<string, any> = {};
    for (const key in params) {
      const value = String(params[key]);
      if (method === 'POST') {
        if (tojson) {
          obj[key] = value;
        } else {
          arr.push(`${key}=${encodeUrl(value, urlencode)}`);
        }
      } else if (method === 'GET') {
        url.searchParams.append(key, value);
      }
    }
    if (tojson) {
      return JSON.stringify(obj);
    }
    return arr.join('&');
  }
  if (method === 'GET') {
    for (const [key, value] of params) {
      url.searchParams.append(key, value);
    }
  } else if (method === 'POST') {
    if (tojson) {
      const obj: Record<string, any> = {};
      for (const [key, value] of params) {
        obj[key] = value;
      }
      return JSON.stringify(obj);
    } else {
      return params.toString();
    }
  }
}
const request = async (url: string, method: RequestMethod, config?: RequestConfig) => {
  return new Promise<Response>((reso, reje) => {
    try {
      const _config: RequestConfig = { ...defaultConfig, ...config };
      // 移除URL参数
      if (method !== 'GET') {
        const i = url.indexOf('?');
        url = i > 0 ? url.substring(0, i) : url;
      }
      const _url = new URL(url);
      const _request = getRequestFunction(method, _url.protocol);
      /* if (!isUndefined(_config.params) && isURLSearchParams(_config.params)) {
        if (method === 'GET') {
          for (const [key, value] of _config.params) {
            _url.searchParams.append(key, value);
          }
        } else if (method === 'POST') {
          if (_config.headers?.['content-type']?.includes('application/json')) {
            const obj: Record<string, any> = {};
            for (const [key, value] of _config.params) {
              obj[key] = value;
            }
            params = JSON.stringify(obj);
          } else {
            params = _config.params.toString();
          }
        }
      } else if (!isUndefined(_config.params)) {
        const arr = [];
        const obj: Record<string, any> = {};
        const tojson = _config.headers?.['content-type']?.includes('application/json');
        for (const key in _config.params) {
          const value = String(_config.params[key]);
          if (method === 'POST') {
            if (tojson) {
              obj[key] = value;
            } else {
              arr.push(`${key}=${encodeUrl(value, _config.urlencode)}`);
            }
          } else if (method === 'GET') {
            _url.searchParams.append(key, value);
          }
        }
        !tojson && (params = arr.join('&'));
        tojson && (params = JSON.stringify(obj));
      } */
      const params = handlerParams(_url, method, _config.urlencode, _config.headers?.['content-type'], _config.params);
      const agent = handlerProxy(_config.proxy);
      const req = _request(_url, {
        method,
        agent,
        headers: _config.headers,
        signal: AbortSignal.timeout(10 * 1000)
      }, res => {
        const { headers, statusCode, statusMessage } = res;
        if (statusCode && Math.floor(statusCode / 100) !== 2) {
          return reje(new ResponseError(
            `Request failed ${statusCode} ${statusMessage}\n` +
            `url:${url}\n` +
            `header:${Logger.toString(headers, 2, true)}\n`,
            headers,
            statusCode,
            statusMessage
          ));
        }
        const type = res.headers['content-type'];
        const encoding = res.headers['content-encoding'];
        let body = Buffer.alloc(0);
        res.on('data', (chunk: Buffer) => {
          body = Buffer.concat([body, chunk]);
        });
        res.on('error', e => {
          return reje(new ResponseError(
            `${e.message} ${statusCode} ${statusMessage}\n` +
            `url:${url}\n` +
            `header:${Logger.toString(headers, 2, true)}\n`,
            headers,
            statusCode,
            statusMessage
          ));
        });
        res.on('close', () => {
          if (_config.responseType === 'buffer') {
            return reso({
              code: statusCode,
              message: statusMessage,
              headers,
              body
            });
          }
          try {
            switch (encoding?.toLowerCase()) {
              case 'deflate':
              case 'gzip':
                body = unzipSync(body);
                break;
              case 'br':
                body = brotliDecompressSync(body);
                break;
              default:
                break;
            }
          } catch (e) {
            GLOBAL_LOG.debug('request', url, `statusCode:${statusCode}`, `statusMessage:${statusMessage}`, `headers:`, headers, e);
          }
          let charset: string;
          if (isUndefined(_config.charset)) {
            if (type && type.includes('charset=')) {
              charset = type.substring(type.indexOf('charset=') + 8);
            } else {
              charset = 'UTF8';
            }
          } else {
            charset = _config.charset;
          }
          let bodystr: string;
          try {
            bodystr = decode(body, charset);
          } catch (e) {
            bodystr = body.toString();
            GLOBAL_LOG.debug('request', url, `statusCode:${statusCode}`, `statusMessage:${statusMessage}`, `headers:${headers}`, e);
          }
          return reso({
            code: statusCode,
            message: statusMessage,
            headers,
            body: bodystr
          });
        });
      });
      req.on('error', e => {
        if (e.name === 'AbortError' && isDOMException(e.cause)) {
          return reje(new Error(e.cause.message));
        }
        return reje(e);
      });
      if (method === 'POST' && !isUndefined(params)) {
        req.write(params);
      }
	  req.end();
    } catch (e) {
      return reje(e);
    }
  });
}

export const get = async (url: string, config?: RequestConfig) => {
  return await request(url, 'GET', config);
}
export const post = async (url: string, config?: RequestConfig) => {
  return await request(url, 'POST', config);
}