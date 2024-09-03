import { format } from '../../../../../core/utils/date';
import { showSaveFileDialog } from '../../../../../core/utils/file';
import { useMessage } from '../../../../../hooks/message';

export const useLog = () => {
  const message = useMessage();

  const exportLog = () => {
    showSaveFileDialog({
      suggestedName: `logs-${format(Date.now(), 'yyyy-MM-dd')}.log`
    }).then(async handle => {
      const log = await GLOBAL_LOG.getLogString();
      const writable = handle.createWritable();
      return await new Promise<void>((reso, reje) => {
        writable.on('error', err => reje(err));
        writable.on('close', () => reso());
        writable.write(log);
        writable.close();
      });
    }).catch(e => {
      if (e.name === 'CanceledError') {
        return;
      }
      message.error(e.message);
      GLOBAL_LOG.error('exportLog', e);
    });
  }

  return {
    exportLog
  }
}