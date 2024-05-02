import { Ref } from 'vue';
import { DetailPageResult, useDetailStore } from '../../../store/detail';
import { useTextContentStore } from '../../../store/text-content';
import { Chapter } from '../../../core/book/book';
import { useRouter } from 'vue-router';
import { PagePath } from '../../../core/window';
import { useMessage } from '../../../hooks/message';
import { storeToRefs } from 'pinia';
import { isUndefined } from '../../../core/is';

export const useTextContent = (detailResult: Ref<DetailPageResult | null>, detailUrl: string, existBookshelf: Ref<boolean>) => {
  const { cache, getTextContent } = useTextContentStore();
  const { currentChapter } = storeToRefs(useTextContentStore());
  const router = useRouter();
  const message = useMessage();
  const { setCurrentReadIndex } = useDetailStore();
  const getChapterContent = (chapter: Chapter) => {
    if (!detailResult.value) {
      return;
    }
    const { pid, chapterList } = detailResult.value;
    getTextContent(pid, chapter).then(() => {
      if (isUndefined(chapter.index)) {
        setCurrentReadIndex(-1);
        GLOBAL_LOG.warn(`chapter index is undefined, pid:${pid}`, chapter);
        message.warning('无法获取章节索引');
      } else {
        setCurrentReadIndex(chapter.index);
      }
      currentChapter.value = chapter;
      router.push({
        path: PagePath.READ,
        query: {
          pid,
          detailUrl
        }
      });
      if (existBookshelf.value) {
        cache(pid, detailUrl, chapterList, chapter.index);
      }
    }).catch(e => {
      message.error(e.message);
    });
  }

  return {
    getChapterContent
  }
}