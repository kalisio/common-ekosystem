import { is, assert, has, conform, optional, AssertionError } from '../predicates/index.js'
import { schedule } from '../utilities/index.js'
import { getLogger } from './logger.js'

const logger = getLogger(['common-core', 'requester'])

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'])
const RETRYABLE_SERVER_STATUSES = new Set([500, 502, 503, 504])
const DEFAULT_MAX_RETRY_AFTER = 60_000
const isPositiveInteger = (value) => is.nonNegativeInteger(value) && value > 0
const durationOrFunction = (value) => is.nonNegativeInteger(value) || is.function(value)
const timeoutOrFunction = (value) => isPositiveInteger(value) || is.function(value)
const isRequest = (value) => typeof Request !== 'undefined' && value instanceof Request

const REQUEST_OPTIONS_SCHEMA = {
  retries: optional(is.nonNegativeInteger),
  retryDelay: optional(durationOrFunction),
  maxRetryAfter: optional(is.nonNegativeInteger),
  shouldRetry: optional(is.function),
  timeout: optional(timeoutOrFunction),
  signal: optional(is.abortSignal)
}

function validateOptions (options) {
  assert.that(options, (v) => conform.schema(v, REQUEST_OPTIONS_SCHEMA), 'options must be a valid options object')
}

function isReplayableBody (body) {
  if (is.nil(body)) return true
  if (is.string(body)) return true
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true
  if (typeof Blob !== 'undefined' && body instanceof Blob) return true
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return true
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true
  return false
}

// An Idempotency-Key is safe only if the server enforces deduplication.
export function shouldRetryByDefault ({ error, response, method, headers }) {
  const replayable = IDEMPOTENT_METHODS.has(method) || Boolean(headers?.get('idempotency-key')?.trim())
  if (!replayable) return false
  if (response) {
    return response.status === 408 || response.status === 429 || RETRYABLE_SERVER_STATUSES.has(response.status)
  }
  return is.defined(error)
}

// Exponential backoff capped at 30s, with 50-100% jitter.
function exponentialBackoff (attempt) {
  const base = Math.min(30_000, 1000 * 2 ** (attempt - 1))
  return Math.round(base * (0.5 + Math.random() / 2))
}

function retryAfterMs (response) {
  const value = response.headers.get('retry-after')?.trim()
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number(value) * 1000
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now())
}

function mergeHeaders (input, ...sources) {
  const present = sources.filter((source) => !is.nil(source))
  if (present.length === 0) return undefined
  const headers = new Headers(isRequest(input) ? input.headers : undefined)
  for (const source of present) {
    new Headers(source).forEach((value, key) => headers.set(key, value))
  }
  return headers
}

function resolveMethod (input, init) {
  return String(init.method ?? (isRequest(input) ? input.method : 'GET')).toUpperCase()
}

export function createRequester (options = {}) {
  validateOptions(options)
  const controller = new AbortController()
  const {
    retries = 0,
    retryDelay = exponentialBackoff,
    maxRetryAfter = DEFAULT_MAX_RETRY_AFTER,
    shouldRetry = shouldRetryByDefault,
    timeout,
    signal: defaultSignal,
    ...defaults
  } = options
  const runtimeSignal = defaultSignal
    ? AbortSignal.any([controller.signal, defaultSignal])
    : controller.signal
  return {

    get signal () {
      return runtimeSignal
    },

    get aborted () {
      return runtimeSignal.aborted
    },

    abort (reason) {
      controller.abort(reason)
    },

    async fetch (input, options = {}) {
      validateOptions(options)
      const {
        retries: requestRetries = retries,
        retryDelay: requestRetryDelay = retryDelay,
        maxRetryAfter: requestMaxRetryAfter = maxRetryAfter,
        shouldRetry: requestShouldRetry = shouldRetry,
        timeout: requestTimeout = timeout,
        signal,
        ...fetchOptions
      } = options
      const body = has.key(fetchOptions, 'body') ? fetchOptions.body : defaults.body
      if (requestRetries > 0 && !isReplayableBody(body)) {
        throw new AssertionError(
          'body must be replayable (string, ArrayBuffer, Blob, URLSearchParams or FormData) when retries > 0; ' +
          'read the stream into memory before calling, or set retries to 0'
        )
      }
      if (requestRetries > 0 && isRequest(input) && input.body !== null) {
        throw new AssertionError(
          'a Request with a body cannot be retried; pass the URL and body via fetch options instead, or set retries to 0'
        )
      }
      const init = { ...defaults, ...fetchOptions }
      const method = resolveMethod(input, init)
      const headers = mergeHeaders(input, defaults.headers, fetchOptions.headers)
      if (headers) init.headers = headers
      const requestHeaders = new Headers(headers ?? (isRequest(input) ? input.headers : undefined))
      const userSignals = [runtimeSignal]
      if (signal) userSignals.push(signal)
      if (isRequest(input)) userSignals.push(input.signal)
      const userSignal = userSignals.length === 1 ? userSignals[0] : AbortSignal.any(userSignals)
      let attempt = 0
      const canRetry = (context) => Boolean(requestShouldRetry({
        ...context,
        method,
        headers: new Headers(requestHeaders),
        attempt: attempt + 1
      }))
      while (true) {
        userSignal.throwIfAborted()
        const timeoutDuration = is.function(requestTimeout) ? requestTimeout(attempt + 1) : requestTimeout
        if (is.function(requestTimeout)) {
          assert.that(
            timeoutDuration,
            optional(isPositiveInteger),
            'timeout function must return a positive integer or undefined'
          )
        }
        const signals = [userSignal]
        let timer
        if (is.defined(timeoutDuration)) {
          const timeoutController = new AbortController()
          timer = setTimeout(() => {
            timeoutController.abort(new DOMException('The operation timed out.', 'TimeoutError'))
          }, timeoutDuration)
          signals.push(timeoutController.signal)
        }
        const combinedSignal = signals.length === 1 ? signals[0] : AbortSignal.any(signals)
        let response
        let serverDelay
        try {
          response = await globalThis.fetch(input, { ...init, signal: combinedSignal })
        } catch (error) {
          if (userSignal.aborted || attempt >= requestRetries || !canRetry({ error })) throw error
          logger.debug('Retrying request after error', { attempt: attempt + 1, error })
        } finally {
          clearTimeout(timer)
        }
        if (response) {
          if (response.ok || attempt >= requestRetries || !canRetry({ response })) return response
          serverDelay = retryAfterMs(response)
          if (is.defined(serverDelay) && serverDelay > requestMaxRetryAfter) return response
          logger.debug('Retrying request', { attempt: attempt + 1, status: response.status })
          try {
            await response.body?.cancel()
          } catch {
            // Best-effort cleanup.
          }
        }
        attempt++
        let duration = serverDelay
        if (!is.defined(duration)) {
          duration = is.function(requestRetryDelay) ? requestRetryDelay(attempt) : requestRetryDelay
          if (is.function(requestRetryDelay)) {
            assert.that(duration, is.nonNegativeInteger, 'retryDelay function must return a non negative integer')
          }
        }
        await schedule.delay(duration, { signal: userSignal })
      }
    }

  }
}
