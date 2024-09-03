import { basename } from 'path';
import fsp from 'fs/promises';
import { decode, readFile } from '../../worker';
import { EventCode } from '../../../events';
import { newError } from '.';
import { lookup } from 'mime-types';
import { WriteStream, createWriteStream } from 'fs';

export interface FileHandleInterface {
  name: string
  path: string
  type: string
  buffer: () => Promise<Buffer>
  text: (encoding?: string) => Promise<string>
  size: () => Promise<number>
  createWritable: () => WriteStream
}

export class FileHandle implements FileHandleInterface {
  private static readonly ENCODING = [
    'ascii', 'utf8', 'utf-8', 'utf16le',
    'utf-16le', 'ucs2', 'ucs-2', 'base64',
    'base64url', 'latin1', 'binary', 'hex'
  ];
  public name: string;
  public path: string;
  constructor(path: string) {
    this.name = basename(path);
    this.path = path;
  }
  async size() {
    return (await fsp.stat(this.path)).size;
  }
  get type() {
    return lookup(this.name) || '';
  }
  async buffer() {
    return await readFile(this.path);
  }
  async text(encoding?: string) {
    const buf = await this.buffer();
    if (!encoding || (encoding && FileHandle.ENCODING.includes(encoding.toLowerCase()))) {
      return buf.toString(<BufferEncoding | undefined>encoding);
    }
    const { value } = (await decode(buf, encoding));
    return value;
  }
  createWritable() {
    return createWriteStream(this.path);
  }
}

export const showOpenFileDialog = (options: OpenFilePickerOptions) => {
  return new Promise<FileHandleInterface[]>((reso, reje) => {
    GLOBAL_IPC.once(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, (_, res) => {
      const { error, paths } = res;
      if (!error) {
        return reso(paths.map((p: string) => new FileHandle(p)));
      }
      if (error === 'cancel') {
        const e = newError('cancel');
        e.name = 'CanceledError';
        return reje(e);
      } else {
        return reje(newError(error));
      }
    });
    GLOBAL_IPC.send(EventCode.ASYNC_SHOW_OPEN_FILE_DIALOG, options);
  });
}
export const showSaveFileDialog = (options: SaveFilePickerOptions) => {
  return new Promise<FileHandleInterface>((reso, reje) => {
    GLOBAL_IPC.once(EventCode.ASYNC_SHOW_SAVE_FILE_DIALOG, (_, res) => {
      const { error, path } = res;
      if (!error) {
        return reso(new FileHandle(path));
      }
      if (error === 'cancel') {
        const e = newError('cancel');
        e.name = 'CanceledError';
        return reje(e);
      } else {
        return reje(newError(error));
      }
    });
    GLOBAL_IPC.send(EventCode.ASYNC_SHOW_SAVE_FILE_DIALOG, options);
  });
}