import { describe, it, expect } from 'vitest'
import { deepFreeze } from '../../src/core/utils.js'

describe('deepFreeze', () => {
  it('freezes a flat object', () => {
    const obj = { a: 1, b: 2 }
    deepFreeze(obj)
    expect(() => { obj.a = 99 }).toThrow()
  })

  it('freezes nested objects', () => {
    const obj = { a: { b: { c: 1 } } }
    deepFreeze(obj)
    expect(() => { obj.a.b.c = 99 }).toThrow()
  })

  it('freezes arrays inside objects', () => {
    const obj = { items: [1, 2, 3] }
    deepFreeze(obj)
    expect(() => { obj.items.push(4) }).toThrow()
  })

  it('freezes objects inside arrays', () => {
    const obj = { items: [{ x: 1 }] }
    deepFreeze(obj)
    expect(() => { obj.items[0].x = 99 }).toThrow()
  })

  it('returns the frozen object', () => {
    const obj = { a: 1 }
    const result = deepFreeze(obj)
    expect(result).toBe(obj)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('does not re-freeze already frozen nested objects', () => {
    const inner = Object.freeze({ x: 1 })
    const obj = { inner }
    deepFreeze(obj)
    expect(Object.isFrozen(obj.inner)).toBe(true)
  })

  it('throws if argument is not a plain object', () => {
    expect(() => deepFreeze('foo')).toThrow()
    expect(() => deepFreeze(42)).toThrow()
    expect(() => deepFreeze(null)).toThrow()
  })
})
