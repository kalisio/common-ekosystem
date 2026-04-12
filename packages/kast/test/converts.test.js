import { describe, it, expect } from 'vitest'
import { convert } from '../src/convert.js'

describe('convert.toArray', () => {
  describe('basic conversion', () => {
    it('converts a plain object to an array of its values', () => {
      expect(convert.toArray({ a: 1, b: 2 })).toEqual([1, 2])
    })

    it('converts an object with numeric keys', () => {
      expect(convert.toArray({ 0: 'x', 1: 'y' })).toEqual(['x', 'y'])
    })

    it('converts an empty object to an empty array', () => {
      expect(convert.toArray({})).toEqual([])
    })

    it('preserves null values', () => {
      expect(convert.toArray({ a: null })).toContain(null)
    })

    it('preserves false values', () => {
      expect(convert.toArray({ a: false })).toContain(false)
    })

    it('preserves nested objects as values', () => {
      const nested = { x: 1 }
      expect(convert.toArray({ a: nested })[0]).toBe(nested)
    })
  })

  describe('assertions', () => {
    it('throws when obj is an array', () => {
      expect(() => convert.toArray([1, 2])).toThrow()
    })

    it('throws when obj is null', () => {
      expect(() => convert.toArray(null)).toThrow()
    })

    it('throws when obj is a string', () => {
      expect(() => convert.toArray('hello')).toThrow()
    })

    it('throws when obj is undefined', () => {
      expect(() => convert.toArray(undefined)).toThrow()
    })
  })
})

describe('convert.toObjects', () => {
  describe('basic conversion', () => {
    it('converts an array of arrays into an array of objects', () => {
      const result = convert.toObjects([[1, 'Alice'], [2, 'Bob']], ['id', 'name'])
      expect(result).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
    })

    it('works with a single row', () => {
      expect(convert.toObjects([[42]], ['value'])).toEqual([{ value: 42 }])
    })

    it('handles boolean and null values', () => {
      expect(convert.toObjects([[true, null, 0]], ['active', 'ref', 'count'])[0])
        .toEqual({ active: true, ref: null, count: 0 })
    })

    it('ignores surplus values when the row is longer than the key list', () => {
      expect(convert.toObjects([[1, 'Alice', 'extra']], ['id', 'name'])[0])
        .toEqual({ id: 1, name: 'Alice' })
    })

    it('assigns undefined for keys with no matching value', () => {
      const result = convert.toObjects([[1]], ['id', 'name'])
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBeUndefined()
    })

    it('returns an empty array for empty input', () => {
      expect(convert.toObjects([], ['id', 'name'])).toEqual([])
    })
  })

  describe('assertions', () => {
    it('throws when obj is not an array', () => {
      expect(() => convert.toObjects({ a: 1 }, ['a'])).toThrow()
    })

    it('throws when obj is null', () => {
      expect(() => convert.toObjects(null, ['a'])).toThrow()
    })

    it('throws when keys is an empty array', () => {
      expect(() => convert.toObjects([[1, 2]], [])).toThrow()
    })

    it('throws when keys is not an array', () => {
      expect(() => convert.toObjects([[1, 2]], 'id')).toThrow()
    })

    it('throws when keys is null', () => {
      expect(() => convert.toObjects([[1, 2]], null)).toThrow()
    })
  })
})

describe('convert.toValue', () => {
  describe('asDate — UTC', () => {
    it('converts an ISO string to a Date object (UTC)', () => {
      expect(convert.toValue('2024-01-15T12:00:00Z', { asDate: 'utc' })).toBeInstanceOf(Date)
    })

    it('parses with a source format and reformats (UTC)', () => {
      expect(convert.toValue('15/01/2024', { asDate: 'utc', from: 'DD/MM/YYYY', to: 'YYYY-MM-DD' })).toBe('2024-01-15')
    })

    it('reformats to a target string format', () => {
      expect(convert.toValue('2024-01-15', { asDate: 'utc', from: 'YYYY-MM-DD', to: 'DD/MM/YYYY' })).toBe('15/01/2024')
    })

    it('reformats with a time format', () => {
      expect(convert.toValue('2024-01-15T08:30:00Z', { asDate: 'utc', to: 'HH:mm' })).toBe('08:30')
    })
  })

  describe('asDate — local', () => {
    it('converts to a local Date', () => {
      expect(convert.toValue('2024-01-15T12:00:00', { asDate: 'local' })).toBeInstanceOf(Date)
    })

    it('parses with a source format (local)', () => {
      expect(convert.toValue('15-01-2024', { asDate: 'local', from: 'DD-MM-YYYY', to: 'YYYY/MM/DD' })).toBe('2024/01/15')
    })
  })

  describe('asDate — Unix timestamp', () => {
    it('converts a Unix timestamp (ms) to a Date', () => {
      expect(convert.toValue(1705320000000, { asDate: 'utc' })).toBeInstanceOf(Date)
    })
  })

  describe('asString', () => {
    it('converts an integer to a string (base 10)', () => {
      expect(convert.toValue(255, { asString: true })).toBe('255')
    })

    it('converts to base 16 (hex)', () => {
      expect(convert.toValue(255, { asString: 16 })).toBe('ff')
    })

    it('converts to base 2 (binary)', () => {
      expect(convert.toValue(10, { asString: 2 })).toBe('1010')
    })

    it('converts to base 8 (octal)', () => {
      expect(convert.toValue(8, { asString: 8 })).toBe('10')
    })

    it('converts a float to a string', () => {
      expect(convert.toValue(3.14, { asString: true })).toBe('3.14')
    })

    it('converts false to a string', () => {
      expect(convert.toValue(false, { asString: true })).toBe('false')
    })
  })

  describe('asNumber', () => {
    it('converts a numeric string to a number', () => {
      expect(convert.toValue('42', { asNumber: true })).toBe(42)
    })

    it('converts a float string', () => {
      expect(convert.toValue('3.14', { asNumber: true })).toBeCloseTo(3.14)
    })

    it('strips internal spaces before conversion', () => {
      expect(convert.toValue('120 000', { asNumber: true })).toBe(120000)
    })

    it('trims leading and trailing spaces', () => {
      expect(convert.toValue('  42  ', { asNumber: true })).toBe(42)
    })

    it('converts the string "0" to 0', () => {
      expect(convert.toValue('0', { asNumber: true })).toBe(0)
    })

    it('returns NaN for a non-numeric string', () => {
      expect(convert.toValue('abc', { asNumber: true })).toBeNaN()
    })
  })

  describe('physical unit conversion', () => {
    it('converts km to miles', () => {
      expect(convert.toValue(1, { from: 'km', to: 'mile' })).toBeCloseTo(0.621371, 4)
    })

    it('converts miles to km', () => {
      expect(convert.toValue(1, { from: 'mile', to: 'km' })).toBeCloseTo(1.60934, 4)
    })

    it('converts kg to pounds', () => {
      expect(convert.toValue(1, { from: 'kg', to: 'lbm' })).toBeCloseTo(2.20462, 4)
    })

    it('converts metres to feet', () => {
      expect(convert.toValue(1, { from: 'm', to: 'ft' })).toBeCloseTo(3.28084, 4)
    })

    it('converts 0°C to 32°F', () => {
      expect(convert.toValue(0, { from: 'degC', to: 'degF' })).toBeCloseTo(32, 1)
    })

    it('converts 100°C to 212°F', () => {
      expect(convert.toValue(100, { from: 'degC', to: 'degF' })).toBeCloseTo(212, 1)
    })

    it('converts m/s to km/h', () => {
      expect(convert.toValue(1, { from: 'm/s', to: 'km/h' })).toBeCloseTo(3.6, 4)
    })
  })
})
