import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../store/detail';
import { isNull } from '../../../core/is';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useMessage } from '../../../hooks/message';

export const useDetail = (pid: string, detailUrl: string, setExist: (value: boolean) => void) => {
  const bookshelf = useBookshelfStore();
  const detailStore = useDetailStore();
  const message = useMessage();
  const { isRunningGetDetailPage, detailResult, error, currentDetailUrl } = storeToRefs(detailStore);
  const exec = (refresh = false) => {
    if (isRunningGetDetailPage.value) {
      return;
    }
    if (!refresh && currentDetailUrl.value && currentDetailUrl.value === detailUrl) {
      return;
    }
    detailStore.getDetailPage(pid, detailUrl, refresh).then(() => {
      if (!isNull(error.value)) {
        return Promise.reject(error.value);
      }
      if (isNull(detailResult.value)) {
        error.value = 'detail result is null';
        return Promise.reject(error.value);
      }
      const { pid } = detailResult.value;
      setExist(bookshelf.exist(pid, detailUrl));
    }).catch(e => {
      message.error(e);
    });
  }

  return {
    exec
  }
}