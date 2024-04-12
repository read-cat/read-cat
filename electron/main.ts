import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { EventCode } from '../events';
import { createPluginDevtoolsWindow } from './plugin-devtools';
import { PluginDevtoolsEventCode } from '../events/plugin-devtools';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

let win: BrowserWindow | null;
let pluginDevtoolsWin: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const icon = path.join(process.env.VITE_PUBLIC, 'favicon.ico');
function createWindow() {
  win = new BrowserWindow({
    title: 'ReadCat',
    width: 950,
    height: 650,
    minWidth: 950,
    minHeight: 650,
    frame: false,
    show: false,
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  win.on('ready-to-show', () => {
    win?.show();
    if (VITE_DEV_SERVER_URL) {
      // win?.webContents.openDevTools();
    }
  });
  win.on('closed', () => {
    app.quit();
    win = null;
  });
  win.on('enter-full-screen', () => {
    win?.webContents.send(EventCode.ASYNC_WINDOW_IS_FULLSCREEN, true);
  });
  win.on('leave-full-screen', () => {
    win?.webContents.send(EventCode.ASYNC_WINDOW_IS_FULLSCREEN, false);
  });
  win.on('maximize', () => {
    win?.webContents.send(EventCode.ASYNC_WINDOW_IS_MAXIMIZE, true);
  });
  win.on('unmaximize', () => {
    win?.webContents.send(EventCode.ASYNC_WINDOW_IS_MAXIMIZE, false);
  });
  ipcMain.on(EventCode.ASYNC_CLOSE_WINDOW, () => {
    app.quit();
    win = null;
    process.exit(0);
  });
  ipcMain.on(EventCode.ASYNC_SET_WINDOW_MINIMIZE, () => {
    win?.minimize();
  });
  ipcMain.on(EventCode.ASYNC_SET_WINDOW_MAXIMIZE_OR_RESTORE, () => {
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on(EventCode.SYNC_IS_DEV, e => {
    e.returnValue = VITE_DEV_SERVER_URL ? true : false;
  });
  ipcMain.on(EventCode.SYNC_GET_USER_DATA_PATH, e => {
    e.returnValue = app.getPath('userData');
  });
  ipcMain.on(EventCode.ASYNC_WINDOW_SET_FULLSCREEN, (_, is) => {
    win?.setFullScreen(is);
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_CREATE_PLUGIN_DEVTOOLS_WINDOW, (_, url) => {
    pluginDevtoolsWin = createPluginDevtoolsWindow(url, icon);
    pluginDevtoolsWin.on('closed', () => {
      win?.webContents.send(EventCode.ASYNC_PLUGIN_WINDOW_CLOSED);
    });
  });
  ipcMain.on(PluginDevtoolsEventCode.ASYNC_CLOSE_PLUGIN_DEVTOOLS_WINDOW, () => {
    pluginDevtoolsWin?.destroy();
    pluginDevtoolsWin = null;
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
});
