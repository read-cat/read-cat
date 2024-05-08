import { format } from '../../../../../core/utils/date';
import { useMessage } from '../../../../../hooks/message';

export const useLog = () => {
  const message = useMessage();

  const exportLog = () => {
    showSaveFilePicker({
      suggestedName: `logs-${format(Date.now(), 'yyyy-MM-dd')}.log`
    }).catch(e => {
      message.warning(e.message);
      return Promise.resolve(null);
    }).then(async (handle) => {
      if (!handle) {
        return;
      }
      const writable = await handle.createWritable();
      const log = await GLOBAL_LOG.getLogString();
      await writable.truncate(0);
      await writable.write(log);
      await writable.close();
    }).catch(e => {
      message.error(e.message);
      GLOBAL_LOG.error('exportLog', e);
    });
  }

  return {
    exportLog
  }
}