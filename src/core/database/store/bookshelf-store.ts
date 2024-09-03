import { useBookshelfStore } from '../../../store/bookshelf';
import { isNull, isUndefined } from '../../is';
import { BookshelfStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';
import { useMessage } from '../../../hooks/message';
import { BookParser } from '../../book/book-parser';

export class BookshelfStoreDatabase extends BaseStoreDatabase<BookshelfStoreEntity> {
  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'BookshelfStoreDatabase');
  }
  public read() {
    const message = useMessage();
    const store = useBookshelfStore();
    super.getAll().then(res => {
      if (isNull(res) || res.length <= 0) {
        return;
      }
      res.forEach((entity) => {
        const {
          id,
          pid,
          detailPageUrl,
          bookname,
          author,
          chapterList,
          coverImageUrl,
          latestChapterTitle,
          searchIndex,
          readIndex,
          timestamp,
          pluginVersionCode,
          baseUrl
        } = entity;
        const props = GLOBAL_PLUGINS.getPluginPropsById(pid);
        store._books.set(id, {
          id,
          pid,
          detailPageUrl,
          bookname,
          author,
          coverImageUrl,
          latestChapterTitle,
          searchIndex,
          readIndex,
          readChapterTitle: chapterList[readIndex]?.title,
          timestamp,
          pluginVersionCode,
          isRunningRefresh: false,
          baseUrl,
          group: pid === BookParser.PID ? '内置' : props?.GROUP || 'unknown',
          pluginName: pid === BookParser.PID ? '本地书籍' : props?.NAME || 'unknown'
        });
      });
    }).catch((e: any) => {
      GLOBAL_LOG.error(this.tag, 'read', e);
      message.error(`书架读取失败, Error: ${e.message}`);
    });
  }
  getByPidAndDetailPageUrl(pid: string, detailPageUrl: string) {
    return new Promise<BookshelfStoreEntity | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_pid_url')
          .get(IDBKeyRange.only([pid, detailPageUrl]));
        requ.onsuccess = () => {
          let result: BookshelfStoreEntity | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          GLOBAL_LOG.error(this.tag, `getByPidAndDetailPageUrl pid:${pid}, detailPageUrl:${detailPageUrl}`, requ.error);
          return reje(requ.error);
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByPidAndDetailPageUrl pid:${pid}, detailPageUrl:${detailPageUrl}`, e);
        return reje(e);
      }

    });
  }
  async put(val: BookshelfStoreEntity): Promise<void> {
    const _val = super.revocationProxy(val);
    const raw = await this.getByPidAndDetailPageUrl(_val.pid, _val.detailPageUrl);
    await super.put({
      ..._val,
      chapterList: _val.chapterList.map((v, i) => {
        v.index = isUndefined(v.index) ? i : v.index;
        return v;
      }),
      id: isNull(raw) ? _val.id : raw.id
    });
  }
  async removeByPidAndDetailPageUrl(pid: string, detailPageUrl: string): Promise<void> {
    try {
      await this.useCursorRemove('index_pid_url', [pid, detailPageUrl]);
    } catch (e) {
      GLOBAL_LOG.error(this.tag, `removeByPidAndDetailPageUrl pid:${pid}, detailPageUrl:${detailPageUrl}`, e);
      return Promise.reject(e);
    }
  }
}