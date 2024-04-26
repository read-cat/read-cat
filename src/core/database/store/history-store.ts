import { HistoryStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class HistoryStoreDatabase extends BaseStoreDatabase<HistoryStoreEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'HistoryStoreDatabase');
    
  }
}