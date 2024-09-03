import { useMessage } from '../../../hooks/message';
import { useTxtParseRuleStore } from '../../../store/txt-parse-rules';
import { isNull } from '../../is';
import { TxtParseRuleEntity } from '../database';
import { BaseStoreDatabase } from './base-store';

export class TxtParseRuleStoreDatabase extends BaseStoreDatabase<TxtParseRuleEntity> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'TxtParseRuleStoreDatabase');
    this.read();
  }
  private read() {
    const message = useMessage();
    const store = useTxtParseRuleStore();
    super.getAll().then(res => {
      if (isNull(res) || res.length <= 0) {
        return;
      }
      store._rules = res;
    }).catch((e: any) => {
      GLOBAL_LOG.error(this.tag, 'read', e);
      message.error(`TXT解析规则读取失败, Error: ${e.message}`);
    });
  }
}