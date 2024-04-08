import { FontsStoreEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class FontsStoreDatabase extends BaseStoreDatabase<FontsStoreEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, FontsStoreDatabase.name);
  }
}