import { describe, it, expect } from 'vitest'
import { AssertionError } from '../../src/predicates/index.js'
import { promise } from '../../src/utilities/index.js'

describe('promise.createQueryable', () => {
  it('accepts a Promise as argument', () => {
    const p = promise.createQueryable(Promise.resolve(42))
    expect(p.isPending).toBeTypeOf('function')
    expect(p.isFulfilled).toBeTypeOf('function')
    expect(p.isRejected).toBeTypeOf('function')
    expect(p.getStatus).toBeTypeOf('function')
  })

  it('accepts an executor function as argument', () => {
    const p = promise.createQueryable((resolve) => resolve(42))
    expect(p.isPending).toBeTypeOf('function')
  })

  it('throws if argument is neither a Promise nor a function', () => {
    expect(() => promise.createQueryable(42)).toThrow(AssertionError)
    expect(() => promise.createQueryable('hello')).toThrow(AssertionError)
    expect(() => promise.createQueryable(null)).toThrow(AssertionError)
    expect(() => promise.createQueryable(undefined)).toThrow(AssertionError)
  })

  it('is pending immediately after creation', () => {
    const p = promise.createQueryable((resolve) => setTimeout(resolve, 100))
    expect(p.isPending()).toBe(true)
    expect(p.isFulfilled()).toBe(false)
    expect(p.isRejected()).toBe(false)
    expect(p.getStatus()).toBe('pending')
  })

  it('is fulfilled after resolution', async () => {
    const p = promise.createQueryable(Promise.resolve(42))
    await p
    expect(p.isPending()).toBe(false)
    expect(p.isFulfilled()).toBe(true)
    expect(p.isRejected()).toBe(false)
    expect(p.getStatus()).toBe('fulfilled')
  })

  it('resolves with the correct value', async () => {
    const p = promise.createQueryable(Promise.resolve(42))
    expect(await p).toBe(42)
  })

  it('is rejected after rejection', async () => {
    const p = promise.createQueryable(Promise.reject(new Error('oops')))
    await p.catch(() => {})
    expect(p.isPending()).toBe(false)
    expect(p.isFulfilled()).toBe(false)
    expect(p.isRejected()).toBe(true)
    expect(p.getStatus()).toBe('rejected')
  })

  it('rejects with the correct error', async () => {
    const p = promise.createQueryable(Promise.reject(new Error('oops')))
    await expect(p).rejects.toThrow('oops')
  })

  it('returns the same promise if already queryable', () => {
    const p = promise.createQueryable(Promise.resolve(42))
    const p2 = promise.createQueryable(p)
    expect(p2).toBe(p)
  })

  it('does not expose the queryable marker in enumerable properties', () => {
    const p = promise.createQueryable(Promise.resolve(42))
    const keys = Object.keys(p)
    expect(keys).not.toContain(expect.stringContaining('queryable'))
  })

  it('can be awaited directly without .promise', async () => {
    const p = promise.createQueryable(Promise.resolve('direct'))
    const result = await p
    expect(result).toBe('direct')
  })
})
