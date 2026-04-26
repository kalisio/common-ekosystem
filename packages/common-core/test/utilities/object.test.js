import { describe, it, expect } from 'vitest'
import { object } from '../../src/utilities'

describe('object', () => {
  describe('clone', () => {
    it('should throw if obj is undefined', () => {
      expect(() => object.clone(undefined)).toThrow('obj must be defined')
    })

    it('should throw if obj is null', () => {
      expect(() => object.clone(null)).toThrow('obj must be defined')
    })

    it('should return a deep clone', () => {
      const original = { a: 1, b: { c: 2 } }
      const cloned = object.clone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
    })

    it('should clone arrays', () => {
      const original = [1, 2, [3, 4]]
      const cloned = object.clone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
    })

    it('should not share references', () => {
      const original = { a: { b: 1 } }
      const cloned = object.clone(original)
      cloned.a.b = 99
      expect(original.a.b).toBe(1)
    })
  })

  describe('normalize', () => {
    it('should throw if obj is undefined', () => {
      expect(() => object.normalize(undefined)).toThrow('obj must be defined')
    })

    it('should throw if obj is null', () => {
      expect(() => object.normalize(null)).toThrow('obj must be defined')
    })

    describe('plain objects', () => {
      it('should sort keys alphabetically', () => {
        const result = object.normalize({ c: 3, a: 1, b: 2 })
        expect(Object.keys(result)).toEqual(['a', 'b', 'c'])
      })

      it('should sort keys of nested objects', () => {
        const result = object.normalize({ b: { d: 4, c: 3 }, a: 1 })
        expect(Object.keys(result.b)).toEqual(['c', 'd'])
      })

      it('should filter ignored keys', () => {
        const result = object.normalize(
          { a: 1, b: 2, c: 3 },
          { ignoredKeys: ['b'] }
        )
        expect(result).not.toHaveProperty('b')
        expect(result).toHaveProperty('a')
        expect(result).toHaveProperty('c')
      })

      it('should filter ignored keys recursively', () => {
        const result = object.normalize(
          { a: { b: 1, c: 2 } },
          { ignoredKeys: ['b'] }
        )
        expect(result.a).not.toHaveProperty('b')
        expect(result.a).toHaveProperty('c')
      })
    })

    describe('arrays', () => {
      it('should sort array elements', () => {
        const result = object.normalize({ a: [3, 1, 2] })
        expect(result.a).toEqual([1, 2, 3])
      })

      it('should normalize array elements recursively', () => {
        const result = object.normalize({
          a: [{ b: 2, a: 1 }, { d: 4, c: 3 }]
        })
        expect(Object.keys(result.a[0])).toEqual(['a', 'b'])
        expect(Object.keys(result.a[1])).toEqual(['c', 'd'])
      })

      it('should handle nested undefined values in array', () => {
        const result = object.normalize({ a: [1, undefined, 3] })
        expect(result.a).toContain(undefined)
      })
    })

    describe('strings', () => {
      it('should normalize strings with ignoreCase', () => {
        const result = object.normalize({ a: 'Hello' }, { ignoreCase: true })
        expect(result.a).toBe('hello')
      })

      it('should normalize strings with ignoreDiacritics', () => {
        const result = object.normalize({ a: 'éàü' }, { ignoreDiacritics: true })
        expect(result.a).toBe('eau')
      })

      it('should normalize strings with ignoreSpaces', () => {
        const result = object.normalize({ a: 'hello   world' }, { ignoreSpaces: true })
        expect(result.a).toBe('hello world')
      })

      it('should normalize strings recursively inside nested objects', () => {
        const result = object.normalize({ a: { b: 'Héllo' } }, { ignoreCase: true, ignoreDiacritics: true })
        expect(result.a.b).toBe('hello')
      })

      it('should normalize strings inside arrays', () => {
        const result = object.normalize({ a: ['Héllo', 'Wörld'] }, { ignoreDiacritics: true, ignoreCase: true })
        expect(result.a).toContain('hello')
        expect(result.a).toContain('world')
      })
    })

    describe('primitives', () => {
      it('should return numbers as-is', () => {
        expect(object.normalize({ a: 42 }).a).toBe(42)
      })

      it('should return booleans as-is', () => {
        expect(object.normalize({ a: false }).a).toBe(false)
      })

      it('should return nested null as-is', () => {
        expect(object.normalize({ a: null }).a).toBeNull()
      })

      it('should return nested undefined as-is', () => {
        expect(object.normalize({ a: undefined }).a).toBeUndefined()
      })
    })
  })
})
