import { storeToRefs } from 'pinia';
import { nextTick, ref, watchEffect } from 'vue';
import { useBookmarkStore } from '../../../store/bookmark';
import { useDetailStore } from '../../../store/detail';
import { useTextContentStore } from '../../../store/text-content';
import { isNull, isUndefined } from '../../../core/is';
import { BookmarkStoreEntity } from '../../../core/database/database';
import { useWindowStore } from '../../../store/window';
import { useMessage } from '../../../hooks/message';
import { PagePath } from '../../../core/window';
import { useRouter } from 'vue-router';
import { useScrollTopStore } from '../../../store/scrolltop';
import { WindowEvent } from '../../window/index.vue';

export type BookmarkTreeChildren = {
  bid: string
  id: string
  label: string
}
export type BookmarkTree = {
  id: string
  label: string
  children: BookmarkTreeChildren[]
}

export const useBookmark = (windowEvent?: WindowEvent) => {
  const { bookmarks } = storeToRefs(useBookmarkStore());
  const { getBookmarkById } = useBookmarkStore();
  const {
    currentDetailUrl,
    detailResult,
    currentPid
  } = storeToRefs(useDetailStore());
  const { setCurrentReadIndex } = useDetailStore();
  const bookmarkTree = ref<BookmarkTree[]>([]);
  const currentChapterBookmarkId = ref<string | undefined>();
  const { currentChapter } = storeToRefs(useTextContentStore());
  const { currentPath } = storeToRefs(useWindowStore());
  const { getTextContent } = useTextContentStore();
  const { scrollTop } = useScrollTopStore();
  const router = useRouter();
  const message = useMessage();

  const handler = (entitys: BookmarkStoreEntity[], detailUrl: string | null) => {
    bookmarkTree.value = entitys
      .filter(b => b.detailUrl === detailUrl)
      .map<BookmarkTree>(b => {
        return {
          id: b.id,
          label: b.chapterTitle,
          children: b.range.map<BookmarkTreeChildren>(r => {
            return {
              bid: b.id,
              id: r.id,
              label: r.content
            }
          })
        }
      });
  }

  watchEffect(() => {
    currentChapterBookmarkId.value = bookmarks.value.find(b => b.chapterUrl === currentChapter.value?.url)?.id;
    handler(bookmarks.value, currentDetailUrl.value);
  });
  function isBookmarkTreeChildren(val: any): val is BookmarkTreeChildren {
    return !isUndefined(val.bid);
  }
  const nodeClick = (data: BookmarkTree | BookmarkTreeChildren) => {
    if (!isBookmarkTreeChildren(data)) {
      return;
    }
    windowEvent?.hide();
    if (isNull(currentPid.value)) {
      message.error('无法获取插件ID');
      return;
    }
    const bookmark = getBookmarkById(data.bid);
    if (isUndefined(bookmark)) {
      message.error('无法获取书签');
      return;
    }
    if (isNull(detailResult.value)) {
      message.error('无法获取当前详情页');
      return;
    }
    const chapter = detailResult.value.chapterList.find(c => c.url === bookmark.chapterUrl);
    if (isUndefined(chapter)) {
      message.error('无法获取章节');
      return;
    }
    getTextContent(currentPid.value, chapter).then(() => {
      setCurrentReadIndex(isUndefined(chapter.index) ? -1 : chapter.index);
      currentChapter.value = chapter;
      if (currentPath.value !== PagePath.READ) {
        return router.push({
          path: PagePath.READ,
          query: {
            pid: currentPid.value,
            detailUrl: currentDetailUrl.value
          }
        });
      }
    }).then(() => {
      nextTick(() => {
        //滚动至书签所在位置
        const ele = document.getElementById(data.id);
        if (isNull(ele)) {
          return;
        }
        scrollTop(ele.offsetTop - 10);
      });
    }).catch(e => {
      message.error(e.message);
    });
  }
  return {
    bookmarkTree,
    currentChapterBookmarkId,
    nodeClick,
  }
}