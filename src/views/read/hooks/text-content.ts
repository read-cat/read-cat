import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../store/detail';
import { useTextContentStore } from '../../../store/text-content';
import { isNull } from '../../../core/is';
import { useMessage } from '../../../hooks/message';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useWindowStore } from '../../../store/window';
import { errorHandler, newError } from '../../../core/utils';
import { useScrollTopStore } from '../../../store/scrolltop';

export const useTextContent = () => {
  const { detailResult, currentDetailUrl, currentPid } = storeToRefs(useDetailStore());
  const { setCurrentReadIndex, currentReadScrollTop } = useDetailStore();
  const { currentChapter, isRunningGetTextContent } = storeToRefs(useTextContentStore());
  const { getTextContent, cache } = useTextContentStore();
  const message = useMessage();
  const { exist, getBookshelfEntity, put } = useBookshelfStore();
  const { calcReadProgress } = useWindowStore();
  const { mainElement } = storeToRefs(useScrollTopStore());
  
  const handler = async (type: 'next' | 'prev') => {
    try {
      if (isRunningGetTextContent.value) {
        throw newError('正在获取章节正文');
      }
      if (isNull(detailResult.value) || detailResult.value.chapterList.length <= 0) {
        throw newError('无法获取章节列表');
      }
      if (isNull(currentChapter.value)) {
        throw newError('无法获取当前章节信息');
      }
      if (isNull(currentPid.value)) {
        throw newError('无法获取插件ID');
      }
      let index;
      if (type === 'next') {
        index = currentChapter.value.index + 1;
        if (index >= detailResult.value.chapterList.length) {
          message.warning('当前已是最后一章');
          throw null;
        }
      } else if (type === 'prev') {
        index = currentChapter.value.index - 1;
        if (index < 0) {
          message.warning('当前已是第一章');
          throw null;
        }
      } else {
        throw newError('未知类型');
      }
      const chapter = detailResult.value.chapterList[index];
      await getTextContent(currentPid.value, chapter);
      calcReadProgress();
      setCurrentReadIndex(index);
      currentReadScrollTop.chapterIndex = index;
      currentReadScrollTop.scrollTop = 0;
      if (isNull(currentPid.value) || isNull(currentDetailUrl.value) || isNull(detailResult.value)) {
        return;
      }
      if (!exist(currentPid.value, currentDetailUrl.value)) {
        return;
      }
      cache(currentPid.value, currentDetailUrl.value, detailResult.value.chapterList, index);
      getBookshelfEntity(currentPid.value, currentDetailUrl.value).then(entity => {
        if (!entity) {
          return;
        }
        put({
          ...entity,
          readIndex: chapter.index,
          readScrollTop: 0
        });
      });
    } catch (e) {
      e && message.error(errorHandler(e, true));
      return e ? errorHandler(e) : Promise.reject();
    }
  }

  const nextChapter = async (ignoreError = false) => {
    await handler('next').then(() => {
      mainElement.value.scrollTop = 0;
    }).catch(e => ignoreError ? Promise.resolve() : Promise.reject(e));
    
  }

  const prevChapter = async (ignoreError = false) => {
    await handler('prev').then(() => {
      mainElement.value.scrollTop = 0;
    }).catch(e => ignoreError ? Promise.resolve() : Promise.reject(e));
    
  }

  return {
    nextChapter,
    prevChapter
  }
}