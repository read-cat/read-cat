import { BrowserWindow, app } from 'electron';
import { EventCode } from '../../events';
import fs from 'fs/promises';

export const useListener = (options: {
  win: BrowserWindow,
  pluginDevtoolsWin: BrowserWindow | null,
  transparent: boolean,
  windowSizeConfigPath: string,
  isOverwriteTitleBar: boolean
}) => {
  const { win, pluginDevtoolsWin, transparent, windowSizeConfigPath, isOverwriteTitleBar } = options;
  win.webContents.on('did-finish-load', () => {
    win.webContents.send(EventCode.ASYNC_DID_FINISH_LOAD);
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_TRANSPARENT, transparent);
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_OVERWRITE_TITLE_BAR, isOverwriteTitleBar);
  });
  win.on('close', () => {
    pluginDevtoolsWin?.destroy();
  });
  win.on('closed', () => {
    app.quit();
    process.exit(0);
  });
  win.on('enter-full-screen', () => {
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_FULLSCREEN, true);
  });
  win.on('leave-full-screen', () => {
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_FULLSCREEN, false);
  });
  win.on('maximize', () => {
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_MAXIMIZE, true);
  });
  win.on('unmaximize', () => {
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_MAXIMIZE, false);
  });
  win.on('page-title-updated', (_, title) => {
    title = title.trim();
    if (!title || title === 'index.html') {
      return;
    }
    if (title.includes('阅读 |')) {
      win.setMinimumSize(640, 520);
    } else {
      win.setMinimumSize(950, 650);
      const [width, height] = win.getSize();
      win.setSize(width < 950 ? 950 : width, height < 650 ? 650 : height, true);
    }
  });
  win.on('resized', () => {
    const [width, height] = win.getSize();
    fs.writeFile(windowSizeConfigPath, JSON.stringify({
      width,
      height
    }), { encoding: 'utf-8' });
  });
}