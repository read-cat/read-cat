import { Chapter } from '../../book/book';
import { isNull, isUndefined } from '../../is';
import { TextContentStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class TextContentStoreDatabase extends BaseStoreDatabase<TextContentStoreEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, TextContentStoreDatabase.name);
  }
  getByPidAndDetailUrl(pid: string, detailUrl: string): Promise<TextContentStoreEntity[] | null> {
    return new Promise<TextContentStoreEntity[] | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_pid_detailUrl')
          .getAll(IDBKeyRange.only([pid, detailUrl]));
        requ.onsuccess = () => {
          let result: TextContentStoreEntity[] | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByPidAndDetailUrl pid:${pid}, detailUrl:${detailUrl}`, e);
        return reje(e);
      }

    });
  }
  getByPidAndChapterUrl(pid: string, chapterUrl: string): Promise<TextContentStoreEntity | null> {
    return new Promise<TextContentStoreEntity | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_pid_chapterUrl')
          .get(IDBKeyRange.only([super.toRaw(pid), super.toRaw(chapterUrl)]));
        requ.onsuccess = () => {
          let result: TextContentStoreEntity | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByPidAndChapterUrl pid:${pid}, chapterUrl:${chapterUrl}`, e);
        return reje(e);
      }

    });
  }
  getByPidAndChapterIndex(pid: string, chapterIndex: number): Promise<TextContentStoreEntity | null> {
    return new Promise<TextContentStoreEntity | null>((reso, reje) => {
      try {
        const requ = this.db
          .transaction([this.storeName], 'readonly')
          .objectStore(this.storeName)
          .index('index_pid_chapterIndex')
          .get(IDBKeyRange.only([super.toRaw(pid), super.toRaw(chapterIndex)]));
        requ.onsuccess = () => {
          let result: TextContentStoreEntity | null = null;
          if (!isUndefined(requ.result)) {
            result = requ.result;
          }
          return reso(result);
        }
        requ.onerror = () => {
          throw requ.error;
        }
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `getByPidAndChapterIndex pid:${pid}, chapterIndex:${chapterIndex}`, e);
        return reje(e);
      }

    });
  }
  async put(val: TextContentStoreEntity): Promise<void> {
    const _val = super.toRaw(val);
    const raw = await this.getByPidAndChapterUrl(_val.pid, _val.chapter.url);
    if (!isNull(raw)) {
      _val.id = raw.id;
    }
    await super.put({
      ..._val,
      id: isNull(raw) ? _val.id : raw.id
    });
    /* return new Promise<void>(async (reso, reje) => {
      try {
        const _val = super.toRaw(val);
        const raw = await this.getByPidAndChapterUrl(_val.pid, _val.chapter.url);
        if (!isNull(raw)) {
          _val.id = raw.id;
        }
        await super.put({
          ..._val,
          id: isNull(raw) ? _val.id : raw.id
        });
        return reso();
      } catch (e) {
        return reje(e);
      }
    }); */
  }
  async removeByPidAndChapter(pid: string, chapter: Chapter): Promise<void> {
    const val = await this.getByPidAndChapterUrl(super.toRaw(pid), super.toRaw(chapter).url);
    if (isNull(val)) {
      return;
    }
    await this.remove(val.id);
    /* return new Promise<void>(async (reso, reje) => {
      try {
        const val = await this.getByPidAndChapterUrl(super.toRaw(pid), super.toRaw(chapter).url);
        if (isNull(val)) {
          return reso();
        }
        await this.remove(val.id);
        return reso();
      } catch (e) {
        GLOBAL_LOG.error(this.tag, `removeByPidAndChapter pid:${pid}, chapter:${chapter}`, e);
        return reje(e);
      }
    }); */
  }
  async removeByPidAndDetailUrl(pid: string, detailUrl: string): Promise<void> {
    const entitys = await this.getByPidAndDetailUrl(pid, detailUrl);
    if (isNull(entitys) || entitys.length <= 0) {
      return;
    }
    const ps: Promise<void>[] = [];
    entitys.forEach(e => {
      ps.push(super.remove(e.id));
    });
    (await Promise.allSettled(ps)).forEach(r => {
      if (r.status === 'rejected') {
        GLOBAL_LOG.error(this.tag, 'removeByPidAndDetailUrl', r.reason);
      }
    });
  }

}