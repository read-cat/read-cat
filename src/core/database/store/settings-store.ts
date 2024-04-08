import { useSettingsStore } from '../../../store/settings';
import { SettingsEntity } from '../database';
import { BaseStoreDatabase } from './base-store';
import { debounce } from '../../utils/timer';
import { useMessage } from '../../../hooks/message';
import { Settings } from '../../../store/defined/settings';
import { isNull, isUndefined } from '../../is';

export class SettingsStoreDatabase extends BaseStoreDatabase<SettingsEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, SettingsStoreDatabase.name);
    this.read().finally(() => {
      this.watch();
    });
  }

  private async read() {
    const all = await super.getAll();
    if (isNull(all) || all.length <= 0) {
      return;
    }
    const use = all.find(v => v.use);
    if (isUndefined(use)) {
      return;
    }
    
    const settings = useSettingsStore();
    settings.$patch({
      ...use.settings,
    });
    settings.setTheme(use.settings.theme);
  }
  private watch() {
    const message = useMessage();
    const debo = debounce((state: Settings) => {
      super.put({
        use: true,
        id: state.id,
        settings: state
      }).catch(e => {
        GLOBAL_LOG.error(this.tag, 'watch', e);
        message.error(`设置保存失败, ${e.message}`);
      });
    }, 5 * 1000);
    useSettingsStore().$subscribe((_, state) => {
      debo(super.toRaw(state));
    }, {
      deep: true
    });
  }
}