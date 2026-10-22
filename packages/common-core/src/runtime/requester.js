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

function validateRetryBody (input, body, retries) {
  if (retries === 0) return
  if (!isReplayableBody(body)) {
    throw new AssertionError(
      'body must be replayable (string, ArrayBuffer, Blob, URLSearchParams or FormData) when retries > 0; ' +
      'read the stream into memory before calling, or set retries to 0'
    )
  }
  if (isRequest(input) && input.body !== null) {
    throw new AssertionError(
      'a Request with a body cannot be retried; pass the URL and body via fetch options instead, or set retries to 0'
    )
  }
}

function combineSignals (...signals) {
  const present = signals.filter(Boolean)
  return present.length === 1 ? present[0] : AbortSignal.any(present)
}

function resolveTimeout (timeout, attempt) {
  const duration = is.function(timeout) ? timeout(attempt) : timeout
  if (is.function(timeout)) {
    assert.that(
      duration,
      optional(isPositiveInteger),
      'timeout function must return a positive integer or undefined'
    )
  }
  return duration
}

async function fetchWithTimeout (input, init, signal, duration) {
  let combinedSignal = signal
  let timer
  if (is.defined(duration)) {
    const controller = new AbortController()
    timer = setTimeout(() => {
      controller.abort(new DOMException('The operation timed out.', 'TimeoutError'))
    }, duration)
    combinedSignal = combineSignals(signal, controller.signal)
  }
  try {
    return await globalThis.fetch(input, { ...init, signal: combinedSignal })
  } finally {
    clearTimeout(timer)
  }
}

function resolveRetryDelay (retryDelay, attempt, serverDelay) {
  if (is.defined(serverDelay)) return serverDelay
  const duration = is.function(retryDelay) ? retryDelay(attempt) : retryDelay
  if (is.function(retryDelay)) {
    assert.that(duration, is.nonNegativeInteger, 'retryDelay function must return a non negative integer')
  }
  return duration
}

async function discardResponse (response) {
  try {
    await response.body?.cancel()
  } catch {
    // Best-effort cleanup.
  }
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
      validateRetryBody(input, body, requestRetries)
      const init = { ...defaults, ...fetchOptions }
      const method = resolveMethod(input, init)
      const headers = mergeHeaders(input, defaults.headers, fetchOptions.headers)
      if (headers) init.headers = headers
      const requestHeaders = new Headers(headers ?? (isRequest(input) ? input.headers : undefined))
      const userSignal = combineSignals(runtimeSignal, signal, isRequest(input) ? input.signal : undefined)
      let attempt = 0
      const canRetry = (context) => Boolean(requestShouldRetry({
        ...context,
        method,
        headers: new Headers(requestHeaders),
        attempt: attempt + 1
      }))
      while (true) {
        userSignal.throwIfAborted()
        const timeoutDuration = resolveTimeout(requestTimeout, attempt + 1)
        let response
        let serverDelay
        try {
          response = await fetchWithTimeout(input, init, userSignal, timeoutDuration)
        } catch (error) {
          if (userSignal.aborted || attempt >= requestRetries || !canRetry({ error })) throw error
          logger.debug('Retrying request after error', { attempt: attempt + 1, error })
        }
        if (response) {
          if (response.ok || attempt >= requestRetries || !canRetry({ response })) return response
          serverDelay = retryAfterMs(response)
          if (is.defined(serverDelay) && serverDelay > requestMaxRetryAfter) return response
          logger.debug('Retrying request', { attempt: attempt + 1, status: response.status })
          await discardResponse(response)
        }
        attempt++
        const duration = resolveRetryDelay(requestRetryDelay, attempt, serverDelay)
        await schedule.delay(duration, { signal: userSignal })
      }
    }

  }
}
