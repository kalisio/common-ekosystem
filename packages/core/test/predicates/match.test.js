import { describe, it, expect } from 'vitest'
import { match } from '../../src/predicates'

describe('match.pattern', () => {
  it('should return true when string match the pattern', () => {
    expect(match.pattern('hello123', /\d+/)).toBe(true)
    expect(match.pattern('abc', /^[a-z]+$/)).toBe(true)
  })

  it('should return false when string does not match the pattern', () => {
    expect(match.pattern('hello', /\d+/)).toBe(false)
    expect(match.pattern('123', /^[a-z]+$/)).toBe(false)
  })

  it('should throw if value is not a string', () => {
    expect(() => match.pattern(123, /\d+/)).toThrow()
    expect(() => match.pattern(null, /\d+/)).toThrow()
  })

  it('should throw if pattern is not a RegExp', () => {
    expect(() => match.pattern('hello', 'abc')).toThrow()
    expect(() => match.pattern('hello', 123)).toThrow()
    expect(() => match.pattern('hello', null)).toThrow()
  })
})
