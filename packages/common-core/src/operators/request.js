import { is, assert, has, conform, optional, AssertionError } from '../predicates/index.js'
import { schedule } from '../utilities/index.js'

const durationOrFunction = (value) =>
  is.nonNegativeInteger(value) || is.function(value)

// Fetch init keys (method, headers, body, ...) are intentionally not declared
// and are passed through to ...defaults / ...fetchOptions.
const REQUEST_OPTIONS_SCHEMA = {
  retries: optional(is.nonNegativeInteger),
  retryDelay: optional(durationOrFunction),
  timeout: optional(durationOrFunction),
  signal: optional(is.abortSignal)
}

function validateOptions (options) {
  assert.that(
    options,
    (v) => conform.schema(v, REQUEST_OPTIONS_SCHEMA),
    'options must be a valid options object'
  )
}

function isReplayableBody (body) {
  if (is.nil(body)) return true
  if (is.string(body)) return true
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true
  if (typeof Blob !== 'undefined' && body instanceof Blob) return true
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return true
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true
  // ReadableStream and unsupported body types are not considered safe to retry
  return false
}

function shouldRetry (response) {
  return response.status === 408 ||
    response.status === 429 ||
    response.status >= 500
}

export function request (options = {}) {
  validateOptions(options)

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
      validateOptions(options)
      const {
        retries: requestRetries = retries,
        retryDelay: requestRetryDelay = retryDelay,
        timeout: requestTimeout = timeout,
        signal,
        ...fetchOptions
      } = options
      // Body resolution mirrors the fetch options merge: an explicitly defined
      // body in fetchOptions overrides defaults.body, including body: null.
      const body = has.key(fetchOptions, 'body') ? fetchOptions.body : defaults.body
      if (requestRetries > 0 && !isReplayableBody(body)) {
        throw new AssertionError(
          'body must be replayable (string, ArrayBuffer, Blob, URLSearchParams or FormData) when retries > 0; ' +
          'read the stream into memory before calling, or set retries to 0'
        )
      }
      // A Request carrying a body is consumed after the first send and cannot
      // safely be reused for another attempt.
      if (
        requestRetries > 0 &&
        typeof Request !== 'undefined' &&
        input instanceof Request &&
        input.method !== 'GET' &&
        input.method !== 'HEAD'
      ) {
        throw new AssertionError(
          'a Request with a body cannot be retried; pass the body via fetch options instead, or set retries to 0'
        )
      }
      const userSignals = [controller.signal]
      if (defaultSignal) userSignals.push(defaultSignal)
      if (signal) userSignals.push(signal)
      const userSignal = userSignals.length === 1
        ? userSignals[0]
        : AbortSignal.any(userSignals)
      let attempt = 0
      while (true) {
        const signals = [userSignal]
        const timeoutDuration = is.function(requestTimeout)
          ? requestTimeout(attempt + 1)
          : requestTimeout
        if (is.function(requestTimeout)) {
          assert.that(
            timeoutDuration,
            optional(is.nonNegativeInteger),
            'timeout function must return a non negative integer'
          )
        }
        if (is.defined(timeoutDuration)) {
          signals.push(AbortSignal.timeout(timeoutDuration))
        }
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
        const duration = is.function(requestRetryDelay)
          ? requestRetryDelay(attempt)
          : requestRetryDelay
        if (is.function(requestRetryDelay)) {
          assert.that(
            duration,
            is.nonNegativeInteger,
            'retryDelay function must return a non negative integer'
          )
        }
        await schedule.delay(duration, { signal: userSignal })
      }
    }

  }
}
