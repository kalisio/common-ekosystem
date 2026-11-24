import { duration } from '../../src/utilities/index.js'

describe('duration', () => {
  describe('parse', () => {
    it('returns ISO 8601 durations unchanged when already normalized', () => {
      for (const value of ['P1Y2M3DT4H5M6S', 'P1D', 'PT1H', 'PT0.5S', '-P1D']) {
        expect(duration.parse(value)).toBe(value)
      }
    })
    it('normalizes durations following Moment rules', () => {
      expect(duration.parse('PT90M')).toBe('PT1H30M')
      expect(duration.parse('P1W')).toBe('P7D')
      expect(duration.parse('P1W2D')).toBe('P9D')
      expect(duration.parse('P13M')).toBe('P1Y1M')
      expect(duration.parse('P0.5Y')).toBe('P6M')
      expect(duration.parse('+P1D')).toBe('P1D')
    })
    it('produces stable normalized representations', () => {
      for (const value of ['PT90M', 'P13M', 'PT-3H', 'P1W2D', '-P1M1D', 'PT1,5S']) {
        const normalized = duration.parse(value)
        expect(duration.parse(normalized)).toBe(normalized)
      }
    })
    it('never converts hours into days', () => {
      expect(duration.parse('PT36H')).toBe('PT36H')
    })
    it('preserves the distinction between calendar and time units', () => {
      expect(duration.parse(1, 'day')).toBe('P1D')
      expect(duration.parse(24, 'hours')).toBe('PT24H')
      expect(duration.parse(1, 'month')).toBe('P1M')
      expect(duration.parse(30, 'days')).toBe('P30D')
    })
    it('writes any zero duration as P0D', () => {
      for (const value of ['P0D', 'PT0S', '-PT0S', 'P0Y0M0DT0H0M0S']) {
        expect(duration.parse(value)).toBe('P0D')
      }
      expect(duration.parse(0, 'year')).toBe('P0D')
    })
    it('rejects components of opposite signs, as Temporal does', () => {
      for (const value of ['P1M-1D', 'P1DT-24H', 'P1W-1D', 'PT1H-30M', '-P1DT-1H']) {
        expect(() => duration.parse(value)).toThrow(RangeError)
      }
    })
    it('accepts fractional components with a dot or a comma', () => {
      expect(duration.parse('P1.5D')).toBe('P1.5D')
      expect(duration.parse('PT1,5H')).toBe('PT1H30M')
    })
    it('rounds seconds to the millisecond', () => {
      expect(duration.parse('PT1.23456S')).toBe('PT1.235S')
    })
    it('accepts signed durations and signed components', () => {
      expect(duration.parse('-PT1H')).toBe('-PT1H')
      expect(duration.parse('P-1D')).toBe('-P1D')
      expect(duration.parse('PT-3H')).toBe('-PT3H')
    })
    it('accepts designators in any case', () => {
      expect(duration.parse('p1d')).toBe('P1D')
      expect(duration.parse('pt1h')).toBe('PT1H')
      expect(duration.parse('PT1h30m')).toBe('PT1H30M')
    })
    it('builds a duration from a number and a unit', () => {
      expect(duration.parse(90, 'minutes')).toBe('PT1H30M')
      expect(duration.parse(2, 'week')).toBe('P14D')
      expect(duration.parse(1, 'quarter')).toBe('P3M')
      expect(duration.parse(1.5, 'years')).toBe('P1Y6M')
      expect(duration.parse(-1, 'day')).toBe('-P1D')
      expect(duration.parse(1500, 'ms')).toBe('PT1.5S')
    })
    it('distinguishes case-sensitive unit aliases', () => {
      expect(duration.parse(1, 'M')).toBe('P1M')
      expect(duration.parse(1, 'm')).toBe('PT1M')
      expect(duration.parse(1, 'ms')).toBe('PT0.001S')
    })
    it('rejects malformed ISO 8601 durations', () => {
      for (const value of ['', ' P1D', 'P', 'PT', 'P1DT', 'P1H', 'PT1D', 'P1S', '1.02:03:04', 'P1D ', 'not a duration']) {
        expect(() => duration.parse(value)).toThrow(RangeError)
      }
    })
    it('rejects unsupported value types', () => {
      for (const value of [null, undefined, {}, [], true, new Date()]) {
        expect(() => duration.parse(value)).toThrow(TypeError)
      }
    })
    it('rejects invalid amounts', () => {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(() => duration.parse(value, 'day')).toThrow(TypeError)
      }
    })
    it('requires a unit for numbers and no unit for strings', () => {
      expect(() => duration.parse(5)).toThrow(TypeError)
      expect(() => duration.parse('P1D', 'day')).toThrow(TypeError)
    })
    it('rejects unsupported units', () => {
      for (const unit of ['fortnight', 'isoWeek', 'date', 'weekday', '', null]) {
        expect(() => duration.parse(1, unit)).toThrow(RangeError)
      }
    })
  })

  describe('isValid', () => {
    it('returns true for valid durations', () => {
      expect(duration.isValid('P1D')).toBe(true)
      expect(duration.isValid('pt1h')).toBe(true)
      expect(duration.isValid(90, 'minutes')).toBe(true)
    })
    it('returns false instead of throwing', () => {
      for (const [value, unit] of [['P'], ['P1H'], ['P1M-1D'], [null], [NaN, 'day'], [5], [1, 'fortnight'], ['P1D', 'day']]) {
        expect(duration.isValid(value, unit)).toBe(false)
      }
    })
    it('rejects duplicated designators', () => {
      for (const value of ['P1Y2Y', 'P1M2M', 'P1D2D', 'PT1H2H', 'PT1M2M', 'PT1S2S']) {
        expect(duration.isValid(value)).toBe(false)
      }
    })
    it('rejects incorrectly ordered designators', () => {
      for (const value of ['P1D2M', 'P1M2Y', 'PT1M2H', 'PT1S2M']) {
        expect(duration.isValid(value)).toBe(false)
      }
    })
    it('rejects malformed signs and numeric notation', () => {
      for (const value of ['--P1D', 'P--1D', 'PT++1H', 'PT1e3S', 'PT.5S', 'PT1.S']) {
        expect(duration.isValid(value)).toBe(false)
      }
    })
  })

  describe('add and subtract', () => {
    it('adds durations while preserving calendar units', () => {
      expect(duration.add('P1M', 'P1D')).toBe('P1M1D')
      expect(duration.add('P1Y', 'P6M')).toBe('P1Y6M')
    })
    it('carries time units over to hours but not to days', () => {
      expect(duration.add('PT45M', 'PT30M')).toBe('PT1H15M')
      expect(duration.add('PT23H', 'PT2H')).toBe('PT25H')
    })
    it('adds fractional durations', () => {
      expect(duration.add('PT0.5S', 'PT0.5S')).toBe('PT1S')
      expect(duration.add('PT1.5H', 'PT30M')).toBe('PT2H')
    })
    it('subtracts durations', () => {
      expect(duration.subtract('PT2H', 'PT30M')).toBe('PT1H30M')
      expect(duration.subtract('PT1H', 'PT2H')).toBe('-PT1H')
    })
    it('subtracts negative durations', () => {
      expect(duration.subtract('PT1H', '-PT30M')).toBe('PT1H30M')
      expect(duration.subtract('-PT2H', 'PT1H')).toBe('-PT3H')
    })
    it('cancels out to P0D', () => {
      expect(duration.add('PT1H', '-PT1H')).toBe('P0D')
      expect(duration.subtract('P1D', 'P1D')).toBe('P0D')
      expect(duration.subtract('P1M', 'P1M')).toBe('P0D')
    })
    it('rejects results whose components would have opposite signs', () => {
      expect(() => duration.subtract('P1M', 'P1D')).toThrow(RangeError)
      expect(() => duration.add('P1D', '-PT1H')).toThrow(RangeError)
      // Moment would write P0D, although a calendar day is not always 24 hours long
      expect(() => duration.subtract('P1D', 'PT24H')).toThrow(RangeError)
    })
    it('combines opposite signs within the same group', () => {
      expect(duration.subtract('P1Y', 'P1M')).toBe('P11M')
      expect(duration.subtract('PT1H', 'PT90M')).toBe('-PT30M')
      expect(duration.add('P1D', '-P1D')).toBe('P0D')
    })
    it('accepts lowercase designators', () => {
      expect(duration.add('p1d', 'pt1h')).toBe('P1DT1H')
    })
    it('only accepts ISO 8601 durations', () => {
      expect(() => duration.add(1, 'P1D')).toThrow(TypeError)
      expect(() => duration.subtract('P1D', 1)).toThrow(TypeError)
      expect(() => duration.add(null, 'PT1H')).toThrow(TypeError)
      expect(() => duration.add('PT1H', undefined)).toThrow(TypeError)
      expect(() => duration.add('P1D', 'P1H')).toThrow(RangeError)
      expect(() => duration.subtract('PT1H', 'PT')).toThrow(RangeError)
    })
  })

  describe('asMilliseconds', () => {
    it('converts time-based durations', () => {
      expect(duration.asMilliseconds('PT36H')).toBe(129600000)
      expect(duration.asMilliseconds('PT1M30S')).toBe(90000)
      expect(duration.asMilliseconds('PT1.5S')).toBe(1500)
      expect(duration.asMilliseconds('-PT1H')).toBe(-3600000)
    })
    it('preserves millisecond precision', () => {
      expect(duration.asMilliseconds('PT0.001S')).toBe(1)
      expect(duration.asMilliseconds('PT0.123S')).toBe(123)
      expect(duration.asMilliseconds('PT1.234S')).toBe(1234)
    })
    it('converts a number with a time unit', () => {
      expect(duration.asMilliseconds(90, 'minutes')).toBe(5400000)
      expect(duration.asMilliseconds(-1.5, 'hours')).toBe(-5400000)
      expect(duration.asMilliseconds(0.5, 'minutes')).toBe(30000)
    })
    it('converts zero durations, negative zero included', () => {
      for (const value of ['P0D', 'PT0S', '-PT0S']) {
        expect(duration.asMilliseconds(value)).toBe(0)
      }
      expect(duration.asMilliseconds(0, 'day')).toBe(0)
    })
    it('ignores zero calendar components', () => {
      expect(duration.asMilliseconds('P0Y0M0DT1H')).toBe(3600000)
    })
    it('rejects calendar durations, which need a reference date', () => {
      for (const value of ['P1D', 'P1W', 'P1M', 'P1Y', 'P1DT1H', '-P1D', 'p1d']) {
        expect(() => duration.asMilliseconds(value)).toThrow(RangeError)
      }
      expect(() => duration.asMilliseconds(1, 'day')).toThrow(RangeError)
    })
    it('rejects durations whose components have opposite signs', () => {
      expect(() => duration.asMilliseconds('P1M-1D')).toThrow(RangeError)
      expect(() => duration.asMilliseconds('P1DT-24H')).toThrow(RangeError)
    })
    it('rejects invalid durations', () => {
      expect(() => duration.asMilliseconds('P1H')).toThrow(RangeError)
      expect(() => duration.asMilliseconds(null)).toThrow(TypeError)
    })
  })
})
