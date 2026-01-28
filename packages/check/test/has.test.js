import { describe, it, expect } from 'vitest'
import { has } from '../src/has.js'

describe('has.key', () => {
  it('should return true if object has the key', () => {
    expect(has.key({ a: 1 }, 'a')).toBe(true)
    expect(has.key({ name: 'John', age: 30 }, 'name')).toBe(true)
    expect(has.key({ name: 'John', age: 30 }, 'age')).toBe(true)
  })

  it('should return true even if value is undefined or null', () => {
    expect(has.key({ a: undefined }, 'a')).toBe(true)
    expect(has.key({ a: null }, 'a')).toBe(true)
    expect(has.key({ a: 0 }, 'a')).toBe(true)
    expect(has.key({ a: false }, 'a')).toBe(true)
    expect(has.key({ a: '' }, 'a')).toBe(true)
  })

  it('should return false if object does not have the key', () => {
    expect(has.key({ a: 1 }, 'b')).toBe(false)
    expect(has.key({}, 'a')).toBe(false)
  })

  it('should return false for non-plain objects', () => {
    expect(has.key(null, 'a')).toBe(false)
    expect(has.key(undefined, 'a')).toBe(false)
    expect(has.key([], 'length')).toBe(false)
    expect(has.key('string', 'length')).toBe(false)
    expect(has.key(123, 'toString')).toBe(false)
  })

  it('should return false for class instances', () => {
    class MyClass {
      constructor () {
        this.prop = 'value'
      }
    }
    expect(has.key(new MyClass(), 'prop')).toBe(false)
  })

  it('should return false for Date objects', () => {
    expect(has.key(new Date(), 'getTime')).toBe(false)
  })

  it('should handle numeric keys', () => {
    expect(has.key({ 0: 'a', 1: 'b' }, '0')).toBe(true)
    expect(has.key({ 0: 'a', 1: 'b' }, '2')).toBe(false)
  })

  it('should handle keys with special characters', () => {
    expect(has.key({ 'my-key': 1 }, 'my-key')).toBe(true)
    expect(has.key({ 'key.name': 1 }, 'key.name')).toBe(true)
    expect(has.key({ 'key name': 1 }, 'key name')).toBe(true)
  })

  it('should handle Symbol keys', () => {
    const sym = Symbol('test')
    expect(has.key({ [sym]: 'value' }, sym)).toBe(true)
    expect(has.key({}, sym)).toBe(false)
  })
})

describe('has.keys', () => {
  it('should return true if object has all keys', () => {
    expect(has.keys({ a: 1, b: 2 }, ['a', 'b'])).toBe(true)
    expect(has.keys({ a: 1, b: 2, c: 3 }, ['a', 'b'])).toBe(true)
    expect(has.keys({ name: 'John', age: 30 }, ['name', 'age'])).toBe(true)
  })

  it('should return true even if values are undefined or null', () => {
    expect(has.keys({ a: undefined, b: null }, ['a', 'b'])).toBe(true)
    expect(has.keys({ a: 0, b: false, c: '' }, ['a', 'b', 'c'])).toBe(true)
  })

  it('should return false if object is missing any key', () => {
    expect(has.keys({ a: 1 }, ['a', 'b'])).toBe(false)
    expect(has.keys({}, ['a'])).toBe(false)
    expect(has.keys({ a: 1, b: 2 }, ['a', 'b', 'c'])).toBe(false)
  })

  it('should return true for empty keys array', () => {
    expect(has.keys({}, [])).toBe(true)
    expect(has.keys({ a: 1 }, [])).toBe(true)
  })

  it('should return false for non-plain objects', () => {
    expect(has.keys(null, ['a'])).toBe(false)
    expect(has.keys(undefined, ['a'])).toBe(false)
    expect(has.keys([], ['length'])).toBe(false)
    expect(has.keys('string', ['length'])).toBe(false)
  })

  it('should return false for arrays even if they have the keys', () => {
    expect(has.keys([1, 2, 3], ['0', '1'])).toBe(false)
    expect(has.keys([1, 2, 3], ['length'])).toBe(false)
  })

  it('should return false for class instances', () => {
    class MyClass {
      constructor () {
        this.a = 1
        this.b = 2
      }
    }
    expect(has.keys(new MyClass(), ['a', 'b'])).toBe(false)
  })

  it('should work with single key', () => {
    expect(has.keys({ name: 'John' }, ['name'])).toBe(true)
    expect(has.keys({ name: 'John' }, ['age'])).toBe(false)
  })

  it('should work with many keys', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 }
    expect(has.keys(obj, ['a', 'b', 'c', 'd', 'e'])).toBe(true)
    expect(has.keys(obj, ['a', 'b', 'c', 'd', 'e', 'f'])).toBe(false)
  })

  it('should handle numeric keys', () => {
    expect(has.keys({ 0: 'a', 1: 'b', 2: 'c' }, ['0', '1', '2'])).toBe(true)
    expect(has.keys({ 0: 'a', 1: 'b' }, ['0', '2'])).toBe(false)
  })

  it('should handle keys with special characters', () => {
    const obj = { 'my-key': 1, 'key.name': 2, 'key name': 3 }
    expect(has.keys(obj, ['my-key', 'key.name', 'key name'])).toBe(true)
  })

  it('should handle Symbol keys', () => {
    const sym1 = Symbol('a')
    const sym2 = Symbol('b')
    expect(has.keys({ [sym1]: 1, [sym2]: 2 }, [sym1, sym2])).toBe(true)
    expect(has.keys({ [sym1]: 1 }, [sym1, sym2])).toBe(false)
  })
})

describe('has.keyWithValue', () => {
  it('should return true if key exists and value is defined', () => {
    expect(has.keyWithValue({ a: 1 }, 'a')).toBe(true)
    expect(has.keyWithValue({ name: 'John' }, 'name')).toBe(true)
    expect(has.keyWithValue({ count: 0 }, 'count')).toBe(true)
    expect(has.keyWithValue({ flag: false }, 'flag')).toBe(true)
    expect(has.keyWithValue({ text: '' }, 'text')).toBe(true)
  })

  it('should return false if key exists but value is null or undefined', () => {
    expect(has.keyWithValue({ a: null }, 'a')).toBe(false)
    expect(has.keyWithValue({ a: undefined }, 'a')).toBe(false)
  })

  it('should return false if key does not exist', () => {
    expect(has.keyWithValue({ a: 1 }, 'b')).toBe(false)
    expect(has.keyWithValue({}, 'a')).toBe(false)
  })

  it('should return false for non-plain objects', () => {
    expect(has.keyWithValue(null, 'a')).toBe(false)
    expect(has.keyWithValue(undefined, 'a')).toBe(false)
    expect(has.keyWithValue([], '0')).toBe(false)
    expect(has.keyWithValue('string', 'length')).toBe(false)
  })

  it('should handle numeric keys', () => {
    expect(has.keyWithValue({ 0: 'a' }, '0')).toBe(true)
    expect(has.keyWithValue({ 0: null }, '0')).toBe(false)
  })

  it('should handle keys with special characters', () => {
    expect(has.keyWithValue({ 'my-key': 1 }, 'my-key')).toBe(true)
    expect(has.keyWithValue({ 'my-key': null }, 'my-key')).toBe(false)
  })

  it('should handle Symbol keys', () => {
    const sym = Symbol('test')
    expect(has.keyWithValue({ [sym]: 'value' }, sym)).toBe(true)
    expect(has.keyWithValue({ [sym]: null }, sym)).toBe(false)
  })

  it('should differentiate between missing key and null/undefined value', () => {
    const obj = { a: 1, b: null, c: undefined }
    expect(has.keyWithValue(obj, 'a')).toBe(true)
    expect(has.keyWithValue(obj, 'b')).toBe(false)
    expect(has.keyWithValue(obj, 'c')).toBe(false)
    expect(has.keyWithValue(obj, 'd')).toBe(false)
  })

  it('should work with nested objects as values', () => {
    expect(has.keyWithValue({ obj: {} }, 'obj')).toBe(true)
    expect(has.keyWithValue({ arr: [] }, 'arr')).toBe(true)
  })
})
