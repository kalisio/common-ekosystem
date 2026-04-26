import { describe, it, expect } from 'vitest'
import { compare } from '../../src/operators'

describe('compare', () => {
  describe('validation', () => {
    it('should throw if obj1 is not a plain object or array', () => {
      expect(() => compare(null, {})).toThrow('obj1 should be an object or an array')
      expect(() => compare('str', {})).toThrow('obj1 should be an object or an array')
      expect(() => compare(42, {})).toThrow('obj1 should be an object or an array')
    })

    it('should throw if obj2 is not a plain object or array', () => {
      expect(() => compare({}, null)).toThrow('obj2 should be an object or an array')
      expect(() => compare({}, 'str')).toThrow('obj2 should be an object or an array')
      expect(() => compare({}, 42)).toThrow('obj2 should be an object or an array')
    })
  })

  describe('objects', () => {
    describe('isEqual', () => {
      it('should return true for identical objects', () => {
        expect(compare({ a: 1, b: 2 }, { a: 1, b: 2 }).isEqual).toBe(true)
      })

      it('should return true regardless of key order', () => {
        expect(compare({ a: 1, b: 2 }, { b: 2, a: 1 }).isEqual).toBe(true)
      })

      it('should return true for nested objects', () => {
        expect(compare({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }).isEqual).toBe(true)
      })

      it('should return true for arrays with same elements in different order', () => {
        expect(compare({ a: [3, 1, 2] }, { a: [1, 2, 3] }).isEqual).toBe(true)
      })

      it('should return false for different values', () => {
        expect(compare({ a: 1 }, { a: 2 }).isEqual).toBe(false)
      })
    })

    describe('differences', () => {
      it('should return empty differences when equal', () => {
        const result = compare({ a: 1 }, { a: 1 })
        expect(result.differences).toEqual({ missing: [], extra: [], updated: [] })
      })

      it('should detect missing keys', () => {
        const result = compare({ a: 1, b: 2 }, { a: 1 })
        expect(result.differences.missing).toContain('b')
      })

      it('should detect extra keys', () => {
        const result = compare({ a: 1 }, { a: 1, b: 2 })
        expect(result.differences.extra).toContain('b')
      })

      it('should detect updated values', () => {
        const result = compare({ a: 1 }, { a: 2 })
        expect(result.differences.updated).toContainEqual({ path: 'a', oldValue: 1, newValue: 2 })
      })

      it('should detect nested missing keys', () => {
        const result = compare({ a: { b: 1, c: 2 } }, { a: { b: 1 } })
        expect(result.differences.missing).toContain('a.c')
      })

      it('should detect nested updated values', () => {
        const result = compare({ a: { b: 1 } }, { a: { b: 2 } })
        expect(result.differences.updated).toContainEqual({ path: 'a.b', oldValue: 1, newValue: 2 })
      })

      it('should detect differences in nested arrays', () => {
        const result = compare({ a: [1, 2, 3] }, { a: [1, 2, 99] })
        expect(result.differences.updated).toContainEqual({ path: 'a[2]', oldValue: 3, newValue: 99 })
      })

      it('should detect multiple differences at once', () => {
        const result = compare(
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 99, d: 4 }
        )
        expect(result.differences.missing).toContain('c')
        expect(result.differences.extra).toContain('d')
        expect(result.differences.updated).toContainEqual({ path: 'b', oldValue: 2, newValue: 99 })
      })
    })
  })

  describe('arrays', () => {
    describe('isEqual', () => {
      it('should return true for identical arrays', () => {
        expect(compare([1, 2, 3], [1, 2, 3]).isEqual).toBe(true)
      })

      it('should return true for arrays with same elements in different order', () => {
        expect(compare([3, 1, 2], [1, 2, 3]).isEqual).toBe(true)
      })

      it('should return false for different arrays', () => {
        expect(compare([1, 2, 3], [1, 2, 99]).isEqual).toBe(false)
      })
    })

    describe('differences', () => {
      it('should return empty differences when equal', () => {
        const result = compare([1, 2, 3], [1, 2, 3])
        expect(result.differences).toEqual({ missing: [], extra: [], updated: [] })
      })

      it('should detect missing elements', () => {
        const result = compare([1, 2, 3], [1, 2])
        expect(result.differences.missing).toContain('[2]')
      })

      it('should detect extra elements', () => {
        const result = compare([1, 2], [1, 2, 3])
        expect(result.differences.extra).toContain('[2]')
      })

      it('should detect updated elements', () => {
        const result = compare([1, 2, 3], [1, 2, 99])
        expect(result.differences.updated).toContainEqual({ path: '[2]', oldValue: 3, newValue: 99 })
      })

      it('should detect differences in nested objects inside arrays', () => {
        const result = compare(
          [{ a: 1 }, { b: 2 }],
          [{ a: 99 }, { b: 2 }]
        )
        expect(result.differences.updated).toContainEqual({ path: '[0].a', oldValue: 1, newValue: 99 })
      })

      it('should detect extra objects in array', () => {
        const result = compare(
          [{ a: 1 }],
          [{ a: 1 }, { b: 2 }]
        )
        expect(result.differences.extra).toContain('[1]')
      })

      it('should detect differences in nested arrays', () => {
        const result = compare(
          [[1, 2], [3, 4]],
          [[1, 2], [3, 99]]
        )
        expect(result.differences.updated).toContainEqual({ path: '[1][1]', oldValue: 4, newValue: 99 })
      })
    })
  })

  describe('options', () => {
    it('should ignore specified keys', () => {
      const result = compare({ a: 1, b: 'foo' }, { a: 1, b: 'bar' }, { ignoredKeys: ['b'] })
      expect(result.isEqual).toBe(true)
    })

    it('should ignore case when ignoreCase is true', () => {
      const result = compare({ a: 'Hello' }, { a: 'hello' }, { ignoreCase: true })
      expect(result.isEqual).toBe(true)
    })

    it('should ignore diacritics when ignoreDiacritics is true', () => {
      const result = compare({ a: 'éàü' }, { a: 'eau' }, { ignoreDiacritics: true })
      expect(result.isEqual).toBe(true)
    })

    it('should ignore spaces when ignoreSpaces is true', () => {
      const result = compare({ a: 'hello   world' }, { a: 'hello world' }, { ignoreSpaces: true })
      expect(result.isEqual).toBe(true)
    })

    it('should combine multiple options', () => {
      const result = compare(
        { a: '  Héllo  ' },
        { a: 'hello' },
        { ignoreCase: true, ignoreDiacritics: true, ignoreSpaces: true }
      )
      expect(result.isEqual).toBe(true)
    })

    it('should apply options to strings inside arrays', () => {
      const result = compare(
        [{ a: 'Héllo' }],
        [{ a: 'hello' }],
        { ignoreCase: true, ignoreDiacritics: true }
      )
      expect(result.isEqual).toBe(true)
    })
  })
})
