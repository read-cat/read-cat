import {
  InternalAxiosRequestConfig,
  AxiosError,
  isAxiosError,
  AxiosRequestHeaders,
  AxiosRequestTransformer
} from 'axios';
import {
  isArray,
  isDOMException,
  isFunction,
  isNodeFormData,
  isString,
  isUndefined
} from '../is';
import { errorHandler } from '../utils';
import { decode } from 'iconv-lite';
import { Readable } from 'stream';
import {
  ContentType,
  decompressResponseBody,
  getResponseCharset,
  handlerCookies,
  setHeaders
} from './utils';
import { toJSON, toMultipartFormData, toURLEncoded } from './handler/params';
import { createURL, getRequest } from './handler/url';
import { createAgent } from './handler/agent';
import { CustomAxiosResponse, CustomInternalAxiosRequestConfig } from './define/axios';


const createTransformRequest = (config: InternalAxiosRequestConfig) => {
  if (isFunction(config.transformRequest)) {
    return config.transformRequest.bind(config);
  } else if (isArray(config.transformRequest) && config.transformRequest.length > 0) {
    return config.transformRequest[0].bind(config);
  }
  const func: AxiosRequestTransformer = function (data: any, headers: AxiosRequestHeaders) {
    const contentType = headers['Content-Type']?.toString().trim().toLowerCase() || ContentType.APPLICATION_FORM_URLENCODED;
    if (contentType === ContentType.APPLICATION_FORM_URLENCODED) {
      return toURLEncoded(this, data);
    }
    if (contentType === ContentType.APPLICATION_JSON) {
      return toJSON(this, data);
    }
    if (contentType === ContentType.MULTIPART_FORM_DATA) {
      return toMultipartFormData(this, data);
    }
    throw new AxiosError(`Unsupported content type: ${contentType}`, AxiosError.ERR_NOT_SUPPORT, this);
  }
  return func.bind(config);
}

export default (config: CustomInternalAxiosRequestConfig) => {
  return new Promise<CustomAxiosResponse>(async (reso, reje) => {
    try {
      delete config.adapter;
      const url = createURL(config);
      config.url = url.href;
      const request = getRequest(url.protocol, config);
      handlerCookies(config);
      const abort = new AbortController();
      if (config.signal) {
        config.signal.onabort = () => {
          abort.abort();
        }
      }
      let method = config.method?.trim().toUpperCase();
      let isDownload = false;
      if (method === 'DOWNLOAD') {
        isDownload = true;
      }
      method = method && method !== 'DOWNLOAD' ? method : 'GET';
      config.method = method;
      const client = request(url, {
        method,
        signal: abort.signal,
        agent: createAgent(config),
        timeout: isUndefined(config.timeout) ? 15000 : config.timeout,
        headers: config.headers,
        rejectUnauthorized: config.rejectUnauthorized,
        insecureHTTPParser: config.insecureHTTPParser
      }, res => {
        if (method === 'HEAD' || res.statusCode === 204) {
          delete res.headers['content-encoding'];
        }
        let body = Buffer.alloc(0);
        let length = config.downloadRange?.total || Number(res.headers['content-length']);
        let currentSize = config.downloadRange?.start || 0;
        res.on('data', (chunk: Buffer) => {
          if (isDownload) {
            config.onData && config.onData(chunk);
          } else {
            body = Buffer.concat([body, chunk]);
          }
          currentSize += chunk.byteLength;
          if (config.onDownloadProgress) {
            config.onDownloadProgress({
              loaded: currentSize,
              total: length,
              bytes: chunk.byteLength,
              progress: currentSize / length,
              download: true
            });
          }
        });
        res.on('end', () => {
          try {
            const { maxBodyLength, maxContentLength } = config;
            const contentLength = Number(res.headers['content-length']);
            if (
              !isUndefined(maxBodyLength) &&
              maxBodyLength > 0 &&
              body.byteLength > maxBodyLength
            ) {
              throw new AxiosError(`Response body length overflowed, length: ${body.byteLength}`, AxiosError.ERR_BAD_RESPONSE, config, client);
            }
            if (
              !isNaN(contentLength) &&
              !isUndefined(maxContentLength) &&
              contentLength > maxContentLength
            ) {
              throw new AxiosError(`Content length overflowed, length: ${contentLength}`, AxiosError.ERR_BAD_RESPONSE, config, client);
            }
            config.decompress && (body = decompressResponseBody(body, res.headers['content-encoding']));
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
              const length = Number(config.headers['Content-Length']?.toString());
              config.onUploadProgress && config.onUploadProgress({
                loaded: length,
                total: length,
                bytes: 0,
                upload: true,
                progress: 1
              });
            }
          } catch (e) {
            return reje(isAxiosError(e) ? e : new AxiosError(errorHandler(e, true), AxiosError.ERR_BAD_REQUEST, config, client));
          }
        });
        res.on('close', () => {
          try {
            let data;
            const { responseType, responseEncoding } = config;
            if (responseType === 'blob') {
              data = new Blob([body]);
            } else if (responseType === 'stream') {
              data = Readable.from(body);
            } else if (responseType === 'arraybuffer') {
              data = body;
            } else {
              const encoding = responseEncoding?.trim() || getResponseCharset(res.headers['content-type']);
              try {
                data = decode(body, encoding);
              } catch (e) {
                data = body.toString(<BufferEncoding>encoding);
              }
              if (responseType === 'document') {
                const dom = new DOMParser();
                const type = res.headers['content-type'];
                if (type?.includes('application/xhtml+xml')) {
                  data = dom.parseFromString(data, 'application/xhtml+xml');
                } else if (type?.includes('application/xml')) {
                  data = dom.parseFromString(data, 'application/xml');
                } else if (type?.includes('image/svg+xml')) {
                  data = dom.parseFromString(data, 'image/svg+xml');
                } else if (type?.includes('text/xml')) {
                  data = dom.parseFromString(data, 'text/xml');
                } else {
                  data = dom.parseFromString(data, 'text/html');
                }
              } else if (responseType === 'json') {
                data = JSON.parse(data);
              }
            }
            if (isDownload) {
              config.onData && config.onData(void 0);
              data = 'downloaded';
            } else if (method === 'HEAD') {
              data = '';
            }
            return reso({
              data,
              status: res.statusCode ? res.statusCode : -1,
              statusText: res.statusMessage ? res.statusMessage : 'unknown',
              headers: res.headers,
              config
            });
          } catch (e) {
            return reje(isAxiosError(e) ? e : new AxiosError(errorHandler(e, true), AxiosError.ERR_BAD_REQUEST, config, client));
          }
        });
        res.on('error', e => {
          return new AxiosError(e.message, AxiosError.ERR_BAD_REQUEST, config, client);
        });
      });

      client.on('error', e => {
        let msg = e.message;
        if (e.name === 'AbortError') {
          if (isDOMException(e.cause)) {
            msg = e.cause.message;
          } else if (isString(e.cause)) {
            msg = e.cause;
          }
        }
        return reje(new AxiosError(msg, AxiosError.ERR_BAD_REQUEST, config, client));
      });
      client.on('timeout', () => {
        client.destroy();
        return reje(new AxiosError(config.timeoutErrorMessage || 'connection timeout', AxiosError.ETIMEDOUT, config, client));
      });
      if (['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(method) || !config.data) {
        client.end();
        return;
      }
      const transformRequest = createTransformRequest(config);
      const requestBody = await transformRequest(config.data, config.headers);
      setHeaders(client, config.headers);
      if (isString(requestBody)) {
        client.end(requestBody);
        return;
      }
      if (isNodeFormData(requestBody)) {
        requestBody.pipe(client);
        let currentSize = 0;
        const length = Number(config.headers['Content-Length']?.toString());
        requestBody.on('data', (chunk: Buffer) => {
          if (isUndefined(chunk.byteLength)) {
            return;
          }
          currentSize += chunk.byteLength;
          const progress = currentSize / length;
          config.onUploadProgress && config.onUploadProgress({
            loaded: currentSize,
            total: length,
            bytes: chunk.byteLength,
            upload: true,
            progress: progress >= 0.98 ? 0.98 : progress
          });
        });
      }
    } catch (e) {
      return reje(isAxiosError(e) ? e : new AxiosError(errorHandler(e, true), AxiosError.ERR_BAD_REQUEST, config));
    }
  });
}