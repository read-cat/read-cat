import { IpcRendererEvent, ipcRenderer } from 'electron';

export class IpcRenderer {
  private static readonly IPC = ipcRenderer;
  
  addListener(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
    return IpcRenderer.IPC.addListener(channel, listener);
  }
  invoke(channel: string, ...args: any[]) {
    return IpcRenderer.IPC.invoke(channel, ...args);
  }
  on(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
    return IpcRenderer.IPC.on(channel, listener);
  }
  off(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
    return IpcRenderer.IPC.off(channel, listener);
  }
  once(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
    return IpcRenderer.IPC.once(channel, listener);
  }
  postMessage(channel: string, message: any, transfer?: MessagePort[]) {
    return IpcRenderer.IPC.postMessage(channel, message, transfer);
  }
  removeAllListeners(channel: string) {
    return IpcRenderer.IPC.removeAllListeners(channel);
  }
  removeListener(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
    return IpcRenderer.IPC.removeListener(channel, listener);
  }
  send(channel: string, ...args: any[]) {
    IpcRenderer.IPC.send(channel, ...args);
  }
  sendSync<R = any>(channel: string, ...args: any[]): R {
    return IpcRenderer.IPC.sendSync(channel, ...args);
  }
  sendToHost(channel: string, ...args: any[]) {
    IpcRenderer.IPC.sendToHost(channel, ...args);
  }
}