import { decode } from 'iconv-lite';
import { detect } from 'jschardet';

self.onmessage = e => {
  try {
    let { encoding } = e.data;
    const buffer = Buffer.from(e.data.buffer);
    if (!encoding) {
      encoding = detect(buffer.subarray(0, 100)).encoding;
    }
    const result = decode(buffer, encoding);
    self.postMessage({
      result,
      encoding
    });
  } catch (e: any) {
    self.postMessage({
      error: e.message
    });
  }
}