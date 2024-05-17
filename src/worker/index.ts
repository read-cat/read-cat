import { newError } from '../core/utils';
import DecodeWorker from './decode?worker';

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