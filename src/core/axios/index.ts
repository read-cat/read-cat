import { Logger } from '../logger';
import adapter from './adapter';
import { createWriteStream, existsSync, WriteStream } from 'fs';
import FormDataType from 'form-data';
import { CustomAxiosRequestConfig, CustomAxiosStatic, CustomDownloadAxiosRequestConfig } from './defined/axios';

const NodeFormData: typeof FormDataType = require('form-data');
Object.defineProperty(NodeFormData.prototype, Symbol.toStringTag, {
  value: 'NodeFormData',
  configurable: false,
  writable: false
});
Object.defineProperty(window, 'NodeFormData', {
  value: NodeFormData,
  configurable: false,
  writable: false
});
const axios: CustomAxiosStatic = require('axios');

const customAxios = axios.create({
  adapter,
  timeout: 15 * 1000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': navigator.userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
  },
  responseType: 'arraybuffer',
  decompress: true,
  proxy: false,
  rejectUnauthorized: false,
});
customAxios.defaults.transformRequest = void 0;
customAxios.download = (() => {
  const download = async (
    url: string,
    stream: WriteStream,
    config?: CustomAxiosRequestConfig,
    range?: {
      start: number,
      end: number,
      total: number
    }
  ) => {
    if (!range) {
      return await customAxios({
        ...config,
        method: 'download',
        url,
        onData(next) {
          next ? stream.write(next) : stream.close();
        }
      });
    }
    const { start, end, total } = range;
    return await customAxios(<CustomDownloadAxiosRequestConfig>{
      ...config,
      method: 'download',
      url,
      headers: {
        range: `bytes=${start}-${end}`
      },
      downloadRange: {
        start,
        total
      },
      onData(next) {
        next ? stream.write(next) : stream.close();
      }
    });
  }
  return async (url, target, config) => {
    const { headers } = await customAxios.head(url, config);
    const isRange = headers['accept-ranges'] === 'bytes';
    const total = Number(headers['content-length']);
    if (existsSync(target)) {
      throw new Error(`target exist: ${target}`);
    }
    if (!isRange || isNaN(total)) {
      await download(url, createWriteStream(target), config);
      return;
    }
    const num = 64;
    const dsize = Math.floor((total - 1) / num);
    const rsize = (total - 1) % num;
    const arr: [number, number][] = [];
    for (let i = 0; i < num; i++) {
      arr.push([i * dsize + (i > 0 ? 1 : 0), (i + 1) * dsize]);
    }
    rsize > 0 && arr.push([dsize * num + 1, dsize * num + rsize]);
    for (const [start, end] of arr) {
      await download(url, createWriteStream(target, {
        flags: 'a',
        start,
      }), config, {
        start,
        end,
        total
      });
    }
  }
})();
customAxios.test = async (url, config) => {
  try {
    const start = Date.now();
    await customAxios.head(url, config);
    const end = Date.now();
    return end - start;
  } catch (e) {
    throw e;
  }
}

customAxios.interceptors.response.use(resp => {
  if ([2, 3].includes(Math.floor(resp.status / 100))) {
    return Promise.resolve(resp);
  }
  return Promise.reject(new Error(
    `status:${resp.status}, ${resp.statusText}\n` +
    `headers: ${Logger.toString(resp.headers, 2, true)}\n` +
    resp.data.toString()
  ));
}, err => {
  return Promise.reject(err);
});

export default customAxios;