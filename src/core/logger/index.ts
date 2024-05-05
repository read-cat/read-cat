import {
  existsSync,
  statSync,
  mkdirSync,
  openSync,
  writeSync,
  readFileSync,
} from 'node:fs';
import { readdir, unlink } from 'fs/promises';
import {
  getType,
  isArray,
  isDate,
  isError,
  isFunction,
  isNull,
  isNumber,
  isObject,
  isString,
  isUint8Array,
  isUndefined,
} from '../is';
import { join, basename } from 'node:path';
import { errorHandler, newError } from '../utils';
import { format } from '../utils/date';

interface Property {
  savePath?: string,
  maxBytesLength?: number,
  enableWriteToFile?: boolean,
  debug?: boolean
}
export type LogType = 'info' | 'error' | 'warn' | 'debug' | 'verbose';
interface LogHead {
  type: LogType,
  raw: string,
  val: string,
}

export class Logger {
  public static getHead(type: LogType): LogHead {
    const date = format(Date.now(), 'yyyy-MM-dd HH:mm:ss.S');
    let raw = '';
    let val = '';
    switch (type) {
      case 'error':
        raw = `[${date}] [ERROR]`;
        val = `\x1b[2m[${date}]\x1b[;0m \x1b[31m[ERROR]\x1b[;0m`;
        break;
      case 'warn':
        raw = `[${date}] [WARN]`;
        val = `\x1b[2m[${date}]\x1b[;0m \x1b[33m[WARN]\x1b[;0m`;
        break;
      case 'debug':
        raw = `[${date}] [DEBUG]`;
        val = `\x1b[2m[${date}]\x1b[;0m \x1b[35m[DEBUG]\x1b[;0m`;
        break;
      case 'verbose':
        raw = `[${date}] [VERBOSE]`;
        val = `\x1b[2m[${date}]\x1b[;0m \x1b[36m[VERBOSE]\x1b[;0m`;
        break;
      case 'info':
      default:
        type = 'info';
        raw = `[${date}] [INFO]`;
        val = `\x1b[2m[${date}]\x1b[;0m \x1b[32m[INFO]\x1b[;0m`;
        break;
    }
    return {
      type,
      raw,
      val
    }
  }

  private readonly savePath: string = join(process.cwd(), 'logs');
  private filepath: string | null = null;
  private maxBytesLength = 5 * 1024 * 1024;
  private static readonly THRESHOLD: number = 100 * 1024;
  private fd: number | null = null;
  private currentLength = 0;
  private readonly writeToFile: boolean;
  private _debug: boolean;
  private static readonly LOG_EXPIRES = 7 * 24 * 60 * 60 * 1000;

  constructor(prop?: Property) {
    this.writeToFile = !!prop?.enableWriteToFile;
    this._debug = !!prop?.debug;
    try {
      const savePath = prop?.savePath;
      if (!isUndefined(savePath)) {
        this.savePath = savePath;
      }
      const maxBytesLength = prop?.maxBytesLength;
      if (!isUndefined(maxBytesLength)) {
        this.maxBytesLength = maxBytesLength;
      }
      if (this.writeToFile) {
        if (!existsSync(this.savePath)) {
          mkdirSync(this.savePath);
        }
        const fd = this.open();
        if (isNumber(fd)) {
          this.fd = fd;
        } else {
          throw fd;
        }
      }
      readdir(this.savePath).then(files => {
        files.forEach(file => {
          const reg = /(\d+\-\d+\-\d+)(\-\((\d+)\))?\.log$/.exec(file);
          if (!reg) {
            return;
          }
          const time = (new Date(reg[1])).getTime();
          if (Date.now() - time >= Logger.LOG_EXPIRES) {
            unlink(join(this.savePath, file));
          }
        });
      }).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  }

  public setDebug(debug: boolean) {
    this._debug = debug;
    return this;
  }

  public async getLogString(last = false) {
    try {
      const files = (await readdir(this.savePath))
        .map(file => join(this.savePath, file))
        .filter(file => {
          if (!statSync(file).isFile()) {
            return false;
          }
          return last ? file.includes(format(Date.now(), 'yyyy-MM-dd')) : true;
        })
      if (files.length < 1) {
        throw newError('Log files not found');
      }
      let str = '';
      for (const file of files) {
        const base = basename(file);
        str += `${base}--------------------\r\n\r\n`;
        str += readFileSync(file, { encoding: 'utf8' }) + '\r\n\r\n';
        str += `${Array(base.length).fill('-').join('')}--------------------\r\n\r\n`;
      }
      return str;
    } catch (e) {
      return errorHandler(e);
    }
  }

  private open(newfile?: boolean): number | Error {
    try {
      const date = format(Date.now(), 'yyyy-MM-dd');
      let num = 1;
      let filepath = join(this.savePath, `${date}.log`);
      let size = 0;
      if (newfile) {
        while (existsSync(filepath)) {
          filepath = join(this.savePath, `${date}-(${num++}).log`);
        }
      } else {
        while (existsSync(filepath) && (size = statSync(filepath).size) >= this.maxBytesLength) {
          filepath = join(this.savePath, `${date}-(${num++}).log`);
        }
      }
      this.currentLength = size;
      this.filepath = filepath;
      return openSync(filepath, 'a');
    } catch (error: any) {
      return error;
    }
  }
  private write(text: string) {
    const wd = `${this.currentLength <= 0 ? '' : '\r\n'}${text}`;

    if ((Logger.THRESHOLD + this.currentLength + Buffer.byteLength(wd, 'utf-8')) >= this.maxBytesLength || (!isNull(this.filepath) && !existsSync(this.filepath))) {
      const fd = this.open(true);
      if (isNumber(fd)) {
        this.fd = fd;
      } else {
        console.error(fd);
        this.fd = null;
      }
    }
    if (!isNull(this.fd)) {
      const len = writeSync(this.fd, wd, null, 'utf-8');
      len && (this.currentLength += len);
    }
  }

  public info(...args: any[]) {
    this.dispose(Logger.getHead('info'), ...args);
  }
  public error(...args: any[]) {
    this.dispose(Logger.getHead('error'), ...args);
  }
  public warn(...args: any[]) {
    this.dispose(Logger.getHead('warn'), ...args);
  }
  public debug(...args: any[]) {
    this._debug && this.dispose(Logger.getHead('debug'), ...args);
  }
  public verbose(...args: any[]) {
    this.dispose(Logger.getHead('verbose'), ...args);
  }

  private static space(num: number): string {
    let str = '';
    for (let i = 0; i < num; i++) {
      str += ' ';
    }
    return str;
  }
  /**
   * 
   * @param arg 
   * @param space 空格数
   * @param quot arg为String时是否添加引号
   * @returns 
   */
  public static toString(arg: any, space = 2, quot = false, cache: any[] = []): string {
    if (isString(arg)) {
      arg = arg.trim();
    }
    if (isString(arg) && quot) {
      return `'${arg}'`;
    }
    if (isDate(arg)) {
      return format(arg, 'yyyy-MM-dd HH:mm:ss');
    }
    if (isFunction(arg)) {
      const funcType = getType(arg);
      const str = String(arg);
      if (str.startsWith('class')) {
        return `[class ${arg.name}]`;
      }
      const argsStr = str.substring(str.indexOf('(') + 1, str.indexOf(')'))
        .split(',')
        .map(s => {
          return s.trim();
        })
        .join(', ')
        ;
      return (arg.name === '' || arg.name === 'anonymous') ? `[${funcType}(anonymous) (${argsStr})]` : `[${funcType}: ${arg.name}(${argsStr})]`;
    }
    if (isError(arg)) {
      return arg.stack || arg.message;
    }
    if (isArray(arg)) {
      let str = '';
      Object.keys(arg).forEach((k: any, _) => {
        if (!isNaN(Number(k))) {
          str += `${Logger.toString(arg[k], space, true, cache)}, `;
        } else {
          str += `${k}: ${Logger.toString(arg[k], space, true, cache)}, `;
        }
      });
      str = str.substring(0, arg.length > 0 ? str.length - 2 : 0);
      return str.length <= 0 ? '[]' : `[${str.startsWith('{') ? '' : ' '}${str}${str.endsWith('}') ? '' : ' '}]`;
    }
    if (isObject(arg)) {
      if (cache.includes(arg)) {
        return '-- ignore --';
      }
      cache.push(arg);
      const keys = Object.keys(arg);
      if (keys.length <= 0) {
        return '{}';
      }
      let str = '{\n';
      const a = arg as any;
      keys.forEach((k, i) => {
        str += `${Logger.space(space)}${k}: ${Logger.toString(a[k], space + 2, true, cache)}${i === keys.length - 1 ? '' : ','}\n`;
      });
      return str + Logger.space(space - 2) + (str.endsWith('\n') ? '' : '\n') + '}';
    }
    if (isUint8Array(arg)) {
      let str = '';
      if (arg.length <= 50) {
        for (const v of arg) {
          str += `${v}, `;
        }
        str = str.substring(0, arg.length > 0 ? str.length - 2 : 0);
      } else {
        str += `${arg[0]}, ${arg[1]}, ${arg[2]}, ${arg[3]}, ${arg[4]}, ${arg[5]}, ..., ${arg[arg.length - 3]}, ${arg[arg.length - 2]}, ${arg[arg.length - 1]}`;
      }
      return `Uint8Array(${arg.length})[${str.length > 0 ? ' ' + str + ' ' : ''}]`;
    }
    return String(arg);
  }
  private dispose(head: LogHead, ...args: any[]) {
    args = args.map(arg => {
      return Logger.toString(arg);
    });
    const { type, raw, val } = head;
    if (this._debug) {
      switch (type) {
        case 'warn':
          console.warn(val, ...args);
          break;
        case 'error':
          console.error(val, ...args);
          break;
        case 'info':
        case 'debug':
        default:
          console.log(val, ...args);
          break;
      }
    }
    this.writeToFile && this.write([raw, ...args].join(' '));
  }
}