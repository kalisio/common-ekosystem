import { describe, it, expect } from 'vitest'
import { matches } from '../src/matches.js'

describe('matches.pattern', () => {
  it('should return true when string matches the pattern', () => {
    expect(matches.pattern('hello123', /\d+/)).toBe(true)
    expect(matches.pattern('abc', /^[a-z]+$/)).toBe(true)
  })

  it('should return false when string does not match the pattern', () => {
    expect(matches.pattern('hello', /\d+/)).toBe(false)
    expect(matches.pattern('123', /^[a-z]+$/)).toBe(false)
  })

  it('should throw if value is not a string', () => {
    expect(() => matches.pattern(123, /\d+/)).toThrow()
    expect(() => matches.pattern(null, /\d+/)).toThrow()
  })

  it('should throw if pattern is not a RegExp', () => {
    expect(() => matches.pattern('hello', 'abc')).toThrow()
    expect(() => matches.pattern('hello', 123)).toThrow()
    expect(() => matches.pattern('hello', null)).toThrow()
  })
})
