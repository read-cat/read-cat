import { Core } from '../../../../../core';
import { isNull } from '../../../../../core/is';
import { decompress } from '../../../../../core/plugin-devtools/rpdt';
import { useMessage } from '../../../../../hooks/message';
import { join } from 'path';
import fs from 'fs/promises';
import { useSettingsStore } from '../../../../../store/settings';
import { isUndefined } from 'element-plus/es/utils/types.mjs';
import { PluginDevtools } from '../../../../../core/plugin-devtools';
import { newError } from '../../../../../core/utils';
import { showOpenFileDialog } from '../../../../../core/utils/file';

export const usePluginDevtools = () => {
  const message = useMessage();
  const { pluginDevtools } = useSettingsStore();
  const openPluginDevtoolsKit = () => {
    showOpenFileDialog({
      excludeAcceptAllOption: true,
      types: [{
        description: '插件开发工具包',
        accept: {
          'application/gzip': ['.rpdt']
        }
      }]
    }).then(async ([file]) => {
      if (!Core.userDataPath) {
        return Promise.reject(newError('userDataPath is undefined'));
      }
      const buf = await file.buffer();
      const path = join(Core.userDataPath, 'plugin-devtools');
      return {
        dir: path,
        target: await decompress(buf, path)
      };
    }).catch(e => {
      if (e.name !== 'CanceledError') {
        message.error(e.message);
      }
      return Promise.resolve(void 0);
    }).then(async path => {
      if (isUndefined(path)) {
        return;
      }
      pluginDevtools.resourcePath = path.target;
      message.success('已导入插件开发工具包');
      //清理旧工具包
      const files = await fs.readdir(path.dir);
      for (const file of files) {
        const p = join(path.dir, file);
        if (p === path.target) {
          continue;
        }
        await fs.rm(p, {
          recursive: true,
          force: true
        });
      }
    }).catch(e => {
      GLOBAL_LOG.error('Plugin Devtools clear', e);
    });
  }

  let instance: PluginDevtools | null = null;

  const start = async () => {
    if (isUndefined(pluginDevtools.resourcePath)) {
      message.error('未导入插件开发工具包');
      return;
    }
    isNull(instance) && (instance = new PluginDevtools());
    try {
      await instance.startServer(pluginDevtools.resourcePath, pluginDevtools.port);
      GLOBAL_LOG.info('PluginDevtools start server');
      instance.open();
      instance.onclose = () => {
        instance = null;
      }
    } catch (e: any) {
      message.error(e.message);
      GLOBAL_LOG.error('PluginDevtools start server', e);
    }
  }




  return {
    openPluginDevtoolsKit,
    start
  }
}