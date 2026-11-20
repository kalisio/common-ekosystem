import { Duration } from '../../src/models/index.js'

describe('Duration', () => {
  describe('constructor', () => {
    it('builds a normalized duration from an ISO 8601 string', () => {
      expect(new Duration('PT90M').toISOString()).toBe('PT1H30M')
      expect(new Duration('p1w').toISOString()).toBe('P7D')
    })
    it('builds a duration from a number and a unit', () => {
      expect(new Duration(90, 'minutes').toISOString()).toBe('PT1H30M')
      expect(new Duration(1, 'month').toISOString()).toBe('P1M')
    })
    it('copies another duration', () => {
      const original = new Duration('P1D')
      const copy = new Duration(original)
      expect(copy).not.toBe(original)
      expect(copy.equals(original)).toBe(true)
    })
    it('rejects a unit when copying a duration', () => {
      expect(() => new Duration(new Duration('P1D'), 'day')).toThrow(TypeError)
    })
    it('rejects invalid values', () => {
      expect(() => new Duration('P1H')).toThrow(RangeError)
      expect(() => new Duration(1, 'fortnight')).toThrow(RangeError)
      for (const value of [undefined, null, {}, NaN]) {
        expect(() => new Duration(value)).toThrow(TypeError)
      }
      expect(() => new Duration(5)).toThrow(TypeError)
    })
    it('is frozen and exposes no internal state', () => {
      const value = new Duration('P1D')
      expect(Object.isFrozen(value)).toBe(true)
      expect(Object.keys(value)).toEqual([])
      expect(() => { value.iso = 'PT1H' }).toThrow(TypeError)
    })
  })

  describe('from', () => {
    it('returns the same instance for a duration', () => {
      const value = new Duration('P1D')
      expect(Duration.from(value)).toBe(value)
    })
    it('creates a duration from other values', () => {
      expect(Duration.from('PT1H')).toBeInstanceOf(Duration)
      expect(Duration.from(1, 'hour').toISOString()).toBe('PT1H')
    })
    it('rejects a unit with a duration', () => {
      expect(() => Duration.from(new Duration('P1D'), 'day')).toThrow(TypeError)
    })
  })

  describe('add and subtract', () => {
    it('accepts durations, ISO 8601 strings and numbers with a unit', () => {
      const value = new Duration('PT1H')
      expect(value.add(new Duration('PT30M')).toISOString()).toBe('PT1H30M')
      expect(value.add('PT30M').toISOString()).toBe('PT1H30M')
      expect(value.add(30, 'minutes').toISOString()).toBe('PT1H30M')
      expect(value.subtract(30, 'minutes').toISOString()).toBe('PT30M')
    })
    it('preserves calendar units', () => {
      expect(new Duration('P1M').add('P1D').toISOString()).toBe('P1M1D')
      expect(new Duration('P1M').subtract('P1D').toISOString()).toBe('P1M-1D')
      expect(new Duration('PT23H').add('PT2H').toISOString()).toBe('PT25H')
    })
    it('returns new instances without changing the operands', () => {
      const left = new Duration('PT1H')
      const right = new Duration('PT30M')
      const sum = left.add(right)
      expect(sum).not.toBe(left)
      expect(left.toISOString()).toBe('PT1H')
      expect(right.toISOString()).toBe('PT30M')
    })
    it('rejects invalid operands', () => {
      expect(() => new Duration('PT1H').add(null)).toThrow(TypeError)
      expect(() => new Duration('PT1H').subtract('PT')).toThrow(RangeError)
    })
  })

  describe('negate', () => {
    it('inverts the sign', () => {
      expect(new Duration('PT1H').negate().toISOString()).toBe('-PT1H')
      expect(new Duration('-P1D').negate().toISOString()).toBe('P1D')
    })
    it('negates mixed-sign durations as a whole', () => {
      expect(new Duration('P1M-1D').negate().toISOString()).toBe('-P1M-1D')
    })
    it('keeps zero unsigned', () => {
      expect(new Duration('P0D').negate().toISOString()).toBe('P0D')
    })
    it('restores the original duration when negated twice', () => {
      for (const value of ['PT3H', '-PT3H', 'P1M-1D', 'P0D']) {
        const original = new Duration(value)
        expect(original.negate().negate().equals(original)).toBe(true)
      }
    })
  })

  describe('equals', () => {
    it('compares normalized representations', () => {
      expect(new Duration('PT60M').equals('PT1H')).toBe(true)
      expect(new Duration('P1W').equals('P7D')).toBe(true)
      expect(new Duration('P12M').equals(new Duration('P1Y'))).toBe(true)
    })
    it('distinguishes calendar units from time units', () => {
      expect(new Duration('P1D').equals('PT24H')).toBe(false)
      expect(new Duration('P1M').equals('P30D')).toBe(false)
    })
    it('accepts a number with a unit', () => {
      expect(new Duration('PT1H').equals(60, 'minutes')).toBe(true)
      expect(new Duration('PT1H').equals(30, 'minutes')).toBe(false)
      expect(new Duration('PT1H30M').equals(90, 'minutes')).toBe(true)
    })
    it('throws for invalid values', () => {
      expect(() => new Duration('P1D').equals('P1H')).toThrow(RangeError)
    })
  })

  describe('asMilliseconds', () => {
    it('converts time-based durations', () => {
      expect(new Duration('PT1H30M').asMilliseconds()).toBe(5400000)
      expect(new Duration('-PT1S').asMilliseconds()).toBe(-1000)
      expect(new Duration('P0D').asMilliseconds()).toBe(0)
    })
    it('rejects calendar durations', () => {
      expect(() => new Duration('P1D').asMilliseconds()).toThrow(RangeError)
      expect(() => new Duration('P1M').asMilliseconds()).toThrow(RangeError)
    })
    it.fails('rejects P1DT-24H like duration.asMilliseconds', () => {
      expect(() => new Duration('P1DT-24H').asMilliseconds()).toThrow(RangeError)
    })
  })

  describe('serialization', () => {
    it('serializes to the normalized ISO 8601 string', () => {
      const value = new Duration('PT90M')
      expect(value.toISOString()).toBe('PT1H30M')
      expect(value.toString()).toBe('PT1H30M')
      expect(`${value}`).toBe('PT1H30M')
      expect(JSON.stringify({ value })).toBe('{"value":"PT1H30M"}')
    })
    it('round-trips through JSON', () => {
      const value = new Duration('P1M-1D')
      expect(Duration.from(JSON.parse(JSON.stringify(value))).equals(value)).toBe(true)
    })
  })
})
