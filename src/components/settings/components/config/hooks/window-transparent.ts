import { Core } from '../../../../../core';
import fsp from 'fs/promises';
import path from 'path';
import { useMessage } from '../../../../../hooks/message';
import { ref } from 'vue';
import { useSettingsStore } from '../../../../../store/settings';
import { ElMessageBox } from 'element-plus';
import { EventCode } from '../../../../../../events';
import { newError } from '../../../../../core/utils';

export const useWindowTransparent = () => {
  const windowTransparentSwitchIsLoading = ref(false);
  const { options } = useSettingsStore();
  const transparentWindowHelp = `
    <ul class="rc-help">
      <li>重启程序后生效</li>
      <li>透明窗口不可调整大小，在某些平台上可能会使透明窗口停止工作。</li>
      <li>当打开开发者工具时，窗口将不透明。</li>
      <li>在Windows上</li>
      <li class="em-2">当DWM禁用时，透明窗口将失效。</li>
      <li class="em-2">透明窗口不能通过Windows系统菜单或双击标题栏实现最大化。</li>
      <li>在MacOS上</li>
      <li class="em-2">原生窗口阴影不会显示在透明窗口中。</li>
    </ul>
  `;
  const windowTransparentSwitchBeforeChange = async () => {
    try {
      if (!Core.userDataPath) {
        throw newError('userDataPath is undefined');
      }
      const filename = path.join(Core.userDataPath, 'window_transparent');
      if (!options.enableTransparentWindow) {
        await fsp.writeFile(filename, '');
      } else {
        await fsp.unlink(filename);
      }
      return true;
    } catch (e: any) {
      useMessage().error(e.message);
      return false;
    }
  }
  
  const windowTransparentSwitchChange = () => {
    windowTransparentSwitchIsLoading.value = true;
    setTimeout(() => {
      windowTransparentSwitchIsLoading.value = false;
      ElMessageBox.confirm('是否重启程序, 以使透明窗口设置项生效', '提示', {
        confirmButtonText: '重启程序',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        GLOBAL_IPC.send(EventCode.ASYNC_REBOOT_APPLICATION);
      }).catch(() => { });
    }, 5000);
  }

  return {
    windowTransparentSwitchIsLoading,
    windowTransparentSwitchBeforeChange,
    windowTransparentSwitchChange,
    transparentWindowHelp,
  }
}