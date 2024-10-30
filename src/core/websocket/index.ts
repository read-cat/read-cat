import { WebSocket } from 'ws';
import { handlerProxy } from '../request';
import { RequestProxy } from '../request/defined/request';
import { useSettingsStore } from '../../store/settings';
import { newError } from '../utils';
import { CustomClientOptions } from './defined';
import { isArray, isString, isUndefined } from '../is';

const _WebSocket: typeof WebSocket = require('ws').WebSocket;

export class WebSocketClient extends _WebSocket {
  constructor(address: string | URL);
  constructor(address: string | URL, options?: CustomClientOptions);
  constructor(
    address: string | URL,
    protocols?: string | string[],
    options?: CustomClientOptions,
  );
  constructor(address: string | URL, protocols?: string | string[] | CustomClientOptions, options?: CustomClientOptions) {
    let _protocols: string | string[] | undefined,
      _options: CustomClientOptions | undefined
      ;
    if (isString(protocols) || isArray(protocols)) {
      _protocols = protocols;
      _options = options;
    } else {
      _protocols = void 0;
      _options = protocols;
    }

    let proxy: RequestProxy | undefined = void 0;
    const settings = useSettingsStore();
    if (_options?.proxy) {
      if (settings.options.enableProxy) {
        proxy = settings.proxy;
      } else {
        throw newError('Proxy not enabled');
      }
    }
    _options = _options ? {
      ..._options,
      agent: handlerProxy(proxy)
    } : void 0;
    if (!isUndefined(_protocols)) {
      super(address, _protocols, _options);
    } else {
      super(address, _options);
    }
  }
}