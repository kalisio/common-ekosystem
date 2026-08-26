import { describe, it, expect } from 'vitest'
import { transform } from '../../src/operators'

describe('transform', () => {
  describe('toArray', () => {
    it('converts a plain object to an array of its values', () => {
      const result = transform({ a: 1, b: 2 }, { toArray: true })
      expect(result).toEqual([1, 2])
    })

    it('converts an empty object to an empty array', () => {
      expect(transform({}, { toArray: true })).toEqual([])
    })
  })

  describe('toObjects', () => {
    it('converts an array of arrays into an array of objects', () => {
      const result = transform([[1, 'Alice'], [2, 'Bob']], { toObjects: ['id', 'name'] })
      expect(result).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
    })

    it('returns an empty array for empty input', () => {
      expect(transform([], { toObjects: ['id', 'name'] })).toEqual([])
    })
  })

  describe('filter', () => {
    it('filters objects by query', () => {
      const result = transform([{ type: 'a' }, { type: 'b' }], { filter: { type: 'a' } })
      expect(result).toEqual([{ type: 'a' }])
    })

    it('returns an empty array when no objects match', () => {
      expect(transform([{ type: 'a' }], { filter: { type: 'z' } })).toEqual([])
    })

    it('supports $gte operator', () => {
      const result = transform([{ age: 10 }, { age: 20 }, { age: 30 }], { filter: { age: { $gte: 20 } } })
      expect(result).toHaveLength(2)
    })
  })

  describe('inPlace', () => {
    it('mutates the original array by default', () => {
      const json = [{ a: 1 }]
      transform(json, { mapping: { a: 'b' } })
      expect(json[0]).toHaveProperty('b', 1)
    })

    it('does not mutate the original array when inPlace is false', () => {
      const json = [{ a: 1 }]
      transform(json, { mapping: { a: 'b' }, inPlace: false })
      expect(json[0]).toHaveProperty('a', 1)
    })
  })

  describe('mapping', () => {
    it('renames a key on an object input', () => {
      expect(transform({ a: 1 }, { mapping: { a: 'b' } })).toEqual({ b: 1 })
    })

    it('renames a key on an array input', () => {
      expect(transform([{ a: 1 }, { a: 2 }], { mapping: { a: 'b' } })).toEqual([{ b: 1 }, { b: 2 }])
    })

    it('supports value mapping', () => {
      const result = transform({ status: 1 }, { mapping: { status: { path: 'label', values: { 1: 'active', 0: 'inactive' } } } })
      expect(result.label).toBe('active')
    })

    it('supports nested paths', () => {
      const result = transform({ a: { b: 1 } }, { mapping: { 'a.b': 'flat' } })
      expect(result.flat).toBe(1)
      expect(result.a).toEqual({})
    })

    it('skips only the objects that do not carry the input path', () => {
      const result = transform([{ a: 1, z: 9 }, { z: 8 }, { a: 3, z: 7 }], { mapping: { a: 'A', z: 'Z' } })
      expect(result).toEqual([{ A: 1, Z: 9 }, { Z: 8 }, { A: 3, Z: 7 }])
    })

    it('still applies the next mappings when an object lacks the first input path', () => {
      expect(transform([{ z: 8 }], { mapping: { a: 'A', z: 'Z' } })).toEqual([{ Z: 8 }])
    })
  })

  describe('unitMapping', () => {
    it('converts a string to a number', () => {
      expect(transform({ n: '42' }, { unitMapping: { n: { asNumber: true } } })).toEqual({ n: 42 })
    })

    it('converts a number to a hex string', () => {
      expect(transform({ n: 255 }, { unitMapping: { n: { asString: 16 } } })).toEqual({ n: 'ff' })
    })

    it('converts a date to a formatted string', () => {
      const result = transform({ ts: '2024-01-15' }, { unitMapping: { ts: { asDate: 'utc', from: 'YYYY-MM-DD', to: 'DD/MM/YYYY' } } })
      expect(result.ts).toBe('15/01/2024')
    })

    it('converts physical units', () => {
      const result = transform({ d: 1 }, { unitMapping: { d: { from: 'km', to: 'mile' } } })
      expect(result.d).toBeCloseTo(0.621371, 4)
    })

    it('applies asCase after conversion', () => {
      const result = transform({ label: 'hello world' }, { unitMapping: { label: { asString: true, asCase: 'camelCase' } } })
      expect(result.label).toBe('helloWorld')
    })

    it('strips every space when converting a string to a number', () => {
      expect(transform({ n: '120 000 500' }, { unitMapping: { n: { asNumber: true } } })).toEqual({ n: 120000500 })
    })

    it('applies a native String case method', () => {
      const result = transform({ label: 'abc' }, { unitMapping: { label: { asString: true, asCase: 'toUpperCase' } } })
      expect(result.label).toBe('ABC')
    })

    it('leaves the value unchanged when the case function is unknown', () => {
      const result = transform({ label: 'abc' }, { unitMapping: { label: { asString: true, asCase: 'nope' } } })
      expect(result.label).toBe('abc')
    })

    it('sets the empty value when path is missing', () => {
      expect(transform({ other: 1 }, { unitMapping: { missing: { asNumber: true, empty: 0 } } })).toHaveProperty('missing', 0)
    })
  })

  describe('pick / omit / merge', () => {
    it('keeps only the listed properties', () => {
      expect(transform({ a: 1, b: 2, c: 3 }, { pick: ['a', 'c'] })).toEqual({ a: 1, c: 3 })
    })

    it('removes the listed properties', () => {
      expect(transform({ a: 1, b: 2 }, { omit: ['b'] })).toEqual({ a: 1 })
    })

    it('merges additional properties', () => {
      expect(transform({ a: 1 }, { merge: { b: 2 } })).toEqual({ a: 1, b: 2 })
    })

    it('applies pick then omit then merge in order', () => {
      const result = transform({ a: 1, b: 2, c: 3 }, { pick: ['a', 'b'], omit: ['b'], merge: { z: 99 } })
      expect(result).toEqual({ a: 1, z: 99 })
    })
  })

  describe('output normalisation', () => {
    it('returns an object when input is an object', () => {
      expect(Array.isArray(transform({ a: 1 }, {}))).toBe(false)
    })

    it('returns an array when input is an array', () => {
      expect(Array.isArray(transform([{ a: 1 }], {}))).toBe(true)
    })

    it('returns an array for object input when asArray is true', () => {
      const result = transform({ a: 1 }, { asArray: true })
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
    })

    it('returns the first element when asObject is true on an array', () => {
      expect(transform([{ a: 1 }, { a: 2 }], { asObject: true })).toEqual({ a: 1 })
    })

    it('returns {} when array is empty and asObject is true', () => {
      expect(transform([], { asObject: true })).toEqual({})
    })

    it('returns {} when object is filtered out', () => {
      expect(transform({ a: 1 }, { filter: { a: 99 } })).toEqual({})
    })
  })

  describe('pipeline', () => {
    it('toObjects + filter + pick', () => {
      const result = transform([['Alice', 30], ['Bob', 17], ['Carol', 25]], {
        toObjects: ['name', 'age'],
        filter: { age: { $gte: 18 } },
        pick: ['name']
      })
      expect(result).toEqual([{ name: 'Alice' }, { name: 'Carol' }])
    })

    it('mapping + unitMapping + omit', () => {
      const result = transform([{ raw: '0', extra: true }], {
        mapping: { raw: 'value' },
        unitMapping: { value: { asNumber: true } },
        omit: ['extra']
      })
      expect(result).toEqual([{ value: 0 }])
    })

    it('filter + unitMapping + merge', () => {
      const result = transform(
        [{ city: 'Paris', temp: 20 }, { city: 'London', temp: 15 }],
        { filter: { temp: { $gte: 20 } }, unitMapping: { temp: { from: 'degC', to: 'degF' } }, merge: { unit: 'F' } }
      )
      expect(result).toHaveLength(1)
      expect(result[0].unit).toBe('F')
      expect(result[0].temp).toBeCloseTo(68, 0)
    })

    it('mapping + pick + asObject', () => {
      const result = transform(
        [{ firstName: 'Alice', age: 30 }, { firstName: 'Bob', age: 25 }],
        { mapping: { firstName: 'name' }, pick: ['name'], asObject: true }
      )
      expect(result).toEqual({ name: 'Alice' })
    })

    it('toObjects + unitMapping date + omit', () => {
      const result = transform([[1, '2024-01-15'], [2, '2024-06-01']], {
        toObjects: ['id', 'date'],
        unitMapping: { date: { asDate: 'utc', from: 'YYYY-MM-DD', to: 'DD/MM/YYYY' } },
        omit: ['id']
      })
      expect(result).toEqual([{ date: '15/01/2024' }, { date: '01/06/2024' }])
    })
  })

  describe('no-op', () => {
    it('returns the object unchanged when no options are active', () => {
      expect(transform({ a: 1 }, {})).toEqual({ a: 1 })
    })

    it('returns the array unchanged when no options are active', () => {
      expect(transform([{ a: 1 }], {})).toEqual([{ a: 1 }])
    })
  })

  describe('edge cases', () => {
    it('handles an empty array input', () => {
      expect(transform([], {})).toEqual([])
    })

    it('handles an empty object input', () => {
      expect(transform({}, {})).toEqual({})
    })
  })

  describe('assertions', () => {
    it('throws when json is null', () => {
      expect(() => transform(null, {})).toThrow()
    })

    it('throws when json is a string', () => {
      expect(() => transform('hello', {})).toThrow()
    })

    it('throws when json is a number', () => {
      expect(() => transform(42, {})).toThrow()
    })

    it('throws when options is not a plain object', () => {
      expect(() => transform({ a: 1 }, 'invalid')).toThrow()
    })

    it('throws when options is null', () => {
      expect(() => transform({ a: 1 }, null)).toThrow()
    })
  })
})
