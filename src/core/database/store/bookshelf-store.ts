import { useBookshelfStore } from '../../../store/bookshelf';
import { isNull, isUndefined } from '../../is';
import { BookshelfStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';
import { useMessage } from '../../../hooks/message';

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
        store._books.push({
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
          group: props ? props.GROUP : 'unknown',
          pluginName: props ? props.NAME: 'unknown'
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
          .get(IDBKeyRange.only([super.toRaw(pid), super.toRaw(detailPageUrl)]));
        requ.onsuccess = () => {
          let result: BookshelfStoreEntity | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByPidAndDetailPageUrl pid:${pid}, detailPageUrl:${detailPageUrl}`, e);
        return reje(e);
      }

    });
  }
  async put(val: BookshelfStoreEntity): Promise<void> {
    const _val = super.toRaw(val);
    const raw = await this.getByPidAndDetailPageUrl(_val.pid, _val.detailPageUrl);
    await super.put({
      ..._val,
      chapterList: val.chapterList.map((v, i) => {
        v.index = isUndefined(v.index) ? i : v.index;
        return v;
      }),
      id: isNull(raw) ? _val.id : raw.id
    });
    /* return new Promise<void>(async (reso, reje) => {
      try {
        const _val = super.toRaw(val);
        const raw = await this.getByPidAndDetailPageUrl(_val.pid, _val.detailPageUrl);
        await super.put({
          ..._val,
          chapterList: val.chapterList.map((v, i) => {
            v.index = isUndefined(v.index) ? i : v.index;
            return v;
          }),
          id: isNull(raw) ? _val.id : raw.id
        });
        return reso();
      } catch (e) {
        return reje(e);
      }
    }); */
  }
  removeByPidAndDetailPageUrl(pid: string, detailPageUrl: string): Promise<void> {
    return new Promise<void>(async (reso, reje) => {
      try {
        const val = await this.getByPidAndDetailPageUrl(super.toRaw(pid), super.toRaw(detailPageUrl));
        if (isNull(val)) {
          return reso();
        }
        await this.remove(val.id);
        return reso();
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `removeByPidAndDetailPageUrl pid:${pid}, detailPageUrl:${detailPageUrl}`, e);
        return reje(e);
      }
    });
  }
}