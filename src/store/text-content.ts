import { defineStore, storeToRefs } from 'pinia';
import { Chapter } from '../core/book/book';
import { BookSource } from '../core/plugins/defined/booksource';
import { chunkArray, errorHandler, newError } from '../core/utils';
import { isNull, isUndefined } from '../core/is';
import { useSettingsStore } from './settings';
import { nanoid } from 'nanoid';
import { nextTick, toRaw } from 'vue';
import { useDetailStore } from './detail';
import { useMessage } from '../hooks/message';
import { useWindowStore } from './window';
import { PagePath } from '../core/window';
import { BookParser } from '../core/book/book-parser';
import { useScrollTopStore } from './scrolltop';

export type TextContent = {
  contents: string[],
  length: number
}

export const useTextContentStore = defineStore('TextContent', {
  state: () => {
    return {
      textContent: null as TextContent | null,
      isRunningGetTextContent: false,
      currentChapter: null as Chapter | null,
    }
  },
  getters: {
  },
  actions: {
    async getTextContent(pid: string, chapter: Chapter, refresh = false): Promise<void> {
      const win = useWindowStore();
      try {
        if (this.isRunningGetTextContent) {
          return;
        }
        this.isRunningGetTextContent = true;
        this.textContent = null;
        this.currentChapter = null;
        win.disableShowSearchBox.set(PagePath.READ, true);
        win.disableShowSearchBox.set(PagePath.DETAIL, true);
        const booksource = GLOBAL_PLUGINS.getPluginInstanceById<BookSource>(pid);
        const dbTextContent = await GLOBAL_DB.store.textContentStore.getByPidAndChapterUrl(pid, chapter.url);
        this.currentChapter = chapter;
        if ((pid === BookParser.PID || !refresh) && dbTextContent) {
          const { chapter, textContent } = dbTextContent;
          const lengths = textContent.map(t => t.length);
          this.textContent = {
            contents: [chapter.title, ...textContent],
            length: lengths.length > 0 ? lengths.reduce((prev, curr) => prev + curr) : 0
          };
          return;
        }
        if (pid === BookParser.PID && !dbTextContent) {
          throw newError('无法获取章节内容');
        }
        if (isUndefined(booksource)) {
          throw newError(`无法获取插件, 插件ID:${pid}不存在`);
        }
        if (isNull(booksource)) {
          throw newError(`插件未启用, 插件ID:${pid}`);
        }
        const textContent = (await booksource.getTextContent(chapter));
        const lengths = textContent.map(t => t.length);
        this.textContent = {
          contents: [chapter.title, ...textContent],
          length: lengths.length > 0 ? lengths.reduce((prev, curr) => prev + curr) : 0
        };
        const cache = await GLOBAL_DB.store.textContentStore.getByPidAndChapterUrl(pid, chapter.url);
        if (!isNull(cache)) {
          await GLOBAL_DB.store.textContentStore.put({
            ...cache,
            textContent: this.textContent.contents
          });
        }
        return;
      } catch (e) {
        GLOBAL_LOG.error('Text Content Store getTextContent', e);
        return errorHandler(e);
      } finally {
        nextTick(() => {
          this.isRunningGetTextContent = false;
          win.disableShowSearchBox.set(PagePath.READ, false);
          win.disableShowSearchBox.set(PagePath.DETAIL, false);
          useScrollTopStore().scrollToTextContent(void 0, 'instant');
        });
      }
    },

    async cache(pid: string, detailUrl: string, chapterList: Chapter[], currentIndex: number) {
      if (pid === BookParser.PID) {
        return;
      }
      const { maxCacheChapterNumber, threadsNumber } = storeToRefs(useSettingsStore());
      const { cacheIndexs } = storeToRefs(useDetailStore());
      const cacheList = [];
      let cacheNumber = 0;
      for (let i = currentIndex; i < chapterList.length; i++) {
        if (++cacheNumber > (maxCacheChapterNumber.value + 1)) {
          break;
        }
        cacheList.push(toRaw(chapterList[i]));
      }
      const booksource = GLOBAL_PLUGINS.getPluginInstanceById<BookSource>(pid);
      if (!booksource) {
        GLOBAL_LOG.warn(`Text Content cache plugin: undefined, pid:${pid}`);
        return;
      }
      const arrs = chunkArray(cacheList, threadsNumber.value);

      for (const item of arrs) {
        const ps = [];
        for (const chapter of item) {
          try {
            if (await GLOBAL_DB.store.textContentStore.getByPidAndChapterUrl(pid, chapter.url)) {
              continue;
            }
            ps.push(new Promise<void>(async (reso, reje) => {
              try {
                const textContent = (await booksource.getTextContent(chapter));
                if (textContent.length <= 0) {
                  throw newError('text content length: 0');
                }
                await GLOBAL_DB.store.textContentStore.put({
                  id: nanoid(),
                  pid,
                  detailUrl,
                  chapter,
                  textContent
                });
                cacheIndexs.value[detailUrl].push(chapter.index);
                return reso();
              } catch (e) {
                GLOBAL_LOG.error(`Text Content cache pid:${pid}`, e);
                return reje();
              }
            }));
          } catch (e) {
            GLOBAL_LOG.error(`Text Content cache pid:${pid}`, e);
          }
        }
        await Promise.allSettled(ps);
      }
      const indexs = (await GLOBAL_DB.store.textContentStore.getByPidAndDetailUrl(pid, detailUrl))?.map(v => v.chapter.index);
      !isUndefined(indexs) && (cacheIndexs.value[detailUrl] = indexs);
    },
    async removeTextContentsByPidAndDetailUrl(pid: string, detailUrl: string): Promise<void> {
      try {
        await GLOBAL_DB.store.textContentStore.removeByPidAndDetailUrl(pid, detailUrl);
        const { cacheIndexs } = storeToRefs(useDetailStore());
        GLOBAL_DB.store.textContentStore.getByPidAndDetailUrl(pid, detailUrl).then(res => {
          const indexs = res?.map(v => v.chapter.index);
          cacheIndexs.value[detailUrl] = isUndefined(indexs) ? [] : indexs;
        });
      } catch (e) {
        useMessage().error(errorHandler(e, true));
        return errorHandler(e);
      }
    },
  }
});