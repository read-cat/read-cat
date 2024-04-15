import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../store/detail';
import { useTextContentStore } from '../../../store/text-content';
import { isNull } from '../../../core/is';
import { useMessage } from '../../../hooks/message';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useWindowStore } from '../../../store/window';
import { errorHandler } from '../../../core/utils';

export const useTextContent = () => {
  const { detailResult, currentDetailUrl, currentPid } = storeToRefs(useDetailStore());
  const { setCurrentReadIndex } = useDetailStore();
  const { currentChapter, isRunningGetTextContent } = storeToRefs(useTextContentStore());
  const { getTextContent, cache } = useTextContentStore();
  const message = useMessage();
  const { exist, getBookshelfEntity, put } = useBookshelfStore();
  const { calcReadProgress } = useWindowStore();
  const handler = async (type: 'next' | 'prev') => {
    try {
      if (isRunningGetTextContent.value) {
        throw '正在获取章节正文';
      }
      if (isNull(detailResult.value) || detailResult.value.chapterList.length <= 0) {
        throw '无法获取章节列表';
      }
      if (isNull(currentChapter.value)) {
        throw '无法获取当前章节信息';
      }
      if (isNull(currentPid.value)) {
        throw '无法获取插件ID';
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
        throw '未知类型';
      }
      const chapter = detailResult.value.chapterList[index];
      await getTextContent(currentPid.value, chapter);
      calcReadProgress();
      setCurrentReadIndex(index);
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
          readIndex: chapter.index
        });
      });
    } catch (e) {
      e && message.error(errorHandler(e, true));
      return e ? errorHandler(e) : Promise.reject();
    }
  }

  const nextChapter = async () => {
    await handler('next');
  }

  const prevChapter = async () => {
    await handler('prev');
  }

  return {
    nextChapter,
    prevChapter
  }
}