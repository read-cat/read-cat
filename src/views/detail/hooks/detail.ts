import { storeToRefs } from 'pinia';
import { useDetailStore } from '../../../store/detail';
import { isNull } from '../../../core/is';
import { useBookshelfStore } from '../../../store/bookshelf';
import { useMessage } from '../../../hooks/message';
import { md5 } from '../../../core/utils';

export const useDetail = (pid: string, detailUrl: string, setExist: (value: boolean) => void) => {
  const bookshelf = useBookshelfStore();
  const detailStore = useDetailStore();
  const message = useMessage();
  const { isRunningGetDetailPage, detailResult, error, currentDetailUrl } = storeToRefs(detailStore);
  const readyListener = new Map<string, Function>();
  const exec = (refresh = false) => {
    if (isRunningGetDetailPage.value) {
      return;
    }
    if (!refresh && currentDetailUrl.value && currentDetailUrl.value === detailUrl) {
      readyListener.forEach(cb => {
        cb();
      });
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
      if (!refresh) {
        readyListener.forEach(cb => {
          cb();
        });
      }
    }).catch(e => {
      message.error(e);
    });
  }

  const onReady = (callback: Function) => {
    readyListener.set(md5(callback.toString()), callback);
  }

  return {
    exec,
    onReady
  }
}