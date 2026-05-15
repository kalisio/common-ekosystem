export const env = {
  browser: typeof window !== 'undefined' &&
           typeof window.document !== 'undefined',
  node: typeof process !== 'undefined' &&
        process.versions?.node != null,
  worker: typeof WorkerGlobalScope !== 'undefined' &&
          self instanceof WorkerGlobalScope,
  serviceWorker: typeof ServiceWorkerGlobalScope !== 'undefined' &&
                 self instanceof ServiceWorkerGlobalScope,
  test: typeof process !== 'undefined' && process.env.NODE_ENV === 'test',
  dev: typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
  prod: typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
}
