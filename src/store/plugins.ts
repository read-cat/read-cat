import { defineStore } from 'pinia';
import { useMessage } from '../hooks/message';
import { errorHandler } from '../core/utils';
import { RequireItem } from '../core/plugins/defined/plugins';
import { isNewerVersionPlugin } from '../core/is';

export const usePluginsStore = defineStore('Plugins', {
  state: () => {
    return {
      /**插件加载状态, 若对象中存在error则这个插件加载失败, error是字符串类型错误原因 */
      loadStats: [] as {
        id: string,
        error?: string
      }[],
      requireMap: new Map<string, Record<string, string>>(),
    }
  },
  getters: {
  },
  actions: {
    async setRequire(pid: string, val: Record<string, string>) {
      const plugin = GLOBAL_PLUGINS.getPluginClassById(pid);
      if (!plugin || !plugin.REQUIRE) {
        return;
      }
      const obj: Record<string, string> = {};
      for (const key of Object.keys(val)) {
        if (!Object.hasOwn(plugin.REQUIRE, key)) {
          continue;
        }
        obj[key] = val[key];
        // Reflect.set(plugin.REQUIRE, key, val[key]);
        // 如果是新版插件
        if (isNewerVersionPlugin(plugin.REQUIRE[key])) {
          // 获取配置项内容
          let item = Reflect.get(plugin.REQUIRE, key);
          // 修改配置值
          (item as RequireItem).value = val[key];
          // 更新配置项
          Reflect.set(plugin.REQUIRE, key, item);
        }
        // 兼容旧版插件
        else {
          Reflect.set(plugin.REQUIRE, key, val[key]);
        }
      }
      await GLOBAL_DB.store.pluginRequireStore.put({
        id: pid,
        require: obj,
      });
      this.requireMap.set(pid, obj);
    },
    getRequire(pid: string) {
      return this.requireMap.get(pid);
    },
    async removeRequire(pid: string) {
      try {
        await GLOBAL_DB.store.pluginRequireStore.remove(pid);
        this.requireMap.delete(pid);
      } catch (e: any) {
        useMessage().error(e.message);
        return errorHandler(e);
      }
    }
  }
});