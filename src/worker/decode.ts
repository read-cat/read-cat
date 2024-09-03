import { decode } from 'iconv-lite';
import { detect } from 'jschardet';

self.onmessage = e => {
  try {
    let { encoding } = e.data;
    const buffer = Buffer.from(e.data.buffer);
    if (!encoding) {
      let end = Math.ceil(buffer.byteLength / 1024);
      end = end < 1024 ? 1024 : end;
      encoding = detect(buffer.subarray(0, end)).encoding;
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