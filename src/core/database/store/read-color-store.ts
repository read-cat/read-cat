import { useReadColorStore } from '../../../store/read-color';
import { ReadColor } from '../../window/default-read-style';
import { BaseStoreDatabase } from './base-store';
import { useMessage } from '../../../hooks/message';

export class ReadColorStoreDatabase extends BaseStoreDatabase<ReadColor> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'ReadColorStoreDatabase');
    this.read();
  }

  public read() {
    const message = useMessage();
    const store = useReadColorStore();
    this.getAll().then(all => {
      if (!all || all.length <= 0) {
        return;
      }
      store.customReadColor = all;
    }).catch(e => {
      GLOBAL_LOG.error(this.tag, 'read', e);
      message.error(`书签读取失败, Error: ${e.message}`);
    });
  }
}