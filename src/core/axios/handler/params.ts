import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  getType,
  isFile,
  isFormData,
  isFunction,
  isNodeFormData,
  isObject,
  isString,
  isURLSearchParams
} from '../../is';
import { formDataToObject, urlSearchParamsToObject } from '../utils';
import { customAlphabet } from 'nanoid';
import mime from 'mime';

export const createParamsSerializer = (config: InternalAxiosRequestConfig) => {
  if (config.paramsSerializer) {
    if (isFunction(config.paramsSerializer)) {
      return config.paramsSerializer;
    }
    if (config.paramsSerializer.serialize) {
      return config.paramsSerializer.serialize;
    }
  }
  return (params: Record<string, any>) => Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
}

export const toURLEncoded = (config: InternalAxiosRequestConfig, data?: any) => {
  const params = data || config.params;
  if (!params) {
    return '';
  }
  const paramsSerializer = createParamsSerializer(config);
  if (isObject(params)) {
    return paramsSerializer(params).trim();
  }
  if (isURLSearchParams(params)) {
    return paramsSerializer(urlSearchParamsToObject(params)).trim();
  }
  if (isFormData(params)) {
    return paramsSerializer(formDataToObject(params)).trim();
  }
  if (isString(params)) {
    return params.trim();
  }
  throw new AxiosError(`Unsupported param type ${getType(params)}`, AxiosError.ERR_NOT_SUPPORT, config);
}

export const toJSON = (config: InternalAxiosRequestConfig, data?: any) => {
  const method = config.method?.trim().toUpperCase();
  const params = data || config.data;
  if (!method || !['POST', 'PUT', 'PATCH'].includes(method)) {
    throw new AxiosError('Illegal params conversion', AxiosError.ERR_NOT_SUPPORT, config);
  }
  if (!params) {
    return '';
  }
  try {
    if (isObject(params)) {
      return JSON.stringify(params);
    }
    if (isURLSearchParams(params)) {
      return JSON.stringify(urlSearchParamsToObject(params));
    }
    if (isFormData(params)) {
      return JSON.stringify(formDataToObject(params));
    }
    if (isString(params)) {
      return params.trim();
    }
  } catch (e: any) {
    throw new AxiosError(`JSON serialization failure, ${e.message}`, AxiosError.ERR_BAD_REQUEST, config);
  }
  throw new AxiosError(`Unsupported param type: ${getType(params)}`, AxiosError.ERR_NOT_SUPPORT, config);
}

export const toMultipartFormData = (() => {
  const random = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16);

  const filename = (filename?: string) => {
    if (!filename) {
      return '';
    }
    return ` filename="${filename}"`;
  }

  return async (config: InternalAxiosRequestConfig, data?: any) => {
    const method = config.method?.trim().toUpperCase();
    const params = data || config.data;
    if (!method || !['POST', 'PUT', 'PATCH'].includes(method)) {
      throw new AxiosError('Illegal params conversion', AxiosError.ERR_NOT_SUPPORT, config);
    }
    if (!params) {
      return void 0;
    }
    const boundaryKey = `------WebKitFormBoundary${random()}`;
    let payload = '';
    if (isURLSearchParams(data)) {
      for (const [key, val] of data) {
        payload += (
          `${boundaryKey}\r\n` +
          `Content-Disposition: form-data; name="${key}";\r\n` +
          'Content-Type: text/plain\r\n\r\n' +
          `${val}\r\n`
        );
      }
    } else if (isFormData(data)) {
      for (const [key, val] of data) {
        if (isFile(val)) {
          payload += (
            `${boundaryKey}\r\n` +
            `Content-Disposition: form-data; name="${key}";${filename(val.name)}\r\n` +
            `Content-Type: ${val.type ? val.type : mime.getType(val.name)}\r\n\r\n` +
            `${await val.text()}\r\n`
          );
        } else {
          payload += (
            `${boundaryKey}\r\n` +
            `Content-Disposition: form-data; name="${key}";\r\n` +
            `Content-Type: text/plain\r\n\r\n` +
            `${val}\r\n`
          );
        }
      }
    }
    if (payload) {
      payload += `${boundaryKey}--`;
      config.headers.setContentType(`multipart/form-data; boundary=${boundaryKey}`, true);
      config.headers.setContentLength(Buffer.byteLength(payload), true);
      return payload;
    }
    if (isNodeFormData(data)) {
      const contentType = data.getHeaders()['content-type'] || data.getHeaders()['Content-Type'];
      if (!isString(contentType)) {
        throw new AxiosError('Unknown headers', AxiosError.ERR_BAD_REQUEST, config);
      }
      config.headers.setContentType(contentType, true);
      const length = await (new Promise<number>((reso, reje) => {
        data.getLength((err, length) => {
          if (err) {
            return reje(new AxiosError(err.message, AxiosError.ERR_BAD_REQUEST, config));
          }
          return reso(length);
        });
      }));
      config.headers.setContentLength(length, true);
      return data;
    }
    throw new AxiosError(`Unsupported param type: ${getType(params)}`, AxiosError.ERR_NOT_SUPPORT, config);
  }
})();