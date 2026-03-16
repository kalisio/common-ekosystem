import { describe, it, expect } from 'vitest'
import { optional } from '../src/optional.js'
import { is } from '../src/is.js'

describe('optional', () => {
  it('should throw if validator is not a function', () => {
    expect(() => optional(null)).toThrow()
    expect(() => optional('string')).toThrow()
    expect(() => optional(42)).toThrow()
  })

  it('should return a function', () => {
    expect(typeof optional(is.string)).toBe('function')
  })

  it('should mark the returned validator as optional', () => {
    expect(optional(is.string)._optional).toBe(true)
  })

  it('should return true if value is null', () => {
    expect(optional(is.string)(null)).toBe(true)
  })

  it('should return true if value is undefined', () => {
    expect(optional(is.string)(undefined)).toBe(true)
  })

  it('should validate the value when present and valid', () => {
    expect(optional(is.string)('hello')).toBe(true)
  })

  it('should validate the value when present and invalid', () => {
    expect(optional(is.string)(42)).toBe(false)
  })
})
