import { BaseStoreDatabase } from './base-store';
import { isNull } from '../../is';
import { useSearchStore } from '../../../store/search';
import { SearchKeyStoreEntity } from '../database';
import { useMessage } from '../../../hooks/message';

export class SearchKeyStoreDatabase extends BaseStoreDatabase<SearchKeyStoreEntity> {
  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'SearchKeyStoreDatabase');
    this.read();
  }
  private read() {
    const store = useSearchStore();
    super.getAll().then(v => {
      if (isNull(v) || v.length <= 0) {
        return;
      }
      for (const item of v) {
        store.searchkeyMap.set(item.id, item);
      }
    }).catch((e: any) => {
      GLOBAL_LOG.error(this.tag, 'read', e);
      useMessage().error(`搜索历史读取失败, Error:${e.message}`);
    });
  }
}