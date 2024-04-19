import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { errorHandler, newAxiosError } from '../../utils';
import { joinUrl } from './url';

export const createAgent = (config: InternalAxiosRequestConfig) => {
  try {
    if (config.httpsAgent && config.httpAgent) {
      return joinUrl(config).startsWith('http:') ? config.httpAgent : config.httpsAgent;
    }
    if (config.httpsAgent) {
      return config.httpsAgent;
    }
    if (config.httpAgent) {
      return config.httpAgent;
    }
    return void 0;
  } catch (e) {
    throw newAxiosError(errorHandler(e, true), AxiosError.ERR_BAD_REQUEST, config);
  }
}