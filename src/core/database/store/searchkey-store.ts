import { BaseStoreDatabase } from './base-store';
import { isNull } from '../../is';
import { useSearchStore } from '../../../store/search';
import { SearchKeyStoreEntity } from '../database';
import { useMessage } from '../../../hooks/message';

export class SearchKeyStoreDatabase extends BaseStoreDatabase<SearchKeyStoreEntity> {
  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, SearchKeyStoreDatabase.name);
    this.read();
  }
  private read() {
    const store = useSearchStore();
    super.getAll().then(v => {
      if (isNull(v) || v.length <= 0) {
        return;
      }
      for (const { id, searchkey, timestamp } of v) {
        store.searchkey.push({
          id,
          searchkey,
          timestamp
        });
      }
      store.searchkey = store.searchkey.sort((a, b) => {
        return b.timestamp - a.timestamp;
      });
    }).catch((e: any) => {
      GLOBAL_LOG.error(this.tag, 'read', e);
      useMessage().error(`搜索历史读取失败, Error:${e.message}`);
    });
  }
}