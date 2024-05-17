import fs from 'fs/promises';
import DecodeWorker from '../../../../worker/decode?worker';

self.onmessage = e => {
  let { path, encoding } = e.data;
  fs.readFile(path).then(buffer => {
    const worker = new DecodeWorker();
    worker.postMessage({
      buffer,
      encoding
    });
    worker.onmessage = e => {
      const { error, result, encoding } = e.data;
      if (error) {
        self.postMessage({ error });
      } else {
        self.postMessage({ result, encoding, buffer });
      }
      worker.terminate();
    }
  }).catch(e => {
    self.postMessage({
      error: e.message
    });
  });
}