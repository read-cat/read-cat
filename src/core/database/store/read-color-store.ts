import { useReadColorStore } from '../../../store/read-color';
import { ReadBackground } from '../../window/default-read-style';
import { BaseStoreDatabase } from './base-store';
import { useMessage } from '../../../hooks/message';
import { base64ToBlob, cloneByJSON } from '../../utils';
import { createHash } from 'crypto';

export class ReadColorStoreDatabase extends BaseStoreDatabase<ReadBackground> {

  constructor(db: IDBDatabase, storeName: string) {
    super(db, storeName, 'ReadColorStoreDatabase');
    this.read();
  }

  public read() {
    const message = useMessage();
    const store = useReadColorStore();
    this.getAll().then(async all => {
      if (!all || all.length <= 0) {
        return;
      }
      for (const item of cloneByJSON(all)) {
        store.customReadColor.set(item.id, item);
        const { id, backgroundImage } = item;
        if (!backgroundImage?.image) {
          continue;
        }
        const url = URL.createObjectURL(base64ToBlob(backgroundImage.image));
        const img = new Image();
        //预加载此图片，解决首次打开设置/阅读样式后闪屏的问题
        img.src = url;
        store.imageMap.set(id, {
          md5: createHash('md5').update(backgroundImage.image).digest('hex'),
          url,
          element: img
        });
      }
    }).catch(e => {
      GLOBAL_LOG.error(this.tag, 'read', e);
      message.error(`书签读取失败, Error: ${e.message}`);
    });
  }
}