import { describe, it, expect } from 'vitest'
import { apply } from '../src/apply.js'

describe('apply.mapping', () => {
  describe('basic renaming', () => {
    it('renames a top-level key', () => {
      expect(apply.mapping([{ a: 1 }], { a: 'b' })[0]).toEqual({ b: 1 })
    })

    it('renames multiple keys in one pass', () => {
      expect(apply.mapping([{ a: 1, b: 2 }], { a: 'x', b: 'y' })[0]).toEqual({ x: 1, y: 2 })
    })

    it('removes the source key by default', () => {
      expect(apply.mapping([{ a: 1 }], { a: 'b' })[0]).not.toHaveProperty('a')
    })

    it('preserves unmapped properties', () => {
      expect(apply.mapping([{ a: 1, c: 3 }], { a: 'b' })[0]).toHaveProperty('c', 3)
    })

    it('skips objects that do not have the source path', () => {
      const result = apply.mapping([{ a: 1 }, { b: 2 }], { a: 'x' })
      expect(result[1]).not.toHaveProperty('x')
      expect(result[1]).toHaveProperty('b', 2)
    })

    it('preserves null values', () => {
      expect(apply.mapping([{ a: null }], { a: 'b' })[0].b).toBeNull()
    })

    it('preserves false values', () => {
      expect(apply.mapping([{ a: false }], { a: 'b' })[0].b).toBe(false)
    })

    it('preserves zero values', () => {
      expect(apply.mapping([{ a: 0 }], { a: 'b' })[0].b).toBe(0)
    })

    it('mutates and returns the original array', () => {
      const array = [{ a: 1 }]
      expect(apply.mapping(array, { a: 'b' })).toBe(array)
    })

    it('applies mapping to every object in the array', () => {
      const result = apply.mapping([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'b' })
      expect(result.every(o => !('a' in o) && 'b' in o)).toBe(true)
    })
  })

  describe('nested paths', () => {
    it('reads from a nested source path', () => {
      expect(apply.mapping([{ nested: { value: 42 } }], { 'nested.value': 'flat' })[0].flat).toBe(42)
    })

    it('writes to a nested output path', () => {
      expect(apply.mapping([{ value: 42 }], { value: 'nested.value' })[0].nested.value).toBe(42)
    })

    it('reads from a deeply nested path', () => {
      expect(apply.mapping([{ a: { b: { c: 99 } } }], { 'a.b.c': 'flat' })[0].flat).toBe(99)
    })
  })

  describe('delete option', () => {
    it('keeps the source key when delete is false', () => {
      const result = apply.mapping([{ a: 1 }], { a: { path: 'b', delete: false } })[0]
      expect(result).toHaveProperty('a', 1)
      expect(result).toHaveProperty('b', 1)
    })

    it('removes the source key when delete is true (explicit)', () => {
      const result = apply.mapping([{ a: 1 }], { a: { path: 'b', delete: true } })[0]
      expect(result).not.toHaveProperty('a')
      expect(result).toHaveProperty('b', 1)
    })

    it('removes the source key when delete is omitted', () => {
      expect(apply.mapping([{ a: 1 }], { a: { path: 'b' } })[0]).not.toHaveProperty('a')
    })
  })

  describe('value mapping', () => {
    it('maps a numeric value to a string', () => {
      const result = apply.mapping([{ status: 1 }], { status: { path: 'label', values: { 1: 'active', 0: 'inactive' } } })
      expect(result[0].label).toBe('active')
    })

    it('maps a string to another string on the same path', () => {
      const result = apply.mapping([{ color: 'red' }], { color: { path: 'color', values: { red: '#FF0000', blue: '#0000FF' } } })
      expect(result[0].color).toBe('#FF0000')
    })

    it('maps a string to another string on a different path', () => {
      const result = apply.mapping([{ color: 'red' }], { color: { path: 'hex', values: { red: '#FF0000', blue: '#0000FF' } } })
      expect(result[0].hex).toBe('#FF0000')
    })

    it('returns undefined for a value not in the map', () => {
      const result = apply.mapping([{ status: 99 }], { status: { path: 'label', values: { 0: 'inactive' } } })
      expect(result[0].label).toBeUndefined()
    })
  })

  describe('assertions', () => {
    it('throws when array is not an array', () => {
      expect(() => apply.mapping({ a: 1 }, { a: 'b' })).toThrow()
    })

    it('throws when array is null', () => {
      expect(() => apply.mapping(null, { a: 'b' })).toThrow()
    })

    it('throws when mapping is not a plain object', () => {
      expect(() => apply.mapping([{ a: 1 }], 'invalid')).toThrow()
    })

    it('throws when mapping is null', () => {
      expect(() => apply.mapping([{ a: 1 }], null)).toThrow()
    })
  })
})

describe('apply.modifier', () => {
  describe('pick', () => {
    it('keeps only the listed properties', () => {
      expect(apply.modifier([{ a: 1, b: 2, c: 3 }], { pick: ['a', 'c'] })[0]).toEqual({ a: 1, c: 3 })
    })

    it('ignores pick keys absent from the object', () => {
      expect(apply.modifier([{ a: 1 }], { pick: ['a', 'z'] })[0]).toEqual({ a: 1 })
    })

    it('returns an empty object when no keys match', () => {
      expect(apply.modifier([{ a: 1 }], { pick: ['z'] })[0]).toEqual({})
    })

    it('applies pick to every object in the array', () => {
      expect(apply.modifier([{ a: 1, b: 9 }, { a: 2, b: 8 }], { pick: ['a'] })).toEqual([{ a: 1 }, { a: 2 }])
    })
  })

  describe('omit', () => {
    it('removes the listed properties', () => {
      expect(apply.modifier([{ a: 1, b: 2, c: 3 }], { omit: ['b'] })[0]).toEqual({ a: 1, c: 3 })
    })

    it('removes multiple properties in one pass', () => {
      expect(apply.modifier([{ a: 1, b: 2, c: 3 }], { omit: ['a', 'c'] })[0]).toEqual({ b: 2 })
    })

    it('does not throw when an omit key is not in the object', () => {
      expect(apply.modifier([{ a: 1 }], { omit: ['z'] })[0]).toEqual({ a: 1 })
    })

    it('applies omit to every object in the array', () => {
      expect(apply.modifier([{ a: 1, b: 9 }, { a: 2, b: 8 }], { omit: ['b'] })).toEqual([{ a: 1 }, { a: 2 }])
    })
  })

  describe('merge', () => {
    it('adds missing properties', () => {
      expect(apply.modifier([{ a: 1 }], { merge: { b: 2 } })[0]).toEqual({ a: 1, b: 2 })
    })

    it('overwrites existing properties', () => {
      expect(apply.modifier([{ a: 1 }], { merge: { a: 99 } })[0].a).toBe(99)
    })

    it('deep-merges nested objects', () => {
      expect(apply.modifier([{ a: { x: 1 } }], { merge: { a: { y: 2 } } })[0].a).toEqual({ x: 1, y: 2 })
    })

    it('applies merge to every object in the array', () => {
      const result = apply.modifier([{ a: 1 }, { a: 2 }], { merge: { source: 'api' } })
      expect(result.every(o => o.source === 'api')).toBe(true)
    })

    it('mutates the objects in place', () => {
      const obj = { a: 1 }
      apply.modifier([obj], { merge: { b: 2 } })
      expect(obj).toHaveProperty('b', 2)
    })
  })

  describe('mutation', () => {
    it('mutates and returns the original array', () => {
      const array = [{ a: 1, b: 2 }]
      expect(apply.modifier(array, { pick: ['a'] })).toBe(array)
    })

    it('pick creates a new object reference at each index', () => {
      const original = { a: 1, b: 2 }
      const array = [original]
      apply.modifier(array, { pick: ['a'] })
      expect(array[0]).not.toBe(original)
    })

    it('omit creates a new object reference at each index', () => {
      const original = { a: 1, b: 2 }
      const array = [original]
      apply.modifier(array, { omit: ['b'] })
      expect(array[0]).not.toBe(original)
    })

    it('merge keeps the same object reference', () => {
      const original = { a: 1 }
      const array = [original]
      apply.modifier(array, { merge: { b: 2 } })
      expect(array[0]).toBe(original)
    })
  })

  describe('combined', () => {
    it('applies pick then omit then merge in order', () => {
      const result = apply.modifier(
        [{ a: 1, b: 2, c: 3 }],
        { pick: ['a', 'b'], omit: ['b'], merge: { z: 99 } }
      )
      expect(result[0]).toEqual({ a: 1, z: 99 })
    })
  })

  describe('assertions', () => {
    it('throws when array is not an array', () => {
      expect(() => apply.modifier({ a: 1 }, { pick: ['a'] })).toThrow()
    })

    it('throws when array is null', () => {
      expect(() => apply.modifier(null, { pick: ['a'] })).toThrow()
    })

    it('throws when modifier is not a plain object', () => {
      expect(() => apply.modifier([{ a: 1 }], 'invalid')).toThrow()
    })

    it('throws when modifier is null', () => {
      expect(() => apply.modifier([{ a: 1 }], null)).toThrow()
    })
  })
})
