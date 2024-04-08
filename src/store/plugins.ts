import { defineStore } from 'pinia';


export const usePluginsStore = defineStore('Plugins', {
  state: () => {
    return {
      /**插件加载状态, 若对象中存在error则这个插件加载失败, error是字符串类型错误原因 */
      loadStats: [] as {
        id: string,
        error?: string
      }[],
    }
  },
  getters: {
  },
  actions: {

  }
});