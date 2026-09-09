export const schedule = {

  delay (duration, options = {}) {
    const { signal } = options
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(signal.reason)
      const onAbort = () => {
        clearTimeout(timeout)
        reject(signal.reason)
      }
      const timeout = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, duration)
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  },

  at (date, options = {}) {
    const duration = Math.max(0, new Date(date).getTime() - Date.now())
    return schedule.delay(duration, options)
  },

  async until (predicate, options = {}) {
    const {
      interval = 1000,
      signal
    } = options
    while (true) {
      if (signal?.aborted) throw signal.reason
      const result = await predicate()
      if (result) return result
      await schedule.delay(interval, { signal })
    }
  },

  repeat (callback, duration, options = {}) {
    const controller = new AbortController()
    const signal = options.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal
    const promise = (async () => {
      try {
        while (!signal.aborted) {
          await schedule.delay(duration, { signal })
          await callback()
        }
      } catch (error) {
        if (!signal.aborted) throw error
      }
    })()
    return {
      promise,
      signal,
      abort: (reason) => controller.abort(reason)
    }
  },

  once (callback) {
    let called = false
    let result
    return function (...args) {
      if (!called) {
        called = true
        result = callback.apply(this, args)
      }
      return result
    }
  },

  debounce (callback, duration) {
    let timeout
    function debounced (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        timeout = undefined
        callback.apply(this, args)
      }, duration)
    }
    debounced.cancel = () => {
      clearTimeout(timeout)
      timeout = undefined
    }
    return debounced
  },

  throttle (callback, duration) {
    let lastCall = 0
    return function (...args) {
      const now = Date.now()
      if (now - lastCall < duration) return
      lastCall = now
      return callback.apply(this, args)
    }
  }

}
