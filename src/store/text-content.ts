import { defineStore, storeToRefs } from 'pinia';
import { Chapter } from '../core/book/book';
import { BookSource } from '../core/plugins/plugins';
import { chunkArray, errorHandler } from '../core/utils';
import { isUndefined } from '../core/is';
import { useSettingsStore } from './settings';
import { nanoid } from 'nanoid';
import { toRaw } from 'vue';
import { useDetailStore } from './detail';
import { useMessage } from '../hooks/message';
import { useWindowStore } from './window';
import { PagePath } from '../core/window';


export const useTextContentStore = defineStore('TextContent', {
  state: () => {
    return {
      textContent: null as string[] | null,
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
        if (isUndefined(booksource)) {
          throw `无法获取插件, 插件ID:${pid}不存在`;
        }
        const dbTextContent = await GLOBAL_DB.store.textContentStore.getByPidAndChapterUrl(pid, chapter.url);
        if (dbTextContent && !refresh) {
          const { chapter, textContent } = dbTextContent;
          this.currentChapter = chapter;
          this.textContent = textContent;
        } else {
          this.textContent = (await booksource.getTextContent(chapter)).map(v => v.trim()).filter(v => v !== '');
          this.currentChapter = chapter;
        }
        return;
      } catch (e) {
        GLOBAL_LOG.error('Text Content Store getTextContent', e);
        return errorHandler(e);
      } finally {
        this.isRunningGetTextContent = false;
        win.disableShowSearchBox.set(PagePath.READ, false);
        win.disableShowSearchBox.set(PagePath.DETAIL, false);
      }
    },

    async cache(pid: string, detailUrl: string, chapterList: Chapter[], currentIndex: number) {
      const { maxCacheChapterNumber, threadsNumber } = storeToRefs(useSettingsStore());
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
        GLOBAL_LOG.warn(`Text Content cache plugin: undefined, pid:${pid}`, cacheList);
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
                const textContent = (await booksource.getTextContent(chapter)).map(v => v.trim()).filter(v => v !== '');
                if (textContent.length <= 0) {
                  throw `text content length: 0`;
                }
                await GLOBAL_DB.store.textContentStore.put({
                  id: nanoid(),
                  pid,
                  detailUrl,
                  chapter,
                  textContent
                });
                return reso();
              } catch (e) {
                GLOBAL_LOG.error(`Text Content cache pid:${pid}`, chapter, e);
                return reje();
              }
            }));
          } catch (e) {
            GLOBAL_LOG.error(`Text Content cache pid:${pid}`, chapter, e);
          }
        }
        await Promise.allSettled(ps);
      }
      const { cacheIndexs } = storeToRefs(useDetailStore());
      const indexs = (await GLOBAL_DB.store.textContentStore.getByPidAndDetailUrl(pid, detailUrl))?.map(v => v.chapter.index);
      !isUndefined(indexs) && (cacheIndexs.value = indexs);
    },
    async removeTextContentsByPidAndDetailUrl(pid: string, detailUrl: string): Promise<void> {
      try {
        await GLOBAL_DB.store.textContentStore.removeByPidAndDetailUrl(pid, detailUrl);
        const { cacheIndexs } = storeToRefs(useDetailStore());
        GLOBAL_DB.store.textContentStore.getByPidAndDetailUrl(pid, detailUrl).then(res => {
          const indexs = res?.map(v => v.chapter.index);
          cacheIndexs.value = isUndefined(indexs) ? [] : indexs;
        });
      } catch (e) {
        useMessage().error(errorHandler(e, true));
        return errorHandler(e);
      }
    },
  }
});