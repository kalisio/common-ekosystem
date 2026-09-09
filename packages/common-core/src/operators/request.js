import { schedule } from '../utilities/index.js'

function shouldRetry (response) {
  return response.status === 408 ||
    response.status === 429 ||
    response.status >= 500
}

export function request (options = {}) {
  const controller = new AbortController()
  const {
    retries = 0,
    retryDelay = 1000,
    timeout,
    signal: defaultSignal,
    ...defaults
  } = options

  return {
    get signal () {
      return controller.signal
    },
    get aborted () {
      return controller.signal.aborted
    },
    abort (reason) {
      controller.abort(reason)
    },
    async fetch (input, options = {}) {
      const {
        retries: requestRetries = retries,
        retryDelay: requestRetryDelay = retryDelay,
        timeout: requestTimeout = timeout,
        signal,
        ...fetchOptions
      } = options
      const userSignals = [controller.signal]
      if (defaultSignal) userSignals.push(defaultSignal)
      if (signal) userSignals.push(signal)
      const userSignal = userSignals.length === 1
        ? userSignals[0]
        : AbortSignal.any(userSignals)
      let attempt = 0
      while (true) {
        const signals = [userSignal]
        const timeoutDuration = typeof requestTimeout === 'function'
          ? requestTimeout(attempt + 1)
          : requestTimeout
        if (timeoutDuration) signals.push(AbortSignal.timeout(timeoutDuration))
        const combinedSignal = signals.length === 1
          ? signals[0]
          : AbortSignal.any(signals)
        try {
          const response = await globalThis.fetch(input, {
            ...defaults,
            ...fetchOptions,
            signal: combinedSignal
          })
          if (!shouldRetry(response) || attempt >= requestRetries) return response
          await response.body?.cancel()
        } catch (error) {
          if (userSignal.aborted || attempt >= requestRetries) throw error
        }
        attempt++
        const duration = typeof requestRetryDelay === 'function'
          ? requestRetryDelay(attempt)
          : requestRetryDelay
        await schedule.delay(duration, { signal: userSignal })
      }
    }
  }
}
