import { describe, it, expect } from 'vitest'
import { has } from '../../src/predicates/index.js'

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
    expect(() => has.key({ a: 1 }, null)).toThrow('key must be a non empty string')
    expect(() => has.key({ a: 1 }, 123)).toThrow('key must be a non empty string')
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

  it('should throw if keys is not a non-empty array of non empty strings', () => {
    const obj = { a: 1 }
    expect(() => has.keys(obj, [])).toThrow('keys must be an array of non empty strings')
    expect(() => has.keys(obj, [123])).toThrow('keys must be an array of non empty strings')
    expect(() => has.keys(obj, 'a')).toThrow('keys must be an array of non empty strings')
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
    expect(() => has.keyWithValue({ a: 1 }, 123)).toThrow('key must be a non empty string')
  })
})

describe('has.path', () => {
  it('retourne true pour un chemin simple existant', () => {
    expect(has.path({ a: 1 }, 'a')).toBe(true)
  })

  it('retourne true pour un chemin imbriqué existant', () => {
    expect(has.path({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(true)
  })

  it('retourne true si la valeur est null', () => {
    expect(has.path({ a: { b: null } }, 'a.b')).toBe(true)
  })

  it('retourne true si la valeur est undefined', () => {
    expect(has.path({ a: { b: undefined } }, 'a.b')).toBe(true)
  })

  it('retourne true si la valeur est false', () => {
    expect(has.path({ a: false }, 'a')).toBe(true)
  })

  it('retourne true si la valeur est 0', () => {
    expect(has.path({ a: 0 }, 'a')).toBe(true)
  })

  it('retourne false pour un chemin inexistant', () => {
    expect(has.path({ a: 1 }, 'b')).toBe(false)
  })

  it('retourne false pour un chemin imbriqué inexistant', () => {
    expect(has.path({ a: { b: 1 } }, 'a.b.c')).toBe(false)
  })

  it('retourne false si un segment intermédiaire est null', () => {
    expect(has.path({ a: null }, 'a.b')).toBe(false)
  })

  it('lève une erreur si obj n\'est pas un objet', () => {
    expect(() => has.path('string', 'a')).toThrow()
  })

  it('lève une erreur si path est une string vide', () => {
    expect(() => has.path({ a: 1 }, '')).toThrow()
  })
})
