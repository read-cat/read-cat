import { defineStore } from 'pinia';
import { BackgroundBlur, BackgroundSize, DefaultReadColor, ReadBackground } from '../core/window/default-read-style';
import { Settings, SettingsTheme } from './defined/settings';
import { nanoid } from 'nanoid';
import { useWindowStore } from './window';
import { cloneByJSON, newError } from '../core/utils';
import { Font, FontData } from '../core/font';
import { PagePath } from '../core/window';
import { EdgeTTSEngine } from '../core/plugins/built-in/tts/edge';
import { base64ToBlob } from '../core/utils';
import { useReadColorStore } from './read-color';
import { Core } from '../core';

let oldImageUrl = '';

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
        enableScrollToggleChapter: false,
        enableTransparentWindow: false,
      },
      readStyle: {
        background: DefaultReadColor.GREEN_QINGCAO,
        fontSize: 17.5,
        fontWeight: 'normal',
        letterSpacing: 1.5,
        font: Font.default,
        sectionSpacing: 13,
        lineSpacing: 2,
        width: 0.8,
        texture: 'none'
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
        scrollUp: '↑',
        scrollDown: '↓',
        prevPage: 'PageUp',
        nextPage: 'PageDown',
        openDevTools: 'Ctrl+Shift+I',
        zoomInWindow: 'Ctrl+=',
        zoomOutWindow: 'Ctrl+-',
        zoomRestWindow: 'Ctrl+\\',
        fullScreen: 'F11',

        globalBossKey: 'Alt+Q',
        globalReadAloudPrevChapter: 'Ctrl+Shift+D',
        globalReadAloudNextChapter: 'Ctrl+Shift+F',
        globalReadAloudToggle: 'Ctrl+Shift+A',
        globalReadAloudFastRewind: 'Ctrl+Shift+Z',
        globalReadAloudFastForward: 'Ctrl+Shift+C',
      },
      theme: 'os',
      update: {
        source: 'Github',
        downloadProxy: 'https://mirror.ghproxy.com',
      },
      scrollbarStepValue: 300,
      window: {
        zoomFactor: 1,
        opacity: 0.75
      },
      txtParse: {
        maxLines: 300
      },
      readAloud: {
        maxLineWordCount: 800,
        use: EdgeTTSEngine.ID
      },
      debug: Core.isDev,
    }
  },
  getters: {
    /**阅读样式 背景颜色*/
    backgroundColor(): string {
      return this.readStyle.background.backgroundColor;
    },
    previewBackgroundImage(): string | undefined {
      const win = useWindowStore();
      if (win.isDark) {
        return void 0;
      }
      const img = useReadColorStore().imageMap.get(this.readStyle.background.id);
      if (img) {
        return `url(${img.url})`;
      }
      const image = this.readStyle.background.backgroundImage?.image;
      if (!image) {
        return void 0;
      }
      if (oldImageUrl) {
        URL.revokeObjectURL(oldImageUrl);
      }
      const url = URL.createObjectURL(base64ToBlob(image));
      oldImageUrl = url;
      return `url(${url})`;
    },
    /**阅读样式 背景图片 */
    backgroundImage(): string | undefined {
      const win = useWindowStore();
      if (win.currentPath !== PagePath.READ) {
        return void 0;
      }
      return this.previewBackgroundImage;
    },
    previewBackgroundSize(): BackgroundSize | undefined {
      const win = useWindowStore();
      if (win.isDark) {
        return void 0;
      }
      return this.readStyle.background.backgroundImage?.size;
    },
    /**阅读样式 背景大小 */
    backgroundSize(): BackgroundSize | undefined {
      const win = useWindowStore();
      if (win.currentPath !== PagePath.READ) {
        return void 0;
      }
      return this.previewBackgroundSize;
    },
    backgroundBlur(): BackgroundBlur | undefined {
      const win = useWindowStore();
      if (win.currentPath !== PagePath.READ) {
        return void 0;
      }
      if (win.isDark) {
        return void 0;
      }
      return this.readStyle.background.backgroundImage?.blur;
    },
    backgroundBlurBgColor(): string | undefined {
      const win = useWindowStore();
      if (win.currentPath !== PagePath.READ) {
        return void 0;
      }
      if (win.isDark) {
        return void 0;
      }
      if (!this.readStyle.background.backgroundImage) {
        return void 0;
      }
      if (!this.readStyle.background.backgroundImage.blur) {
        return 'transparent';
      }
      if (this.readStyle.background.backgroundImage.blur === 'dark') {
        return 'var(--rc-window-box-blur-bgcolor-1-dark)';
      }
      return 'var(--rc-window-box-blur-bgcolor-1-light)';
    },
    /**阅读样式 字体颜色*/
    textColor(): string {
      return this.readStyle.background.textColor;
    },
    /**阅读样式 书签颜色 */
    bookmarkColorEven(): string {
      return this.readStyle.background.bookmarkColor.even;
    },
    /**阅读样式 书签颜色 */
    bookmarkColorOdd(): string {
      return this.readStyle.background.bookmarkColor.odd;
    },
    /**阅读样式 正在朗读段落文本色 */
    readAloudColor(): string {
      return this.readStyle.background.readAloudColor;
    },
    /**阅读样式 字体大小*/
    fontSize(): string {
      return this.readStyle.fontSize + 'px';
    },
    fontWeight(): string {
      return this.readStyle.fontWeight;
    },
    /**阅读样式 字体间距*/
    letterSpacing(): string {
      return this.readStyle.letterSpacing + 'px';
    },
    /**阅读样式 字体样式*/
    fontFamily(): string {
      return this.readStyle.font.family;
    },
    /**阅读样式 字体名称*/
    fontName(): string {
      return this.readStyle.font.fullName;
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
    /**阅读样式 纹理 */
    texture(): string {
      return this.readStyle.texture === 'none' ? '' : this.readStyle.texture;
    },
    /**窗口不透明值 */
    windowOpacity(): string {
      return `${this.window.opacity}`;
    },
  },
  actions: {
    setBackgroundColor(color: string) {
      if (!/#[a-fA-F0-9]{6}/.test(color)) {
        throw newError('Not a hex color');
      }
      this.readStyle.background.backgroundColor = color;
    },
    setTextColor(color: string) {
      if (!/#[a-fA-F0-9]{6}/.test(color)) {
        throw newError('Not a hex color');
      }
      this.readStyle.background.textColor = color;
    },
    setDefaultReadColorById(id: string) {
      const color = DefaultReadColor.get(id);
      if (!color) {
        throw newError('Cannot set ReadColor, ID does not exist');
      }
      this.setReadColor(color);
    },
    setReadColor(color: ReadBackground) {
      if (color.id === this.readStyle.background.id) {
        return;
      }
      document.startViewTransition(() => {
        this.readStyle.background = cloneByJSON(color);
      }).ready.then(() => {
        document.documentElement.animate(null, {
          duration: 300,
          easing: 'ease'
        });
      });
    },
    setFont(font: FontData) {
      this.readStyle.font = cloneByJSON(font);
    },
    handlerKeyboard(altKey: boolean, ctrlKey: boolean, shiftKey: boolean, metaKey: boolean, key: string) {
      let uc = key.toUpperCase();
      if (['CONTROL', 'ALT', 'SHIFT', 'META'].includes(uc)) {
        return '';
      }
      const keys = [];
      metaKey && keys.push('Meta');
      ctrlKey && keys.push('Ctrl');
      shiftKey && keys.push('Shift');
      altKey && keys.push('Alt');
      switch (uc) {
        case 'ARROWUP':
          uc = '↑';
          break;
        case 'ARROWRIGHT':
          uc = '→';
          break;
        case 'ARROWDOWN':
          uc = '↓';
          break;
        case 'ARROWLEFT':
          uc = '←';
          break;
        case ' ':
          uc = 'Space';
          break;
        case 'PAGEUP':
          uc = 'PageUp';
          break;
        case 'PAGEDOWN':
          uc = 'PageDown';
          break;
        case 'PAUSE':
          uc = 'Pause';
          break;
        case 'HOME':
          uc = 'Home';
          break;
        case 'END':
          uc = 'End';
          break;
        case 'INSERT':
          uc = 'Insert';
          break;
        case 'DELETE':
          uc = 'Delete';
          break;
        case 'ESCAPE':
          uc = 'Esc';
          break;
        default:
          break;
      }
      keys.push(uc);
      if (keys.length > 3) {
        return '';
      }
      if (keys.length === 1) {
        if (
          /F\d{1,2}/.test(uc) ||
          [
            '↑', '→', '↓', '←', 'Space', 'PageUp', 'PageDown',
            'Home', 'End', 'Insert', 'Delete', 'Esc'
          ].includes(uc)
        ) {
          return uc;
        }
      }

      return keys.join('+');
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
      document.startViewTransition(() => {
        let dark = false;
        switch (theme) {
          case 'os':
            dark = matchMedia('(prefers-color-scheme: dark)').matches;
            break;
          case 'light':
            dark = false;
            break;
          case 'dark':
            dark = true;
            break;
          default:
            dark = false;
            break;
        }
        dark ?
          document.documentElement.classList.add('dark') :
          document.documentElement.classList.remove('dark');
        this.theme = theme;
        useWindowStore().isDark = dark;
      }).ready.then(() => {
        document.documentElement.animate(null, {
          duration: 300,
          easing: 'ease'
        });
      });
    },
  }
});