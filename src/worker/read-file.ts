import fs from 'fs/promises';

self.onmessage = e => {
  let { path } = e.data;
  fs.readFile(path).then(result => {
    self.postMessage({ result });
  }).catch(e => {
    self.postMessage({
      error: e.message
    });
  });
}