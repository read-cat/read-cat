import { PluginDevtools } from '..';
import { PluginDevtoolsEventCode } from '../../../../events/plugin-devtools';
import { Chapter } from '../../book/book';
import { isUndefined } from '../../is';
import { Logger } from '../../logger';
import { Plugins } from '../../plugins';
import { BookSource } from '../../plugins/defined/booksource';
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
  }).then(p => (<BookSource>p).search(searchkey)).then(res => {
    event.send(code, void 0, res);
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
  }).then(async p => (<BookSource>p).getTextContent(chapter)).then(res => {
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