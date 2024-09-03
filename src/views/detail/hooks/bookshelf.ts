import { Ref, ref, toRaw, watch } from 'vue';
import { DetailPageResult, useDetailStore } from '../../../store/detail';
import { nanoid } from 'nanoid';
import { ElMessageBox } from 'element-plus';
import { useBookshelfStore } from '../../../store/bookshelf';
import { storeToRefs } from 'pinia';
import { useBookmarkStore } from '../../../store/bookmark';
import { useTextContentStore } from '../../../store/text-content';
import { useMessage } from '../../../hooks/message';
import { useRouter } from 'vue-router';
import { BookParser } from '../../../core/book/book-parser';

export const useBookshelf = (pid: string, detailUrl: string, detailResult: Ref<DetailPageResult | null>) => {
  const exist = ref(false);
  const bookshelf = useBookshelfStore();
  const bookmark = useBookmarkStore();
  const textContent = useTextContentStore();
  const message = useMessage();
  const { currentReadIndex } = storeToRefs(useDetailStore());
  const { currentReadScrollTop } = useDetailStore();
  const router = useRouter();
  const putAndRemoveBookshelf = () => {
    if (!detailResult.value) {
      return;
    }
    if (exist.value) {
      ElMessageBox.confirm(`<p>是否将 ${detailResult.value.bookname} 移出书架?</p><p>移出书架后将清空该书本的书签及缓存</p>`, '', {
        type: 'info',
        dangerouslyUseHTMLString: true,
        confirmButtonText: '移出',
        cancelButtonText: '取消'
      }).then(() => {
        const loading = message.loading(`正在将 ${detailResult.value?.bookname} 移出书架`);
        bookshelf.removeByPidAndDetailUrl(pid, detailUrl).then(() => {
          pid === BookParser.PID && router.back();
          return Promise.allSettled([
            bookmark.removeBookmarksByDetailUrl(detailUrl),
            textContent.removeTextContentsByPidAndDetailUrl(pid, detailUrl)
          ]);
        }).then(() => {
          message.success(`已将 ${detailResult.value?.bookname} 移出书架`);
        }).finally(() => {
          loading.close();
          exist.value = bookshelf.exist(pid, detailUrl);
        });
      }).catch(() => {});
      return;
    }
    bookshelf.put({
      id: nanoid(),
      detailPageUrl: detailUrl,
      ...toRaw(detailResult.value),
      readIndex: currentReadScrollTop.chapterIndex,
      readScrollTop: currentReadScrollTop.scrollTop,
      searchIndex: [detailResult.value.bookname, detailResult.value.author].join(' '),
      timestamp: Date.now()
    }).finally(() => {
      exist.value = bookshelf.exist(pid, detailUrl);
    });
  }
  const setExist = (value: boolean) => {
    exist.value = value;
  }
  exist.value = bookshelf.exist(pid, detailUrl);
  watch(() => currentReadIndex.value, (newVal, _) => {
    if (!bookshelf.exist(pid, detailUrl)) {
      return;
    }
    bookshelf.getBookshelfEntity(pid, detailUrl).then(entity => {
      if (!entity) {
        return;
      }
      bookshelf.put({
        ...entity,
        readIndex: newVal
      });
    });
  });
  return {
    exist,
    putAndRemoveBookshelf,
    setExist
  }
}