import { defineStore, storeToRefs } from 'pinia';
import { useDark } from '@vueuse/core';
import { PagePath } from '../core/window';
import { useSettingsStore } from './settings';

export const useWindowStore = defineStore('Window', {
  state: () => {
    return {
      currentPath: PagePath.HOME,
      backgroundColor: '',
      textColor: '',
      isMaximize: false,
      isDark: useDark({
        onChanged: (_, defaultHandler, mode) => {
          const { theme } = storeToRefs(useSettingsStore());
          const { isDark } = storeToRefs(useWindowStore());
          if (theme.value === 'os') {
            const light = matchMedia('(prefers-color-scheme: light)').matches;
            if (light) {
              isDark && (isDark.value = false);
              return defaultHandler('light');
            }
            isDark && (isDark.value = true);
            return defaultHandler('dark');
          } else if (theme.value === 'light') {
            isDark && (isDark.value = false);
            return defaultHandler('light');
          } else if (theme.value === 'dark') {
            isDark && (isDark.value = true);
            return defaultHandler('dark');
          }
          isDark && (isDark.value = _);
          defaultHandler(mode);
        },
      }),
      readProgress: '0%',
      isFullScreen: false,
      searchBoxHeaderText: '搜索',
      disableShowSearchBox: new Map<PagePath, boolean>(),
      refreshEventMap: new Map<PagePath, () => void>(),
      inited: false,
      isSetShortcutKey: false,
    }
  },
  getters: {

  },
  actions: {
    calcReadProgress(e?: HTMLElement | null) {
      !e && (e = (document.querySelector('#main') as HTMLElement));
      if (!e) {
        return;
      }
      let p = '0%';
      if (e.clientHeight === e.scrollHeight) {
        p = '100%';
      } else if (e.scrollTop === 0) {
        p = '0%';
      } else {
        p = ((e.scrollTop + e.offsetHeight) / e.scrollHeight * 100).toFixed(2) + '%';
      }
      this.readProgress = p;
    },
    onRefresh(page: PagePath, call: () => void) {
      this.refreshEventMap.set(page, call);
    },
  }
});