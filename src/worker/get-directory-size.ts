import fsp from 'fs/promises';
import { Stats } from 'fs';
import { join } from 'path';

const scandir = async (path: string, recursive?: boolean) => {
  const files = await fsp.readdir(path);
  const stats: Stats[] = [];
  for (const file of files) {
    const stat = await fsp.stat(join(path, file)).catch(() => null);
    if (!stat) {
      continue;
    }
    if (stat.isDirectory() && recursive) {
      stats.push(...(await scandir(join(path, file), recursive)));
    } else {
      stats.push(stat);
    }
  }
  return stats;
}

self.onmessage = async e => {
  try {
    const { path, recursive } = e.data;
    const stats = await scandir(path, recursive);
    let size = 0;
    for (const stat of stats) {
      size += stat.size;
    }
    self.postMessage({ size });
  } catch (e: any) {
    self.postMessage({ error: e.message });
  }
}