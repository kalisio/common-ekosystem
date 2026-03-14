import { describe, it, expect } from 'vitest'
import { optional } from './../src/optional.js'
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

  it('should validate the value when present', () => {
    const validator = optional(is.string)
    expect(validator('hello')).toBe(true)
    expect(validator(42)).toBe(false)
  })
})
