import { onMounted, onUnmounted, ref } from 'vue';
import { interval } from '../../../../../core/utils/timer';
import { Cache } from '../../../../../core/cache';
import { ElMessageBox } from 'element-plus';
import { useMessage } from '../../../../../hooks/message';
import { EventCode } from '../../../../../../events';

export const useCache = () => {
  const cacheSize = ref(0);
  const message = useMessage();
  let running = false;
  let timer = interval(() => {
    if (running) {
      return;
    }
    running = true;
    Cache.getCacheSize().then(size => {
      if (cacheSize.value === size) {
        return;
      }
      cacheSize.value = size;
    }).catch(e => {
      GLOBAL_LOG.error('get cache size', e);
    }).finally(() => {
      running = false;
    });
  }, 30000);

  onMounted(() => {
    timer.executor();
    timer.start();
  });
  onUnmounted(() => {
    timer.stop();
  });

  const clearCache = () => {
    ElMessageBox.confirm(`
      <h4>该操作将会清除所有缓存, 包括但不限于(书架、已缓存章节内容、书签、插件、设置)</h4>
      <p>清除成功后将重新启动程序</p>
      <p>是否继续清除缓存?</p>
    `, '缓存', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '清除',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      return Cache.clearCache();
    }).then(() => {
      message.success('已清除缓存, 正在重启程序');
      setTimeout(() => GLOBAL_IPC.send(EventCode.ASYNC_REBOOT_APPLICATION), 1000);
    }).catch(e => {
      if (e === 'cancel') return;
      message.error(e.message);
    });
  }

  return {
    cacheSize,
    clearCache
  }
}