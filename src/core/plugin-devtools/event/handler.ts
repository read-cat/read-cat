import { PluginDevtools } from '..';
import { PluginDevtoolsEventCode } from '../../../../events/plugin-devtools';
import { Chapter, SearchEntity } from '../../book/book';
import { isBoolean, isFunction, isUndefined } from '../../is';
import { Logger } from '../../logger';
import { Plugins } from '../../plugins';
import { BookSource } from '../../plugins/defined/booksource';
import { SearchFilter } from '../../plugins/defined/plugins';
import { TextToSpeechEngine } from '../../plugins/defined/ttsengine';
import { errorHandler } from '../../utils';

export const sendLog = (type: string, args: any[]) => {
  GLOBAL_IPC.send(PluginDevtoolsEventCode.ASYNC_CONSOLE_LOG, void 0, type, args.map(a => Logger.toString(a)));
}

export const runSearch = (event: PluginDevtools, code: string, searchkey: string, jscode: string) => {
  GLOBAL_LOG.debug('PluginDevtools', '执行 search', 'searchkey:', searchkey, 'jscode:', jscode);
  event.plugin.importJSCode(jscode, {
    force: true,
    debug: true,
    enable: true,
    minify: true
  }).then(async (p) => {
    let filter: SearchFilter | undefined = (<any>p).__proto__.SEARCH_FILTER;
    const res = await (<BookSource>p).search(searchkey);
    if ((isBoolean(filter) && filter) || isUndefined(filter)) {
      filter = (entity: SearchEntity, searchKey: string, author?: string) => {
        if (!author) {
          return entity.bookname.includes(searchKey) || entity.author.includes(searchKey);
        } else {
          return entity.author.trim().includes(author);
        }
      }
    }
    if (isFunction(filter)) {
      event.send(code, void 0, res.filter(v => filter(v, searchkey)));
    } else {
      event.send(code, void 0, res);
    }
  }).catch(e => {
    event.send(code, errorHandler(e, true));
  });
}

export const runGetDetail = (event: PluginDevtools, code: string, detailUrl: string, jscode: string) => {
  GLOBAL_LOG.debug('PluginDevtools', '执行 getDetail', 'detailPageUrl:', detailUrl, 'jscode:', jscode);
  event.plugin.importJSCode(jscode, {
    force: true,
    debug: true,
    enable: true,
    minify: true
  }).then(p => (<BookSource>p).getDetail(detailUrl)).then(res => {
    event.send(code, void 0, res);
  }).catch(e => {
    event.send(code, errorHandler(e, true));
  });
}

export const runGetTextContent = (event: PluginDevtools, code: string, chapter: Chapter, jscode: string) => {
  GLOBAL_LOG.debug('PluginDevtools', '执行 getTextContent', 'chapter:', chapter, 'jscode:', jscode);
  event.plugin.importJSCode(jscode, {
    force: true,
    debug: true,
    enable: true,
    minify: true
  }).then(p => (<BookSource>p).getTextContent(chapter)).then(res => {
    event.send(code, void 0, res);
  }).catch(e => {
    event.send(code, errorHandler(e, true));
  });
}

let transformController: AbortController;
export const runTransform = (event: PluginDevtools, code: string, texts: string[], voice: string, jscode: string) => {
  GLOBAL_LOG.debug('PluginDevtools', '执行 transform', 'texts:', texts, 'jscode:', jscode);
  if (transformController) {
    transformController.abort();
    event.send(PluginDevtoolsEventCode.PLUGIN_TTS_ENGINE_ABORT_TRANSFORM);
  }
  transformController = new AbortController;
  event.plugin.importJSCode(jscode, {
    force: true,
    debug: true,
    enable: true,
    minify: true
  }).then(p => (<TextToSpeechEngine>p).transform(texts, {
    signal: transformController.signal,
    voice
  }, async (chunk, index) => {
    event.send(PluginDevtoolsEventCode.PLUGIN_TTS_ENGINE_TRANSFORM_NEXT_CALLBACK, void 0, {
      chunk: {
        buffer: Array.from(new Uint8Array(await chunk.blob.arrayBuffer())),
        type: chunk.blob.type,
        index: chunk.index
      },
      index
    });
  }, () => {
    event.send(PluginDevtoolsEventCode.PLUGIN_TTS_ENGINE_TRANSFORM_END_CALLBACK);
  })).then(() => {
    event.send(code, void 0);
  }).catch(e => {
    event.send(code, errorHandler(e, true));
  });
}
export const runGetVoiceList = (event: PluginDevtools, code: string, jscode: string) => {
  GLOBAL_LOG.debug('PluginDevtools', '执行 getVoiceList', 'jscode:', jscode);
  event.plugin.importJSCode(jscode, {
    force: true,
    debug: true,
    enable: true,
    minify: true
  }).then(p => (<TextToSpeechEngine>p).getVoiceList()).then(res => {
    event.send(code, void 0, res);
  }).catch(e => {
    event.send(code, errorHandler(e, true));
  });
}

export const runCompile = (event: PluginDevtools, code: string, debug: boolean, jscode: string) => {
  GLOBAL_LOG.debug('PluginDevtools', '执行 compile', 'jscode:', jscode);
  const result = Plugins.UGLIFY_JS.minify(jscode, {
    compress: {
      drop_console: !debug,
      drop_debugger: !debug
    }
  });
  if (!isUndefined(result.error)) {
    event.send(code, errorHandler(result.error, true));
  } else {
    event.send(code, void 0, debug, result.code);
  }
}