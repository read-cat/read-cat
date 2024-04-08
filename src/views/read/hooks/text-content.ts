import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../store/detail';
import { useTextContentStore } from '../../../store/text-content';
import { isNull } from '../../../core/is';
import { useMessage } from '../../../hooks/message';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useWindowStore } from '../../../store/window';

export const useTextContent = () => {
  const { detailResult, currentDetailUrl, currentPid } = storeToRefs(useDetailStore());
  const { setCurrentReadIndex } = useDetailStore();
  const { currentChapter, isRunningGetTextContent } = storeToRefs(useTextContentStore());
  const { getTextContent, cache } = useTextContentStore();
  const message = useMessage();
  const { exist, getBookshelfEntity, put } = useBookshelfStore();
  const { calcReadProgress } = useWindowStore();
  const handler = (type: 'next' | 'prev') => {
    if (isRunningGetTextContent.value) {
      return;
    }
    if (isNull(detailResult.value) || detailResult.value.chapterList.length <= 0) {
      message.error('无法获取章节列表');
      return;
    }
    if (isNull(currentChapter.value)) {
      message.error('无法获取当前章节信息');
      return;
    }
    if (isNull(currentPid.value)) {
      message.error('无法获取插件ID');
      return;
    }
    let index;
    if (type === 'next') {
      index = currentChapter.value.index + 1;
      if (index >= detailResult.value.chapterList.length) {
        message.warning('当前已是最后一章');
        return;
      }
    } else if (type === 'prev') {
      index = currentChapter.value.index - 1;
      if (index < 0) {
        message.warning('当前已是第一章');
        return;
      }
    } else {
      return;
    }
    const chapter = detailResult.value.chapterList[index];
    getTextContent(currentPid.value, chapter).then(() => {
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
    }).catch(e => {
      message.error(e.message);
    });
  }

  const nextChapter = () => {
    handler('next');
  }

  const prevChapter = () => {
    handler('prev');
  }

  return {
    nextChapter,
    prevChapter
  }
}