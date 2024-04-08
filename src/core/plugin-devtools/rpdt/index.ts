import fs from 'fs/promises';
import { existsSync } from 'fs';
import { gunzipSync } from 'zlib';
import { createHash } from 'crypto';
import { isString, isUndefined } from '../../is';
import { errorHandler } from '../../utils';
import path from 'path';

const RPDT_HEAD = [0x52, 0x50, 0x44, 0x54];
export type Metadata = {
  name: string,
  version: string,
  branch: string,
  version_code: number,
  date: string,
  files: {
    file: string,
    sha256: string
  }[]
}

/**
 * 解压RPDT文件
 * @param filename rpdt文件路径
 * @param target 解压目录路径
 */
export async function decompress(filename: string, target: string): Promise<string>;
/**
 * 解压RPDT文件
 * @param buf rpdt文件
 * @param target 解压目录路径
 */
export async function decompress(buf: Buffer, target: string): Promise<string>;
export async function decompress(file: string | Buffer, target: string): Promise<string> {
  let buf: Buffer;
  if (isString(file)) {
    if (!existsSync(file)) {
      return errorHandler('File does not exist');
    }
    buf = await fs.readFile(file);
  } else {
    buf = file;
  }
  const { match, metadata } = await checkout(buf);
  const newp = path.join(target, `${metadata.version}-${metadata.branch}`);
  const backup = path.join(target, `backup_${metadata.version}-${metadata.branch}`);
  const exist = existsSync(newp);
  if (exist) {
    await fs.rename(newp, backup);
  }
  for (const key in match) {
    const value = match[key];
    const _filename = path.join(newp, key);
    const dir = path.dirname(_filename);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, {
        recursive: true
      });
    }
    await fs.writeFile(_filename, value, {
      encoding: 'utf-8'
    });
  }
  exist && await fs.rm(backup, {
    recursive: true,
    force: true
  });
  return newp;
}

const checkout = async (buf: Buffer) => {
  try {
    
    if (
      buf[0] !== RPDT_HEAD[0] ||
      buf[1] !== RPDT_HEAD[1] ||
      buf[2] !== RPDT_HEAD[2] ||
      buf[3] !== RPDT_HEAD[3]
    ) {
      throw 'incorrect rpdt header check';
    }
    const raw = JSON.parse(gunzipSync(buf.subarray(4)).toString('utf-8'));
    if (isUndefined(raw['metadata.json'])) {
      throw 'Metadata not found';
    }
    const metadata: Metadata = JSON.parse(raw['metadata.json']);
    if (
      isUndefined(metadata.name) ||
      isUndefined(metadata.version) ||
      isUndefined(metadata.branch) ||
      isUndefined(metadata.version_code) ||
      isUndefined(metadata.date) ||
      isUndefined(metadata.files) ||
      metadata.files.length <= 0
    ) {
      throw 'Non-standard metadata';
    }
    const match: Record<string, Buffer> = {};
    for (const key in raw) {
      const value = Buffer.from(raw[key]);
      if (key === 'metadata.json') {
        match[key] = value;
        continue;
      }
      const hash = createHash('sha256');
      hash.update(value);
      const hex = hash.digest('hex');
      const i = metadata.files.find(v => v.file === key);
      if (!i) {
        throw new Error(`${key} not found`);
      }
      if (hex !== i.sha256) {
        throw new Error('sha256 does not match');
      }
      match[key] = value;
    }
    return {
      match,
      metadata
    };
  } catch (e) {
    return errorHandler(e);
  }

}