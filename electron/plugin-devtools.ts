import { BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { PluginDevtoolsEventCode } from '../events/plugin-devtools';

const isOverwriteTitleBar = process.platform === 'linux';
export const createPluginDevtoolsWindow = (url: string, icon: string) => {
  let win: BrowserWindow | null = new BrowserWindow({
    title: 'ReadCat Plugin Devtools',
    width: 1000,
    height: 700,
    minWidth: 1000,
    minHeight: 700,
    icon,
    show: false,
    frame: !isOverwriteTitleBar,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#3C3C3C',
      symbolColor: '#D4D4D4',
      height: 30
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  win.loadURL(`${url}?tag=devtools&platform=${process.platform}`);
  // win.loadURL(`http://localhost:5173?tag=devtools&platform=${process.platform}`);
  win.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return {
      action: 'deny'
    }
  });
  win.on('ready-to-show', () => {
    win?.show();
    if (process.env['VITE_DEV_SERVER_URL']) {
      win?.webContents.openDevTools();
    }
  });
  win.on('enter-full-screen', () => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_IS_FULLSCREEN_DEVTOOLS_WINDOW, true);
  });
  win.on('leave-full-screen', () => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_IS_FULLSCREEN_DEVTOOLS_WINDOW, false);
  });
  win.on('maximize', () => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_PLUGIN_DEVTOOLS_WINDOW_IS_MAXIMIZE, true);
  });
  win.on('unmaximize', () => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_PLUGIN_DEVTOOLS_WINDOW_IS_MAXIMIZE, false);
  });
  win.on('close', e => {
    e.preventDefault();
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_CLOSE_PLUGIN_DEVTOOLS_WINDOW);
    if (isOverwriteTitleBar) {
      win?.focus();
    }
  });
  win.on('closed', () => {
    win = null;
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_SET_PLUGIN_DEVTOOLS_WINDOW_MINIMIZE, () => {
    win?.minimize();
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_SET_PLUGIN_DEVTOOLS_WINDOW_MAXIMIZE_OR_RESTORE, () => {
    win?.isMaximized() ? win?.unmaximize() : win?.maximize();
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_CONSOLE_LOG, (_, err, type, args) => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_CONSOLE_LOG, err, type, args);
  });
  return win;
}