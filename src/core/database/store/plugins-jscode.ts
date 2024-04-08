import { PluginsJSCodeEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class PluginsJSCodeDatabase extends BaseStoreDatabase<PluginsJSCodeEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, PluginsJSCodeDatabase.name);
  }
}