import { storeToRefs } from 'pinia';
import { debounce } from '../core/utils/timer';
import { useSettingsStore } from '../store/settings';
import { useWindowStore } from '../store/window';
import { PagePath } from '../core/window';
import { EventCode } from '../../events';
import { GlobalShortcutKey } from '../store/defined/settings';
import { useScrollTopStore } from '../store/scrolltop';
import { useReadAloudStore } from '../store/read-aloud';
import { useMessage } from './message';
import { useTextContentStore } from '../store/text-content';
import { isNull } from '../core/is';

export const useShortcutKey = () => {
  const { nextChapter, prevChapter } = useTextContentStore();
  const { shortcutKey, scrollbarStepValue } = storeToRefs(useSettingsStore());
  const { handlerKeyboard, window: windowConfig, readStyle } = useSettingsStore();
  const win = useWindowStore();
  const { isSetShortcutKey, globalShortcutKeyRegisterError } = storeToRefs(win);
  const { mainElement } = storeToRefs(useScrollTopStore());
  const readAloud = useReadAloudStore();
  const message = useMessage();

  const handler = debounce((key: string) => {
    switch (key) {
      case '':
        break;
      case shortcutKey.value.nextChapter:
        win.currentPath === PagePath.READ && nextChapter();
        break;
      case shortcutKey.value.prevChapter:
        win.currentPath === PagePath.READ && prevChapter();
        break;
      case shortcutKey.value.openDevTools:
        GLOBAL_IPC.send(EventCode.ASYNC_OPEN_DEVTOOLS);
        break;
      case shortcutKey.value.zoomInWindow:
        if (windowConfig.zoomFactor >= 2.9) break;
        windowConfig.zoomFactor = Number((windowConfig.zoomFactor + 0.1).toFixed(2));
        document.body.style.setProperty('--zoom-factor', `${windowConfig.zoomFactor}`);
        GLOBAL_IPC.send(EventCode.ASYNC_ZOOM_WINDOW, windowConfig.zoomFactor);
        break;
      case shortcutKey.value.zoomOutWindow:
        if (windowConfig.zoomFactor <= 0.1) break;
        windowConfig.zoomFactor = Number((windowConfig.zoomFactor - 0.1).toFixed(2));
        document.body.style.setProperty('--zoom-factor', `${windowConfig.zoomFactor}`);
        GLOBAL_IPC.send(EventCode.ASYNC_ZOOM_WINDOW, windowConfig.zoomFactor);
        break;
      case shortcutKey.value.zoomRestWindow:
        windowConfig.zoomFactor = 1;
        document.body.style.setProperty('--zoom-factor', `${windowConfig.zoomFactor}`);
        GLOBAL_IPC.send(EventCode.ASYNC_ZOOM_WINDOW, windowConfig.zoomFactor);
        break;
      case shortcutKey.value.fullScreen:
        !win.transparentWindow && GLOBAL_IPC.send(EventCode.ASYNC_WINDOW_SET_FULLSCREEN, !win.isFullScreen);
        break;
      case shortcutKey.value.prevPage:
        win.currentPath === PagePath.READ && (mainElement.value.scrollTop -= mainElement.value.clientHeight - readStyle.fontSize);
        break;
      case shortcutKey.value.nextPage:
        win.currentPath === PagePath.READ && (mainElement.value.scrollTop += mainElement.value.clientHeight - readStyle.fontSize);
        break;
      default:
        break;
    }
  }, 200);

  let scrollEnd = true;
  const handlerScrollTop = (key: string) => {
    const { scrollTop, scrollHeight, clientHeight } = mainElement.value;
    if (scrollTop <= 0 || scrollTop >= (scrollHeight - clientHeight)) {
      scrollEnd = true;
    }
    if (!scrollEnd) {
      return;
    }
    scrollEnd = false;
    switch (key) {
      case shortcutKey.value.scrollUp:
        mainElement.value.scrollTop -= scrollbarStepValue.value;
        break;
      case shortcutKey.value.scrollDown:
        mainElement.value.scrollTop += scrollbarStepValue.value;
        break;
      default:
        break;
    }
  }
  mainElement.value.addEventListener('scrollend', () => {
    scrollEnd = true;
  });

  const onKeydown = (e: KeyboardEvent) => {
    if (isSetShortcutKey.value) {
      return;
    }
    const { target, altKey, ctrlKey, shiftKey, metaKey, key } = e;
    const skey = handlerKeyboard(altKey, ctrlKey, shiftKey, metaKey, key);
    const tag = (<HTMLElement>target).tagName.toLowerCase();
    const allow = [
      process.platform === 'darwin' ? 'Meta+C' : 'Ctrl+C',
    ];
    if (
      !['textarea', 'input'].includes(tag) &&
      !allow.includes(skey)
    ) {
      e.preventDefault();
    }
    if ([
      shortcutKey.value.scrollUp,
      shortcutKey.value.scrollDown,
    ].includes(skey)) {
      handlerScrollTop(skey);
    } else {
      handler(skey);
    }
  }

  window.addEventListener('keydown', onKeydown);

  const initGlobalShortcutKey = () => {
    const globals = Object.keys(shortcutKey.value)
      .filter(k => k.startsWith('global'))
      .map(k => {
        const skey = (<any>shortcutKey.value)[k].trim();
        if (skey) {
          return [k, skey];
        }
        return null;
      })
      .filter(k => !isNull(k));

    GLOBAL_LOG.debug('init global shortcut key,', globals);
    GLOBAL_IPC.send(EventCode.ASYNC_INIT_GLOBAL_SHORTCUT_KEY, globals);
  }
  GLOBAL_IPC.once(EventCode.ASYNC_INIT_GLOBAL_SHORTCUT_KEY, (_, res: [keyof GlobalShortcutKey, string, boolean][]) => {
    for (const [key, __, flag] of res) {
      if (flag) {
        continue;
      }
      globalShortcutKeyRegisterError.value.set(key, '快捷键注册失败');
    }
  });

  initGlobalShortcutKey();

  const handlerGlobalShortcutKey = async (key: keyof GlobalShortcutKey) => {
    switch (key) {
      case 'globalBossKey':
        //窗口显示、隐藏不在渲染进程实现
        break;
      case 'globalReadAloudPrevChapter':
        if (win.currentPath !== PagePath.READ) return;
        await prevChapter(true);
        readAloud.stop();
        readAloud.play(0).catch(e => message.error(e.message));;
        break;
      case 'globalReadAloudNextChapter':
        if (win.currentPath !== PagePath.READ) return;
        await nextChapter(true);
        readAloud.stop();
        readAloud.play(0).catch(e => message.error(e.message));;
        break;
      case 'globalReadAloudToggle':
        if (win.currentPath !== PagePath.READ) return;
        if (readAloud.playerStatus === 'play') readAloud.pause();
        else if (readAloud.playerStatus === 'pause') readAloud.play().catch(e => message.error(e.message));
        break;
      case 'globalReadAloudFastForward':
        if (win.currentPath !== PagePath.READ) return;
        readAloud.fastForward();
        break;
      case 'globalReadAloudFastRewind':
        if (win.currentPath !== PagePath.READ) return;
        readAloud.fastRewind();
        break;
      default:
        break;
    }
  }

  GLOBAL_IPC.on(EventCode.ASYNC_TRIGGER_GLOBAL_SHORTCUT_KEY, (_, key: keyof GlobalShortcutKey) => {
    handlerGlobalShortcutKey(key);
  });
}