import { BrowserWindow, FileFilter, ipcMain, dialog } from 'electron';
import { EventCode } from '../../events';

export const useDialog = () => {

  const handlerTypes = (types: FileType[]) => {
    const filters: FileFilter[] = [];
    for (const type of types) {
      const exts = [];
      for (const key of Object.keys(type.accept)) {
        exts.push(...type.accept[key].map(ext => ext.startsWith('.') ? ext.slice(1) : ext));
      }
      filters.push({
        name: type.description,
        extensions: Array.from(new Set(exts))
      });
    }
    return filters;
  }

  ipcMain.on(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, (e, options: OpenFilePickerOptions) => {
    const win = BrowserWindow.fromId(e.frameId);
    if (!win) {
      return e.sender.send(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, { error: `BrowserWindow is null, frameId:${e.frameId}` });
    }
    const { multiple, excludeAcceptAllOption, types } = options;
    const properties: any[] = ['openFile'];
    multiple && (properties.push('multiSelections'));
    const filters: FileFilter[] = types ? handlerTypes(types) : [];
    if (!excludeAcceptAllOption || filters.length < 1) {
      filters.push({
        name: '全部文件',
        extensions: ['*']
      });
    }
    dialog.showOpenDialog(win, { properties, filters }).then(res => {
      if (res.canceled) {
        return e.sender.send(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, { error: 'cancel' });
      }
      e.sender.send(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, { paths: res.filePaths });
    }).catch(err => {
      e.sender.send(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, { error: err.message });
    });
  });

  ipcMain.on(EventCode.ASYNC_SHOW_SAVE_FILE_DIALOG, (e, options: SaveFilePickerOptions) => {
    const win = BrowserWindow.fromId(e.frameId);
    if (!win) {
      return e.sender.send(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, { error: `BrowserWindow is null, frameId:${e.frameId}` });
    }
    const { suggestedName, excludeAcceptAllOption, types } = options;
    const filters: FileFilter[] = types ? handlerTypes(types) : [];
    if (!excludeAcceptAllOption || filters.length < 1) {
      filters.push({
        name: '全部文件',
        extensions: ['*']
      });
    }
    dialog.showSaveDialog(win, {
      properties: ['showOverwriteConfirmation'],
      filters,
      defaultPath: suggestedName
    }).then(res => {
      if (res.canceled) {
        return e.sender.send(EventCode.ASYNC_SHOW_SAVE_FILE_DIALOG, { error: 'cancel' });
      }
      e.sender.send(EventCode.ASYNC_SHOW_SAVE_FILE_DIALOG, { path: res.filePath });
    }).catch(err => {
      e.sender.send(EventCode.ASYNC_SHOW_SAVE_FILE_DIALOG, { error: err.message });
    });
  });
}