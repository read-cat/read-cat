import { defineStore, storeToRefs } from 'pinia';
import { DefaultReadColor, ReadColor } from '../core/window/read-style';
import { Settings, SettingsTheme } from './defined/settings';
import { nanoid } from 'nanoid';
import { useWindowStore } from './window';
import { useToggle } from '@vueuse/core';
import { newError } from '../core/utils';

export const useSettingsStore = defineStore('Settings', {
  state: (): Settings => {
    return {
      id: nanoid(),
      options: {
        enableBlur: true,
        enableAutoTextColor: false,
        enableProxy: false,
        enableReadBacktop: true,
        enableShowTipCloseButton: false,
        enableBookmarkHighlight: true,
        enableAppStartedFindNewVersion: true,
        enableTransition: true,
        enableAutoReadAloudNextChapter: false,
      },
      readStyle: {
        color: DefaultReadColor.GREEN_QINGCAO,
        fontSize: 17.5,
        letterSpacing: 1.5,
        fontFamily: 'HarmonyOS Sans SC',
        sectionSpacing: 13,
        lineSpacing: 2,
        width: 0.8
      },
      proxy: {
        host: '127.0.0.1',
        port: 7890,
        protocol: 'http',
        username: '',
        password: ''
      },
      threadsNumber: 8,
      maxCacheChapterNumber: 10,
      pluginDevtools: {
        port: 5543
      },
      shortcutKey: {
        nextChapter: '→',
        prevChapter: '←',
        openDevTools: 'Ctrl + Shift + I',
        zoomInWindow: 'Ctrl + =',
        zoomOutWindow: 'Ctrl + -',
        zoomRestWindow: 'Ctrl + \\',
      },
      theme: 'os',
      updateSource: 'Github',
      zoomFactor: 1,
    }
  },
  getters: {
    /**阅读样式 背景颜色*/
    backgroundColor(): string {
      return this.readStyle.color.backgroundColor;
    },
    /**阅读样式 字体颜色*/
    textColor(): string {
      return this.readStyle.color.textColor;
    },
    /**阅读样式 书签颜色 */
    bookmarkColorEven(): string {
      return this.readStyle.color.bookmarkColor.even;
    },
    /**阅读样式 书签颜色 */
    bookmarkColorOdd(): string {
      return this.readStyle.color.bookmarkColor.odd;
    },
    /**阅读样式 正在朗读段落文本色 */
    readAloudColor(): string {
      return this.readStyle.color.readAloudColor;
    },
    /**阅读样式 字体大小*/
    fontSize(): string {
      return this.readStyle.fontSize + 'px';
    },
    /**阅读样式 字体间距*/
    letterSpacing(): string {
      return this.readStyle.letterSpacing + 'px';
    },
    /**阅读样式 字体样式*/
    fontFamily(): string {
      return this.readStyle.fontFamily;
    },
    /**阅读样式 段落间距*/
    sectionSpacing(): string {
      return this.readStyle.sectionSpacing + 'px';
    },
    /**阅读样式 行间距*/
    lineSpacing(): number {
      return this.readStyle.lineSpacing;
    },
    /**阅读样式 宽度*/
    width(): string {
      return (this.readStyle.width * 100) + '%';
    },
  },
  actions: {
    setBackgroundColor(color: string) {
      if (!/#[a-fA-F0-9]{6}/.test(color)) {
        throw newError('Not a hex color');
      }
      this.readStyle.color.backgroundColor = color;
    },
    setTextColor(color: string) {
      if (!/#[a-fA-F0-9]{6}/.test(color)) {
        throw newError('Not a hex color');
      }
      this.readStyle.color.textColor = color;
    },
    setDefaultReadColorById(id: string) {
      const color = DefaultReadColor.get(id);
      if (!color) {
        throw newError('Cannot set ReadColor, ID does not exist');
      }
      this.setDefaultReadColor(color);
    },
    setDefaultReadColor(color: ReadColor) {
      this.readStyle.color = color;
    },
    handlerKeyboard(altKey: boolean, ctrlKey: boolean, shiftKey: boolean, metaKey: boolean, key: string) {
      const uc = key.toUpperCase();
      if (['CONTROL', 'ALT', 'SHIFT', 'META'].includes(uc)) {
        return '';
      }
      const keys = [];
      metaKey && keys.push('Meta');
      ctrlKey && keys.push('Ctrl');
      shiftKey && keys.push('Shift');
      altKey && keys.push('Alt');
      keys.push(uc);
      if (keys.length > 3) {
        return '';
      }
      if (keys.length === 1) {
        switch (uc) {
          case 'ARROWUP':
            return '↑';
          case 'ARROWRIGHT':
            return '→';
          case 'ARROWDOWN':
            return '↓';
          case 'ARROWLEFT':
            return '←';
          default:
            return '';
        }
      }
      return keys.join(' + ');
    },
    hasShortcutKey(key: string) {
      if (!key) {
        return false;
      }
      for (const k in this.shortcutKey) {
        if ((<Record<string, string>>this.shortcutKey)[k] === key) {
          return true;
        }
      }
      return false;
    },
    setTheme(theme: SettingsTheme) {
      const { isDark } = storeToRefs(useWindowStore());
      const toggleDark = useToggle(isDark);
      document.startViewTransition(() => {
        if (theme === 'dark') {
          toggleDark(true);
        } else if (theme === 'light') {
          toggleDark(false);
        } else {
          toggleDark(matchMedia('(prefers-color-scheme: dark)').matches);
        }
        this.theme = theme;
      }).ready.then(() => {
        document.documentElement.animate(null, {
          duration: 300,
          easing: 'ease'
        });
      });
    },
  }
});