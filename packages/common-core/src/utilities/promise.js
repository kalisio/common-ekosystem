import { is, assert, conform, ensure, optional } from '../predicates/index.js'
import { object } from './object.js'

const TRACKABLE_SYMBOL = Symbol('trackablePromise')

const CONCURRENT_OPTIONS_SCHEMA = {
  concurrency: optional((v) => is.positiveInteger(v) || is.positiveInfinity(v))
}

const CONCURRENT_DEFAULTS = { concurrency: Infinity }

export const promise = {

  checkNotThenable (value, message = 'Unexpected thenable') {
    const thenable = is.thenable(value)
    // The value is refused by throwing, so a native promise would never be handled:
    // silence it to avoid a second, unhandled rejection.
    // Arbitrary thenables are left alone as calling their then() may start their execution.
    if (is.promise(value)) value.catch(() => {})
    ensure.that(thenable, is.booleanFalse, message)
    return value
  },

  track (promiseOrExecutor) {
    assert.that(
      promiseOrExecutor,
      (v) => is.function(v) || is.promise(v),
      'promiseOrExecutor must be a Promise or an executor function'
    )
    const p = is.function(promiseOrExecutor)
      ? new Promise(promiseOrExecutor)
      : promiseOrExecutor
    if (p[TRACKABLE_SYMBOL]) return p
    let status = 'pending'
    const result = p.then(
      (value) => { status = 'fulfilled'; return value },
      (error) => { status = 'rejected'; throw error }
    )
    Object.defineProperty(result, TRACKABLE_SYMBOL, {
      value: true,
      enumerable: false
    })
    result.isPending = () => status === 'pending'
    result.isFulfilled = () => status === 'fulfilled'
    result.isRejected = () => status === 'rejected'
    result.getStatus = () => status
    return result
  },

  async run (tasks, options) {
    const settings = object.defaults(CONCURRENT_DEFAULTS, options)
    assert.all([
      { value: tasks, validator: (v) => is.arrayOf(v, is.function), message: 'tasks must be an array of functions' },
      { value: settings, validator: (v) => conform.schema(v, CONCURRENT_OPTIONS_SCHEMA), message: 'options must be valid' }
    ])
    const { concurrency } = settings
    if (tasks.length === 0) return []
    // No concurrency limit
    if (is.positiveInfinity(concurrency)) {
      return Promise.all(tasks.map(task => task()))
    }
    const results = new Array(tasks.length)
    let next = 0
    let failed = false
    async function worker () {
      while (!failed && next < tasks.length) {
        const index = next++
        try {
          results[index] = await tasks[index]()
        } catch (error) {
          failed = true
          throw error
        }
      }
    }
    const workers = Array.from(
      { length: Math.min(concurrency, tasks.length) },
      () => worker()
    )
    await Promise.all(workers)
    return results
  }

}
