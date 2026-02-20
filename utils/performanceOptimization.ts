import { QueryClient } from '@tanstack/react-query';

export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      fn(...args);
      lastCall = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        lastCall = Date.now();
      }, interval - (now - lastCall));
    }
  };
};

export const getVirtualScrollConfig = (itemCount: number) => {
  if (itemCount > 100) {
    return {
      enabled: true,
      height: 600,
      itemSize: 80,
      overscan: 5,
    };
  }
  return {
    enabled: false,
    height: 'auto',
    itemSize: 80,
    overscan: 0,
  };
};

export const getBatchConfig = (totalItems: number) => {
  return {
    batchSize: Math.min(Math.max(50, Math.floor(totalItems / 10)), 100),
    batchDelay: 100,
    progressThreshold: 20,
  };
};

export const createRequestDeduplicator = () => {
  const pending = new Map<string, Promise<any>>();
  const deduplicate = async <T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    if (pending.has(key)) {
      return pending.get(key)!;
    }
    const promise = fn();
    pending.set(key, promise);
    try {
      return await promise;
    } finally {
      pending.delete(key);
    }
  };
  return { deduplicate };
};

export const calculateBackoffDelay = (
  attemptIndex: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
) => {
  const exponential = baseDelay * Math.pow(2, attemptIndex);
  const jitter = Math.random() * exponential * 0.1;
  return Math.min(exponential + jitter, maxDelay);
};

export class PerformanceMonitor {
  private startTime: number = 0;
  private marks: Map<string, number> = new Map();

  start() {
    this.startTime = performance.now();
    this.marks.clear();
  }

  mark(label: string) {
    this.marks.set(label, performance.now());
  }

  end(label: string = 'Total') {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    const report = {
      [label]: `${duration.toFixed(2)}ms`,
      breakdown: {} as Record<string, string>,
    };
    let lastTime = this.startTime;
    for (const [markLabel, markTime] of this.marks) {
      report.breakdown[markLabel] = `${(markTime - lastTime).toFixed(2)}ms`;
      lastTime = markTime;
    }
    report.breakdown['Final'] = `${(endTime - lastTime).toFixed(2)}ms`;
    return report;
  }
}