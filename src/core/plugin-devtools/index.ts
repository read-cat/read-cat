import { existsSync } from 'fs';
import fs from 'fs/promises';
import { isNull, isUndefined } from '../is';
import path from 'path';
import { createServer, Server } from 'http';
import _express, { Express } from 'express';
import { createHash } from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { PluginDevtoolsEventCode } from '../../../events/plugin-devtools';
import { EventCode } from '../../../events';
import {
  runCompile,
  runGetDetail,
  runGetTextContent,
  runGetVoiceList,
  runSearch,
  runTransform,
  sendLog,
  runBookStore
} from './event/handler';
import { Plugins } from '../plugins';
import { BasePluginStoreInterface } from '../plugins/defined/plugins';
import { Logger, LogType } from '../logger';
import { errorHandler, newError } from '../utils';
import { Metadata } from './rpdt';

const WEB_SOCKET_SERVER = require('ws').Server;
const express: typeof _express = require('express');

class TempPluginStore implements BasePluginStoreInterface {
  private store: Map<string, any>;
  constructor() {
    this.store = new Map();
  }
  getStoreValue<R = any>(key: string): Promise<R | null> {
    const val = this.store.get(key);
    if (isUndefined(val)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(val);
  }
  setStoreValue<V = any>(key: string, value: V): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
  removeStoreValue(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }

}

const disposeLog = (type: LogType, ...args: any[]) => {
  const { raw } = Logger.getHead(type);
  return [raw, ...args];
}

export class PluginDevtools {
  private server: Server | null = null;
  private app: Express | null = null;
  private port: number | null = null;
  private wss: WebSocketServer | null = null;
  private ws: WebSocket | null = null;

  private closedListener;
  public onclose: (() => void) | undefined = void 0;
  public plugin: Plugins;
  
  constructor() {
    this.closedListener = () => this.release();
    this.plugin = new Plugins({
      storeCreateFunction: () => new TempPluginStore(),
      console: {
        log: (...args: any[]) => {
          sendLog('log', disposeLog('info', ...args));
        },
        error: (...args: any[]) => {
          sendLog('error', disposeLog('error', ...args));
        },
        warn: (...args: any[]) => {
          sendLog('warn', disposeLog('warn', ...args));
        },
        debug: (...args: any[]) => {
          sendLog('verbose', disposeLog('verbose', ...args));
        },
        info: (...args: any[]) => {
          sendLog('info', disposeLog('info', ...args));
        }
      },
    });
    GLOBAL_IPC.on(EventCode.ASYNC_PLUGIN_WINDOW_CLOSED, this.closedListener);
  }
  public startServer(resourcePath: string, port: number): Promise<void> {
    return new Promise<void>(async (reso, reje) => {
      try {
        if (
          !existsSync(resourcePath) ||
          !existsSync(path.join(resourcePath, 'metadata.json')) ||
          !existsSync(path.join(resourcePath, 'index.html'))
        ) {
          throw newError('Not a qualified plugin devtools resource path');
        }
        const metadata: Metadata = JSON.parse(await fs.readFile(path.join(resourcePath, 'metadata.json'), 'utf-8'));
        for (const { file, sha256 } of metadata.files) {
          const hash = createHash('sha256');
          const buf = await fs.readFile(path.join(resourcePath, ...file.split('\\')));
          hash.update(buf);
          const hex = hash.digest('hex');
          if (sha256 === hex) {
            continue;
          }
          throw newError(`File "${file}" sha256 does not match`);
        }
        this.app = express();
        this.app.use(express.static(resourcePath));
        this.server = createServer(this.app);
        this.port = port;
        this.server.on('error', e => {
          this.server = null;
          this.app = null;
          this.wss = null;
          this.ws = null;
          return reje(e);
        });
        this.server.on('listening', () => {
          return reso();
        });
        this.wss = <WebSocketServer>(new WEB_SOCKET_SERVER({
          server: this.server
        }));
        this.wss.on('connection', ws => {
          GLOBAL_LOG.info('PluginDevtools connection');
          this.ws = ws;
          ws.on('message', data => {
            const { code, args } = JSON.parse(data.toString('utf-8'));
            this.eventHandler(code, ...args);
          });

        });
        this.wss.on('error', e => {
          this.server = null;
          this.app = null;
          this.wss = null;
          this.ws = null;
          return reje(e);
        });
        this.server.listen(port, 'localhost');
      } catch (e) {
        return reje(newError(errorHandler(e, true)));
      }
    });
  }
  private isStart() {
    if (isNull(this.app) || isNull(this.server) || isNull(this.wss) || isNull(this.port)) {
      throw newError('Service not started');
    }
  }
  public open() {
    this.isStart();
    GLOBAL_IPC.send(PluginDevtoolsEventCode.ASYNC_CREATE_PLUGIN_DEVTOOLS_WINDOW, `http://localhost:${this.port}`);
  }
  private release() {
    this.wss?.close();
    this.ws?.close();
    this.server?.close();
    this.app = null;
    this.server = null;
    this.wss = null;
    this.ws = null;
    this.port = null;
    GLOBAL_IPC.removeListener(EventCode.ASYNC_PLUGIN_WINDOW_CLOSED, this.closedListener);
    this.onclose && this.onclose();
    GLOBAL_LOG.info('PluginDevtools', 'release');
  }
  public close() {
    GLOBAL_IPC.send(PluginDevtoolsEventCode.ASYNC_CLOSE_PLUGIN_DEVTOOLS_WINDOW);
  }
  private eventHandler(code: string, ...args: any[]) {
    switch (code) {
      case PluginDevtoolsEventCode.CLOSE_WINDOW:
        this.close();
        break;
      case PluginDevtoolsEventCode.PLUGIN_BOOKSOURCE_RUN_SEARCH:
        runSearch(this, code, args[0], args[1]);
        break;
      case PluginDevtoolsEventCode.PLUGIN_BOOKSOURCE_RUN_GET_DETAIL:
        runGetDetail(this, code, args[0], args[1]);
        break;
      case PluginDevtoolsEventCode.PLUGIN_BOOKSOURCE_RUN_GET_TEXT_CONTENT:
        runGetTextContent(this, code, args[0], args[1]);
        break;
      case PluginDevtoolsEventCode.PLUGIN_COMPILE:
        runCompile(this, code, args[0], args[1]);
        break;
      case PluginDevtoolsEventCode.PLUGIN_TTS_ENGINE_RUN_TRANSFORM:
        runTransform(this, code, args[0], args[1], args[2]);
        break;
      case PluginDevtoolsEventCode.PLUGIN_TTS_ENGINE_RUN_GET_VOICE_LIST:
        runGetVoiceList(this, code, args[0]);
        break;
      case PluginDevtoolsEventCode.PLUGIN_BOOKSTORE_RUN:
        runBookStore(this, code, args[0], args[1]);
        break;
      default:
        break;
    }
  }
  public send(code: string, error?: string, ...args: any[]) {
    this.isStart();
    this.ws?.send(JSON.stringify({
      code,
      error,
      args
    }));
  }
}