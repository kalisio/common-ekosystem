import { AssertionError } from '../../src/predicates/index.js'
import { promise } from '../../src/utilities/index.js'

describe('promise.track', () => {
  it('accepts a Promise as argument', () => {
    const p = promise.track(Promise.resolve(42))
    expect(p.isPending).toBeTypeOf('function')
    expect(p.isFulfilled).toBeTypeOf('function')
    expect(p.isRejected).toBeTypeOf('function')
    expect(p.getStatus).toBeTypeOf('function')
  })
  it('accepts an executor function as argument', () => {
    const p = promise.track((resolve) => resolve(42))
    expect(p.isPending).toBeTypeOf('function')
  })
  it('throws if argument is neither a Promise nor a function', () => {
    expect(() => promise.track(42)).toThrow(AssertionError)
    expect(() => promise.track('hello')).toThrow(AssertionError)
    expect(() => promise.track(null)).toThrow(AssertionError)
    expect(() => promise.track(undefined)).toThrow(AssertionError)
  })
  it('is pending immediately after creation', () => {
    const p = promise.track((resolve) => setTimeout(resolve, 100))
    expect(p.isPending()).toBe(true)
    expect(p.isFulfilled()).toBe(false)
    expect(p.isRejected()).toBe(false)
    expect(p.getStatus()).toBe('pending')
  })
  it('is fulfilled after resolution', async () => {
    const p = promise.track(Promise.resolve(42))
    await p
    expect(p.isPending()).toBe(false)
    expect(p.isFulfilled()).toBe(true)
    expect(p.isRejected()).toBe(false)
    expect(p.getStatus()).toBe('fulfilled')
  })
  it('resolves with the correct value', async () => {
    const p = promise.track(Promise.resolve(42))
    expect(await p).toBe(42)
  })
  it('is rejected after rejection', async () => {
    const p = promise.track(Promise.reject(new Error('oops')))
    await p.catch(() => {})
    expect(p.isPending()).toBe(false)
    expect(p.isFulfilled()).toBe(false)
    expect(p.isRejected()).toBe(true)
    expect(p.getStatus()).toBe('rejected')
  })
  it('rejects with the correct error', async () => {
    const p = promise.track(Promise.reject(new Error('oops')))
    await expect(p).rejects.toThrow('oops')
  })
  it('returns the same promise if already queryable', () => {
    const p = promise.track(Promise.resolve(42))
    const p2 = promise.track(p)
    expect(p2).toBe(p)
  })
  it('does not expose the queryable marker in enumerable properties', () => {
    const p = promise.track(Promise.resolve(42))
    const keys = Object.keys(p)
    expect(keys).not.toContain(expect.stringContaining('queryable'))
  })
  it('can be awaited directly without .promise', async () => {
    const p = promise.track(Promise.resolve('direct'))
    const result = await p
    expect(result).toBe('direct')
  })
})

describe('promise.run', () => {
  it('throws if tasks is not an array', async () => {
    await expect(promise.run(42)).rejects.toThrow(AssertionError)
    await expect(promise.run('nope')).rejects.toThrow(AssertionError)
  })
  it('throws if tasks contains a non-function', async () => {
    await expect(promise.run([() => 1, 42])).rejects.toThrow(AssertionError)
  })
  it('throws if concurrency is not a positive integer or Infinity', async () => {
    await expect(promise.run([() => 1], { concurrency: 0 })).rejects.toThrow(AssertionError)
    await expect(promise.run([() => 1], { concurrency: -1 })).rejects.toThrow(AssertionError)
    await expect(promise.run([() => 1], { concurrency: 1.5 })).rejects.toThrow(AssertionError)
  })
  it('returns an empty array when there are no tasks', async () => {
    expect(await promise.run([])).toEqual([])
  })
  it('runs every task and returns their results', async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)]
    expect(await promise.run(tasks)).toEqual([1, 2, 3])
  })
  it('returns results in input order regardless of completion order', async () => {
    const tasks = [
      () => new Promise((resolve) => setTimeout(() => resolve('a'), 30)),
      () => new Promise((resolve) => setTimeout(() => resolve('b'), 10)),
      () => new Promise((resolve) => setTimeout(() => resolve('c'), 20))
    ]
    expect(await promise.run(tasks, { concurrency: 2 })).toEqual(['a', 'b', 'c'])
  })
  it('calls each task exactly once', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => vi.fn(async () => i))
    await promise.run(tasks, { concurrency: 2 })
    tasks.forEach((task) => expect(task).toHaveBeenCalledTimes(1))
  })
  it.each([1, 2, 3])('never runs more than %i tasks at once', async (concurrency) => {
    let active = 0
    let maxActive = 0
    const tasks = Array.from({ length: 9 }, () => async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active--
    })
    await promise.run(tasks, { concurrency })
    expect(maxActive).toBe(concurrency)
  })
  it('accepts Infinity as an explicit concurrency', async () => {
    expect(await promise.run([() => Promise.resolve(1)], { concurrency: Infinity })).toEqual([1])
  })
  it('handles a concurrency larger than the number of tasks', async () => {
    expect(await promise.run([() => Promise.resolve('x')], { concurrency: 10 })).toEqual(['x'])
  })
  it('rejects if any task rejects', async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.reject(new Error('boom'))]
    await expect(promise.run(tasks, { concurrency: 1 })).rejects.toThrow('boom')
  })
})
