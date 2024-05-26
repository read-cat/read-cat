import fsp from 'fs/promises';
import { join } from 'path';

self.onmessage = async e => {
  try {
    const { path, recursive } = e.data;
    const files = (await fsp.readdir(path, { recursive })).map(file => fsp.stat(join(path, file)));

    let size = 0;
    const stats = await Promise.allSettled(files);
    for (const stat of stats) {
      if (stat.status !== 'rejected') {
        size += stat.value.size;
      }
    }
    self.postMessage({ size });
  } catch (e: any) {
    self.postMessage({ error: e.message });
  }
}