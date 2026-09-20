import { is, assert, conform, optional } from '../predicates/index.js'

const TRACKABLE_SYMBOL = Symbol('trackablePromise')

const CONCURRENT_OPTIONS_SCHEMA = {
  concurrency: optional((v) => is.positiveInteger(v) || is.positiveInfinity(v))
}

export const promise = {

  track (promiseOrExecutor) {
    assert.that(
      promiseOrExecutor,
      (v) => is.function(v) || v instanceof Promise,
      'promiseOrExecutor must be a Promise or an executor function'
    )
    const p = typeof promiseOrExecutor === 'function'
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

  async run (tasks, options = {}) {
    assert.all([
      { value: tasks, validator: is.array, message: 'tasks must be an array' },
      { value: tasks, validator: (v) => is.array(v) && v.every((t) => is.function(t)), message: 'tasks must contain functions' },
      { value: options, validator: (v) => conform.schema(v, CONCURRENT_OPTIONS_SCHEMA), message: 'options must be valid' }
    ])
    const { concurrency = Infinity } = options
    if (tasks.length === 0) return []
    // No concurrency limit
    if (is.positiveInfinity(concurrency)) {
      return Promise.all(tasks.map(task => task()))
    }
    const results = new Array(tasks.length)
    let next = 0
    async function worker () {
      while (next < tasks.length) {
        const index = next++
        results[index] = await tasks[index]()
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
