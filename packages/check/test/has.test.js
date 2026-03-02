import { describe, it, expect } from 'vitest'
import { has } from '../src/has.js'

describe('has.key', () => {
  it('should return true if object has the key', () => {
    const obj = { a: 1, b: 2 }
    expect(has.key(obj, 'a')).toBe(true)
    expect(has.key(obj, 'b')).toBe(true)
  })

  it('should return false if object does not have the key', () => {
    const obj = { a: 1 }
    expect(has.key(obj, 'b')).toBe(false)
    expect(has.key(obj, 'c')).toBe(false)
  })

  it('should throw if obj is not an object', () => {
    expect(() => has.key(null, 'a')).toThrow('obj must be an object')
    expect(() => has.key(123, 'a')).toThrow('obj must be an object')
  })

  it('should throw if key is not a string', () => {
    expect(() => has.key({ a: 1 }, null)).toThrow('key must be a string')
    expect(() => has.key({ a: 1 }, 123)).toThrow('key must be a string')
  })
})

describe('has.keys', () => {
  it('should return true if object has all keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(has.keys(obj, ['a', 'b'])).toBe(true)
    expect(has.keys(obj, ['a', 'b', 'c'])).toBe(true)
  })

  it('should return false if object is missing any key', () => {
    const obj = { a: 1, b: 2 }
    expect(has.keys(obj, ['a', 'b', 'c'])).toBe(false)
    expect(has.keys(obj, ['c'])).toBe(false)
  })

  it('should throw if obj is not an object', () => {
    expect(() => has.keys(null, ['a'])).toThrow('obj must be an object')
    expect(() => has.keys(123, ['a'])).toThrow('obj must be an object')
  })

  it('should throw if keys is not a non-empty array of strings', () => {
    const obj = { a: 1 }
    expect(() => has.keys(obj, [])).toThrow('keys must be an array of strings')
    expect(() => has.keys(obj, [123])).toThrow('keys must be an array of strings')
    expect(() => has.keys(obj, 'a')).toThrow('keys must be an array of strings')
  })
})

describe('has.keyWithValue', () => {
  it('should return true if object has the key and value is defined', () => {
    const obj = { a: 1, b: null, c: undefined }
    expect(has.keyWithValue(obj, 'a')).toBe(true)
  })

  it('should return false if key exists but value is null or undefined', () => {
    const obj = { a: 1, b: null, c: undefined }
    expect(has.keyWithValue(obj, 'b')).toBe(false)
    expect(has.keyWithValue(obj, 'c')).toBe(false)
  })

  it('should return false if key does not exist', () => {
    const obj = { a: 1 }
    expect(has.keyWithValue(obj, 'b')).toBe(false)
  })

  it('should throw if obj is not an object', () => {
    expect(() => has.keyWithValue(null, 'a')).toThrow('obj must be an object')
  })

  it('should throw if key is not a string', () => {
    expect(() => has.keyWithValue({ a: 1 }, 123)).toThrow('key must be a string')
  })
})
