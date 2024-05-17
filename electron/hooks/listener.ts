import { BrowserWindow, app } from 'electron';
import { EventCode } from '../../events';
import fs from 'fs/promises';

export const useListener = (options: {
  win: BrowserWindow,
  transparent: boolean,
  windowSizeConfigPath: string
}) => {
  const { win, transparent, windowSizeConfigPath } = options;
  win.webContents.on('did-finish-load', () => {
    win.webContents.send(EventCode.ASYNC_WINDOW_IS_TRANSPARENT, transparent);
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
    if (title === '阅读 | ReadCat') {
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