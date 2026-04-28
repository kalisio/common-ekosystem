import { assert } from '../predicates'

export const promise = {

  QUERYABLE_SYMBOL: Symbol('queryablePromise'),

  createQueryable (promiseOrExecutor) {
    assert.that(
      promiseOrExecutor,
      (v) => typeof v === 'function' || v instanceof Promise,
      'promiseOrExecutor must be a Promise or an executor function'
    )
    const p = typeof promiseOrExecutor === 'function'
      ? new Promise(promiseOrExecutor)
      : promiseOrExecutor
    if (p[promise.QUERYABLE_SYMBOL]) return p
    let status = 'pending'
    const result = p.then(
      (value) => { status = 'fulfilled'; return value },
      (error) => { status = 'rejected'; throw error }
    )
    Object.defineProperty(result, promise.QUERYABLE_SYMBOL, {
      value: true,
      enumerable: false
    })
    result.isPending = () => status === 'pending'
    result.isFulfilled = () => status === 'fulfilled'
    result.isRejected = () => status === 'rejected'
    result.getStatus = () => status
    return result
  }

}
