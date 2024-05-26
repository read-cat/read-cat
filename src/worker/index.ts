import { newError } from '../core/utils';
import DecodeWorker from './decode?worker';
import ReadFileWorker from './read-file?worker';
import GetDirectorySize from './get-directory-size?worker';

export type DecodeResult = {
  value: string
  encoding: string
}

export const decode = (buffer: Buffer, encoding?: string) => {
  return new Promise<DecodeResult>((reso, reje) => {
    const worker = new DecodeWorker();
    worker.postMessage({
      buffer,
      encoding
    });
    worker.onmessage = e => {
      const { error, result, encoding } = e.data;
      worker.terminate();
      return error ? reje(newError(error)) : reso({ value: result, encoding });
    }
    worker.onerror = e => {
      worker.terminate();
      return reje(newError(e.message));
    }
  });
}
export const readFile = (path: string) => {
  return new Promise<Buffer>((reso, reje) => {
    const worker = new ReadFileWorker();
    worker.postMessage({
      path
    });
    worker.onmessage = e => {
      const { error, result } = e.data;
      worker.terminate();
      return error ? reje(newError(error)) : reso(Buffer.from(result));
    }
    worker.onerror = e => {
      worker.terminate();
      return reje(newError(e.message));
    }
  });
}
export const getDirectorySize = (path: string, recursive = true) => {
  return new Promise<number>((reso, reje) => {
    const worker = new GetDirectorySize();
    worker.postMessage({
      path,
      recursive
    });
    worker.onmessage = e => {
      const { error, size } = e.data;
      worker.terminate();
      return error ? reje(newError(error)) : reso(size);
    }
    worker.onerror = e => {
      worker.terminate();
      return reje(newError(e.message));
    }
  });
}