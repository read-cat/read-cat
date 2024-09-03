import { isNull } from '../is';

const timer = (interval: boolean, executor: (...args: any[]) => void, ms = 1000) => {
  let timeout: NodeJS.Timeout | null = null;
  let isRunning = false;
  const start = (...args: any[]) => {
    isRunning = true;
    if (isNull(timeout)) {
      if (interval) {
        timeout = setInterval(() => executor(...args), ms);
      } else {
        timeout = setTimeout(() => {
          executor(...args);
          isRunning = false;
          timeout = null;
        }, ms);
      }
    }
  }
  const stop = () => {
    if (!isNull(timeout)) {
      interval && clearInterval(timeout);
      !interval && clearTimeout(timeout);
      timeout = null;
      isRunning = false;
    }
  }
  return {
    start,
    stop,
    executor,
    isRunning: () => isRunning
  }
}

export const timeout = (executor: (...args: any[]) => void, ms = 1000) => {
  return timer(false, executor, ms);
}
export const interval = (executor: (...args: any[]) => void, ms = 1000) => {
  return timer(true, executor, ms);
}

export const debounce = (executor: (...args: any[]) => void, ms = 1000) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: any[]) => {
    if (!isNull(timeout)) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      executor(...args);
      timeout = null;
    }, ms);
  }
}

export const sleep = (ms = 1000) => {
  return new Promise<void>((reso, _) => {
    setTimeout(() => {
      return reso();
    }, ms);
  });
}