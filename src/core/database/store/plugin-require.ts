import { useMessage } from '../../../hooks/message';
import { usePluginsStore } from '../../../store/plugins';
import { PluginRequireEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class PluginsRequireDatabase extends BaseStoreDatabase<PluginRequireEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'PluginsRequireDatabase');
    this.read();
  }

  private read() {
    super.getAll().then(all => {
      if (!all || all.length < 1) {
        return;
      }
      const { requireMap }  = usePluginsStore();
      for (const item of all) {
        requireMap.set(item.id, item.require);
      }
    }).catch(e => {
      useMessage().error(`插件require数据读取失败, ${e.message}`);
    })
  }
}