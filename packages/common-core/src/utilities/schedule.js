import { is, assert, conform, optional } from '../predicates/index.js'

const SIGNAL_OPTIONS_SCHEMA = {
  signal: optional(is.abortSignal)
}

const UNTIL_OPTIONS_SCHEMA = {
  interval: optional(is.nonNegativeInteger),
  signal: optional(is.abortSignal)
}

export const schedule = {

  delay (duration, options = {}) {
    assert.all([
      {
        value: duration,
        validator: is.nonNegativeInteger,
        message: 'duration must be a non negative integer'
      },
      {
        value: options,
        validator: (v) => conform.schema(v, SIGNAL_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
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
    assert.all([
      {
        value: date,
        validator: (v) => is.date(v) || is.nonNegativeInteger(v),
        message: 'date must be a valid date or timestamp'
      },
      {
        value: options,
        validator: (v) => conform.schema(v, SIGNAL_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    const duration = Math.max(0, new Date(date).getTime() - Date.now())
    return schedule.delay(duration, options)
  },

  async until (predicate, options = {}) {
    assert.all([
      {
        value: predicate,
        validator: is.function,
        message: 'predicate must be a function'
      },
      {
        value: options,
        validator: (v) => conform.schema(v, UNTIL_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
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
    assert.all([
      {
        value: callback,
        validator: is.function,
        message: 'callback must be a function'
      },
      {
        value: duration,
        validator: is.nonNegativeInteger,
        message: 'duration must be a non negative integer'
      },
      {
        value: options,
        validator: (v) => conform.schema(v, SIGNAL_OPTIONS_SCHEMA),
        message: 'options must be a valid options object'
      }
    ])
    const controller = new AbortController()
    const signal = options.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal
    const promise = (async () => {
      try {
        while (!signal.aborted) {
          await callback()
          await schedule.delay(duration, { signal })
        }
      } catch (error) {
        if (error !== signal.reason) throw error
      }
    })()
    return {
      promise,
      signal,
      abort: (reason) => controller.abort(reason)
    }
  },

  once (callback) {
    assert.that(callback, is.function, 'callback must be a function')
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
    assert.all([
      {
        value: callback,
        validator: is.function,
        message: 'callback must be a function'
      },
      {
        value: duration,
        validator: is.nonNegativeInteger,
        message: 'duration must be a non negative integer'
      }
    ])
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
    assert.all([
      {
        value: callback,
        validator: is.function,
        message: 'callback must be a function'
      },
      {
        value: duration,
        validator: is.nonNegativeInteger,
        message: 'duration must be a non negative integer'
      }
    ])
    let lastCall = -Infinity
    return function (...args) {
      const now = Date.now()
      if (now - lastCall < duration) return
      lastCall = now
      return callback.apply(this, args)
    }
  }

}
