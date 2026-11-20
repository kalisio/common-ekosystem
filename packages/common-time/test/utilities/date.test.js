import moment from 'moment-timezone'
import 'moment/locale/fr.js'
import { date } from '../../src/utilities/index.js'

describe('date', () => {
  beforeEach(() => {
    moment.locale('en')
  })

  afterEach(() => {
    moment.locale('en')
  })

  describe('parse', () => {
    it('parses strict ISO 8601 strings and normalizes offsets', () => {
      expect(date.parse('2026-11-20T14:00:00+01:00').toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(date.parse('2026-11-20T14:00:00.123+0100').toISOString()).toBe('2026-11-20T13:00:00.123Z')
      expect(date.parse('2026-11-20').toISOString()).toBe('2026-11-20T00:00:00.000Z')
    })
    it('accepts the ISO 8601 variants supported by Moment', () => {
      expect(date.parse('2026-11-20T14:00').toISOString()).toBe('2026-11-20T14:00:00.000Z')
      expect(date.parse('20261120T140000Z').toISOString()).toBe('2026-11-20T14:00:00.000Z')
      expect(date.parse('2026-W47-5').toISOString()).toBe('2026-11-20T00:00:00.000Z')
      expect(date.parse('2026-324').toISOString()).toBe('2026-11-20T00:00:00.000Z')
    })
    it('interprets strings without offset in UTC by default', () => {
      expect(date.parse('2026-11-20T14:00:00').toISOString()).toBe('2026-11-20T14:00:00.000Z')
    })
    it('interprets strings without offset in the given timezone', () => {
      expect(date.parse('2026-11-20T14:00:00', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(date.parse('2026-07-01T14:00:00', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-07-01T12:00:00.000Z')
    })
    it('keeps the offset of the string over the given timezone', () => {
      expect(date.parse('2026-11-20T14:00:00+01:00', { timezone: 'America/New_York' }).toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('accepts case-insensitive timezone names', () => {
      expect(date.parse('2026-11-20T14:00:00', { timezone: 'europe/paris' }).toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('parses strictly with a custom format', () => {
      expect(date.parse('2026-11-20 14:00', { format: 'YYYY-MM-DD HH:mm', timezone: 'Europe/Paris' }).toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(() => date.parse('2026-11-20', { format: 'DD/MM/YYYY' })).toThrow(RangeError)
    })
    it('moves a nonexistent local time forward into summer time', () => {
      expect(date.parse('2026-03-29T02:30:00', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-03-29T01:30:00.000Z')
    })
    it('uses the earlier occurrence of an ambiguous local time', () => {
      expect(date.parse('2026-10-25T02:30:00', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-10-25T00:30:00.000Z')
      expect(date.parse('2026-10-25T02:30:00+01:00', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-10-25T01:30:00.000Z')
    })
    it('accepts timestamps in milliseconds', () => {
      expect(date.parse(0).toISOString()).toBe('1970-01-01T00:00:00.000Z')
      expect(date.parse(Date.UTC(2026, 10, 20, 13)).toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('accepts the limits of the Date range', () => {
      expect(date.parse(8.64e15).getTime()).toBe(8.64e15)
      expect(() => date.parse(8.64e15 + 1)).toThrow(RangeError)
    })
    it('clones native Dates', () => {
      const original = new Date('2026-11-20T13:00:00.000Z')
      const copy = date.parse(original)
      expect(copy).not.toBe(original)
      expect(copy.getTime()).toBe(original.getTime())
    })
    it('returns a new Date on each call', () => {
      expect(date.parse('2026-11-20')).not.toBe(date.parse('2026-11-20'))
    })
    it('rejects unsupported value types', () => {
      for (const value of [NaN, Infinity, -Infinity, null, undefined, {}, [], true, '', '   ']) {
        expect(() => date.parse(value)).toThrow(TypeError)
      }
    })
    it('rejects invalid dates and malformed strings', () => {
      for (const value of ['2026-02-30', '20/11/2026', 'not-a-date', new Date(NaN)]) {
        expect(() => date.parse(value)).toThrow(RangeError)
      }
    })
    it('rejects invalid timezones', () => {
      for (const timezone of ['Mars/Olympus', '', null, 42]) {
        expect(() => date.parse('2026-11-20', { timezone })).toThrow(RangeError)
      }
    })
    it('validates the format option whatever the input type', () => {
      expect(() => date.parse('2026-11-20', { format: '' })).toThrow(TypeError)
      expect(() => date.parse(0, { format: '' })).toThrow(TypeError)
      expect(() => date.parse(new Date(0), { format: 42 })).toThrow(TypeError)
    })
  })

  describe('isValid', () => {
    it('returns true for valid inputs', () => {
      for (const value of ['2026-11-20', '2026-11-20T14:00:00+01:00', 0, new Date()]) {
        expect(date.isValid(value)).toBe(true)
      }
    })
    it('returns false instead of throwing', () => {
      for (const value of ['not a date', '2026-02-30', NaN, null, undefined, new Date(NaN)]) {
        expect(date.isValid(value)).toBe(false)
      }
    })
    it('takes the parse options into account', () => {
      expect(date.isValid('20/11/2026', { format: 'DD/MM/YYYY' })).toBe(true)
      expect(date.isValid('2026-11-20', { timezone: 'Mars/Olympus' })).toBe(false)
    })
  })

  describe('format', () => {
    it('formats in ISO 8601 and UTC by default', () => {
      expect(date.format('2026-11-20T13:00:00Z')).toBe('2026-11-20T13:00:00.000+00:00')
    })
    it('formats in the given timezone', () => {
      expect(date.format('2026-11-20T13:00:00Z', undefined, { timezone: 'Europe/Paris' })).toBe('2026-11-20T14:00:00.000+01:00')
      expect(date.format('2026-11-20T13:00:00Z', 'YYYY-MM-DD HH:mm Z', { timezone: 'Europe/Paris' })).toBe('2026-11-20 14:00 +01:00')
    })
    it('formats around DST transitions', () => {
      expect(date.format('2026-03-29T00:59:59Z', 'HH:mm z', { timezone: 'Europe/Paris' })).toBe('01:59 CET')
      expect(date.format('2026-03-29T01:00:00Z', 'HH:mm z', { timezone: 'Europe/Paris' })).toBe('03:00 CEST')
    })
    it('accepts case-insensitive timezone names', () => {
      expect(date.format('2026-11-20T13:00:00Z', 'HH:mm z', { timezone: 'europe/paris' })).toBe('14:00 CET')
    })
    it('formats in English regardless of the global moment locale', () => {
      moment.locale('fr')
      expect(date.format('2026-11-20T13:00:00Z', 'dddd D MMMM')).toBe('Friday 20 November')
    })
    it('formats in the requested locale', () => {
      expect(date.format('2026-11-20T13:00:00Z', 'dddd D MMMM', { locale: 'fr' })).toBe('vendredi 20 novembre')
    })
    it('rejects an unknown or unloaded locale', () => {
      for (const locale of ['xx', '', null]) {
        expect(() => date.format('2026-11-20T13:00:00Z', 'D MMMM', { locale })).toThrow(RangeError)
      }
    })
    it('rejects invalid patterns', () => {
      for (const pattern of ['', null, 42]) {
        expect(() => date.format('2026-11-20T13:00:00Z', pattern)).toThrow(TypeError)
      }
    })
  })

  describe('add', () => {
    it('adds without mutating the input', () => {
      const original = new Date('2026-11-20T13:00:00Z')
      const result = date.add(original, 2, 'hours')
      expect(result.toISOString()).toBe('2026-11-20T15:00:00.000Z')
      expect(original.toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('subtracts with negative amounts', () => {
      expect(date.add('2026-11-20T13:00:00Z', -1, 'day').toISOString()).toBe('2026-11-19T13:00:00.000Z')
    })
    it('adds a calendar day across the daylight saving transition', () => {
      expect(date.add('2026-03-28T12:00:00Z', 1, 'day', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-03-29T11:00:00.000Z')
    })
    it('adds exact hours across the daylight saving transition', () => {
      expect(date.add('2026-03-28T12:00:00Z', 24, 'hours', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-03-29T12:00:00.000Z')
    })
    it('clamps to the end of shorter months', () => {
      expect(date.add('2026-01-31T00:00:00Z', 1, 'month').toISOString()).toBe('2026-02-28T00:00:00.000Z')
      expect(date.add('2028-02-29T00:00:00Z', 1, 'year').toISOString()).toBe('2029-02-28T00:00:00.000Z')
    })
    it('rounds fractional days and months, as Moment does', () => {
      const input = '2026-01-10T00:00:00Z'
      expect(date.add(input, 1.5, 'days').toISOString()).toBe('2026-01-12T00:00:00.000Z')
      expect(date.add(input, -1.5, 'days').toISOString()).toBe('2026-01-08T00:00:00.000Z')
      expect(date.add(input, 1.5, 'weeks').toISOString()).toBe('2026-01-21T00:00:00.000Z')
      expect(date.add(input, 1.5, 'months').toISOString()).toBe('2026-03-10T00:00:00.000Z')
    })
    it('keeps the fraction of hours and smaller units', () => {
      expect(date.add('2026-01-10T00:00:00Z', 1.5, 'hours').toISOString()).toBe('2026-01-10T01:30:00.000Z')
    })
    it('accepts unit aliases', () => {
      const input = '2026-11-20T13:00:00Z'
      expect(date.add(input, 1, 'd').toISOString()).toBe('2026-11-21T13:00:00.000Z')
      expect(date.add(input, 1, 'days').toISOString()).toBe('2026-11-21T13:00:00.000Z')
      expect(date.add(input, 1, 'M').toISOString()).toBe('2026-12-20T13:00:00.000Z')
      expect(date.add(input, 1, 'm').toISOString()).toBe('2026-11-20T13:01:00.000Z')
    })
    it('rejects invalid amounts', () => {
      for (const amount of [NaN, Infinity, '1', null, undefined]) {
        expect(() => date.add(0, amount, 'day')).toThrow(TypeError)
      }
    })
    it('rejects units that Moment would silently ignore', () => {
      for (const unit of ['fortnight', 'weekday', 'date', 'dayOfYear', 'weekYear', '', null]) {
        expect(() => date.add(0, 1, unit)).toThrow(RangeError)
      }
    })
  })

  describe('startOf and endOf', () => {
    it('finds the start and end of a day in a timezone', () => {
      const input = '2026-03-29T12:00:00Z'
      expect(date.startOf(input, 'day', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-03-28T23:00:00.000Z')
      expect(date.endOf(input, 'day', { timezone: 'Europe/Paris' }).toISOString()).toBe('2026-03-29T21:59:59.999Z')
    })
    it('finds the start of a quarter and of a year', () => {
      expect(date.startOf('2026-11-20T13:00:00Z', 'quarter').toISOString()).toBe('2026-10-01T00:00:00.000Z')
      expect(date.startOf('2026-11-20T13:00:00Z', 'year', { timezone: 'Europe/Paris' }).toISOString()).toBe('2025-12-31T23:00:00.000Z')
    })
    it('finds the end of a leap February', () => {
      expect(date.endOf('2028-02-10T00:00:00Z', 'month').toISOString()).toBe('2028-02-29T23:59:59.999Z')
    })
    it('starts weeks according to the locale', () => {
      expect(date.startOf('2026-11-20T13:00:00Z', 'week').toISOString()).toBe('2026-11-15T00:00:00.000Z')
      expect(date.startOf('2026-11-20T13:00:00Z', 'week', { locale: 'fr' }).toISOString()).toBe('2026-11-16T00:00:00.000Z')
      expect(date.endOf('2026-11-20T13:00:00Z', 'week', { locale: 'fr' }).toISOString()).toBe('2026-11-22T23:59:59.999Z')
    })
    it('starts weeks regardless of the global moment locale', () => {
      moment.locale('fr')
      expect(date.startOf('2026-11-20T13:00:00Z', 'week').toISOString()).toBe('2026-11-15T00:00:00.000Z')
    })
    it('starts ISO weeks on Monday whatever the locale', () => {
      expect(date.startOf('2026-11-20T13:00:00Z', 'isoWeek').toISOString()).toBe('2026-11-16T00:00:00.000Z')
      expect(date.startOf('2026-11-20T13:00:00Z', 'W').toISOString()).toBe('2026-11-16T00:00:00.000Z')
    })
    it('does not mutate a Date input', () => {
      const original = new Date('2026-11-20T13:00:00Z')
      date.startOf(original, 'day')
      date.endOf(original, 'day')
      expect(original.toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('rejects units that Moment would silently ignore', () => {
      for (const unit of ['fortnight', 'weekday', 'isoWeekday', 'dayOfYear', 'weekYear', null]) {
        expect(() => date.startOf(0, unit)).toThrow(RangeError)
        expect(() => date.endOf(0, unit)).toThrow(RangeError)
      }
    })
  })

  describe('diff', () => {
    it('computes signed differences, left minus right', () => {
      const earlier = '2026-11-20T12:00:00Z'
      const later = '2026-11-20T13:30:00Z'
      expect(date.diff(later, earlier, 'minutes')).toBe(90)
      expect(date.diff(earlier, later, 'minutes')).toBe(-90)
    })
    it('defaults to milliseconds', () => {
      expect(date.diff('2026-11-20T13:30:00Z', '2026-11-20T12:00:00Z')).toBe(5400000)
    })
    it('truncates toward zero unless floating is true', () => {
      expect(date.diff('2026-11-20T12:00:00Z', '2026-11-20T13:30:00Z', 'hours')).toBe(-1)
      expect(date.diff('2026-11-20T12:00:00Z', '2026-11-20T13:30:00Z', 'hours', { floating: true })).toBe(-1.5)
      expect(date.diff('2026-12-19T00:00:00Z', '2026-11-20T00:00:00Z', 'months')).toBe(0)
      expect(date.diff('2026-12-20T00:00:00Z', '2026-11-20T00:00:00Z', 'months')).toBe(1)
    })
    it('counts calendar days in the given timezone', () => {
      const left = '2026-03-29T22:00:00Z'
      const right = '2026-03-28T23:00:00Z'
      expect(date.diff(left, right, 'days')).toBe(0)
      expect(date.diff(left, right, 'days', { timezone: 'Europe/Paris' })).toBe(1)
    })
    it('rejects units that Moment would silently ignore', () => {
      for (const unit of ['fortnight', 'isoWeek', 'date', 'weekday', null]) {
        expect(() => date.diff(0, 0, unit)).toThrow(RangeError)
      }
    })
  })

  describe('isBefore, isAfter and isSame', () => {
    it('compares instants', () => {
      const earlier = '2026-11-20T12:00:00Z'
      const later = '2026-11-20T13:30:00Z'
      expect(date.isBefore(earlier, later)).toBe(true)
      expect(date.isBefore(later, earlier)).toBe(false)
      expect(date.isAfter(later, earlier)).toBe(true)
      expect(date.isAfter(earlier, later)).toBe(false)
    })
    it('treats the same instant as neither before nor after', () => {
      const instant = '2026-11-20T12:00:00Z'
      expect(date.isBefore(instant, instant)).toBe(false)
      expect(date.isAfter(instant, instant)).toBe(false)
      expect(date.isSame(instant, instant)).toBe(true)
    })
    it('compares equivalent representations of an instant', () => {
      const instant = new Date('2026-11-20T12:00:00Z')
      expect(date.isSame(instant, instant.getTime())).toBe(true)
      expect(date.isSame(instant, '2026-11-20T13:00:00+01:00')).toBe(true)
    })
    it('compares strings without offset in the given timezone', () => {
      expect(date.isBefore('2026-11-20T13:30:00', '2026-11-20T14:00:00+01:00')).toBe(false)
      expect(date.isBefore('2026-11-20T13:30:00', '2026-11-20T14:00:00+01:00', { timezone: 'Europe/Paris' })).toBe(true)
    })
    it('throws for invalid inputs', () => {
      expect(() => date.isBefore('not a date', 0)).toThrow(RangeError)
      expect(() => date.isSame(0, null)).toThrow(TypeError)
    })
  })
})
