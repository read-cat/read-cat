import { BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { PluginDevtoolsEventCode } from '../events/plugin-devtools';
export const createPluginDevtoolsWindow = (url: string, icon: string) => {
  let win: BrowserWindow | null = new BrowserWindow({
    title: 'ReadCat Plugin Devtools',
    width: 1000,
    height: 700,
    minWidth: 1000,
    minHeight: 700,
    icon,
    closable: false,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      /* nodeIntegration: true,
      contextIsolation: false */
    }
  });
  win.loadURL(`${url}?tag=devtools`);
  // win.loadURL(`http://localhost:5173?tag=devtools`);
  win.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return {
      action: 'deny'
    }
  });
  win.on('ready-to-show', () => win?.show());
  win.on('maximize', () => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_PLUGIN_DEVTOOLS_WINDOW_IS_MAXIMIZE, true);
  });
  win.on('unmaximize', () => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_PLUGIN_DEVTOOLS_WINDOW_IS_MAXIMIZE, false);
  });
  win.on('closed', () => {
    win = null;
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_SET_PLUGIN_DEVTOOLS_WINDOW_MINIMIZE, () => {
    win?.minimize();
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_SET_PLUGIN_DEVTOOLS_WINDOW_MAXIMIZE_OR_RESTORE, () => {
    win?.isMaximized() ? win?.restore() : win?.maximize();
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_CONSOLE_LOG, (_, err, type, args) => {
    win?.webContents.send(PluginDevtoolsEventCode.ASYNC_CONSOLE_LOG, err, type, args);
  });
  return win;
}