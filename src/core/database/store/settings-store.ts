import { useSettingsStore } from '../../../store/settings';
import { SettingsEntity } from '../database';
import { BaseStoreDatabase } from './base-store';
import { debounce } from '../../utils/timer';
import { useMessage } from '../../../hooks/message';
import { Settings } from '../../../store/defined/settings';
import { isNull, isUndefined } from '../../is';
import fsp from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Core } from '../..';

export class SettingsStoreDatabase extends BaseStoreDatabase<SettingsEntity> {
  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'SettingsStoreDatabase');
  }

  public async read() {
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

    const filename = path.join(Core.userDataPath, 'window_transparent');
    if (use.settings.options.enableTransparentWindow) {
      !existsSync(filename) && fsp.writeFile(filename, '');
    } else {
      existsSync(filename) && fsp.unlink(filename);
    }
  }
  public watch() {
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
      debo(super.revocationProxy(state));
    }, {
      deep: true
    });
  }
}