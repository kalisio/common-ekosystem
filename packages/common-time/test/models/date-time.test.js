import moment from 'moment-timezone'
import 'moment/locale/fr.js'
import { DateTime } from '../../src/models/date-time.js'
import { Duration } from '../../src/models/duration.js'

describe('DateTime', () => {
  beforeEach(() => {
    moment.locale('en')
  })

  afterEach(() => {
    vi.useRealTimers()
    moment.locale('en')
  })

  describe('constructor', () => {
    it('defaults to the current instant in UTC', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-20T13:00:00Z'))
      const value = new DateTime()
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(value.timezone).toBe('UTC')
      expect(new DateTime(undefined).timestamp).toBe(value.timestamp)
    })
    it('accepts Dates, timestamps and ISO 8601 strings', () => {
      const expected = '2026-11-20T13:00:00.000Z'
      expect(new DateTime(new Date(expected)).toISOString()).toBe(expected)
      expect(new DateTime(Date.parse(expected)).toISOString()).toBe(expected)
      expect(new DateTime('2026-11-20T14:00:00+01:00').toISOString()).toBe(expected)
    })
    it('interprets strings without offset in its timezone', () => {
      const value = new DateTime('2026-11-20T14:00:00', { timezone: 'Europe/Paris' })
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(value.timezone).toBe('Europe/Paris')
    })
    it('parses month names in English by default and in the requested locale', () => {
      const format = 'D MMMM YYYY'
      expect(new DateTime('20 November 2026', { format }).toISOString()).toBe('2026-11-20T00:00:00.000Z')
      expect(new DateTime('20 novembre 2026', { format, locale: 'fr' }).toISOString()).toBe('2026-11-20T00:00:00.000Z')
    })
    it('parses with a custom format', () => {
      const value = new DateTime('20/11/2026 14:00', { format: 'DD/MM/YYYY HH:mm', timezone: 'Europe/Paris' })
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('normalizes the timezone name', () => {
      expect(new DateTime(0, { timezone: 'europe/paris' }).timezone).toBe('Europe/Paris')
    })
    it('copies another DateTime with its timezone, unless another one is given', () => {
      const original = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      const copy = new DateTime(original)
      expect(copy).not.toBe(original)
      expect(copy.timestamp).toBe(original.timestamp)
      expect(copy.timezone).toBe('Europe/Paris')
      expect(new DateTime(original, { timezone: 'Asia/Tokyo' }).timezone).toBe('Asia/Tokyo')
    })
    it('restores a JSON snapshot', () => {
      const value = new DateTime({ instant: '2026-11-20T13:00:00.000Z', timezone: 'Europe/Paris' })
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(value.timezone).toBe('Europe/Paris')
    })
    it('rejects invalid values and timezones', () => {
      for (const value of [null, NaN, {}, [], true, '']) {
        expect(() => new DateTime(value)).toThrow(TypeError)
      }
      expect(() => new DateTime('2026-02-30')).toThrow(RangeError)
      expect(() => new DateTime(0, { timezone: 'Mars/Olympus' })).toThrow(RangeError)
      expect(() => new DateTime({ instant: '2026-11-20T13:00:00Z', timezone: 'Mars/Olympus' })).toThrow(RangeError)
    })
    it('is frozen and exposes no internal state', () => {
      const value = new DateTime(0)
      expect(Object.isFrozen(value)).toBe(true)
      expect(Object.keys(value)).toEqual([])
      expect(() => { value.timezone = 'Europe/Paris' }).toThrow(TypeError)
    })
  })

  describe('from and now', () => {
    it('returns the same instance for a DateTime without options', () => {
      const value = new DateTime(0)
      expect(DateTime.from(value)).toBe(value)
      expect(DateTime.from(value, { timezone: 'Europe/Paris' })).not.toBe(value)
    })
    it('creates the current instant in a timezone', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-20T13:00:00Z'))
      const value = DateTime.now({ timezone: 'Europe/Paris' })
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
      expect(value.timezone).toBe('Europe/Paris')
    })
  })

  describe('withTimezone', () => {
    it('keeps the instant and changes the timezone', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      const other = value.withTimezone('America/New_York')
      expect(other.timestamp).toBe(value.timestamp)
      expect(other.toString()).toBe('2026-11-20T08:00:00.000-05:00')
      expect(value.timezone).toBe('Europe/Paris')
    })
  })

  describe('add and subtract', () => {
    it('accepts durations, ISO 8601 strings and numbers with a unit', () => {
      const value = new DateTime('2026-11-20T13:00:00Z')
      expect(value.add(new Duration('PT1H')).toISOString()).toBe('2026-11-20T14:00:00.000Z')
      expect(value.add('PT1H').toISOString()).toBe('2026-11-20T14:00:00.000Z')
      expect(value.add(1, 'hour').toISOString()).toBe('2026-11-20T14:00:00.000Z')
      expect(value.subtract(1, 'day').toISOString()).toBe('2026-11-19T13:00:00.000Z')
    })
    it('adds calendar days in local time across daylight saving transitions', () => {
      const value = new DateTime('2026-03-28T12:00:00', { timezone: 'Europe/Paris' })
      expect(value.add('P1D').toString()).toBe('2026-03-29T12:00:00.000+02:00')
      expect(value.add('PT24H').toString()).toBe('2026-03-29T13:00:00.000+02:00')
    })
    it('adds combined calendar and time units', () => {
      expect(new DateTime('2026-01-31T00:00:00Z').add('P1M1DT2H').toISOString()).toBe('2026-03-01T02:00:00.000Z')
    })
    it('keeps the timezone and does not mutate the instance', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      const result = value.add('P1D')
      expect(result.timezone).toBe('Europe/Paris')
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('rejects invalid durations', () => {
      expect(() => new DateTime(0).add('P1H')).toThrow(RangeError)
      expect(() => new DateTime(0).add(1)).toThrow(TypeError)
    })
  })

  describe('startOf and endOf', () => {
    it('uses its timezone', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      expect(value.startOf('day').toISOString()).toBe('2026-11-19T23:00:00.000Z')
      expect(value.endOf('day').toISOString()).toBe('2026-11-20T22:59:59.999Z')
      expect(value.startOf('day').timezone).toBe('Europe/Paris')
    })
    it('uses Sunday as the first day of the English week', () => {
      const value = new DateTime('2026-11-18T12:00:00Z')
      expect(value.startOf('week').format('YYYY-MM-DD')).toBe('2026-11-15')
      expect(value.endOf('week').format('YYYY-MM-DD')).toBe('2026-11-21')
    })
    it('uses Monday as the first day of the French week', () => {
      const value = new DateTime('2026-11-18T12:00:00Z')
      expect(value.startOf('week', { locale: 'fr' }).format('YYYY-MM-DD')).toBe('2026-11-16')
      expect(value.endOf('week', { locale: 'fr' }).format('YYYY-MM-DD')).toBe('2026-11-22')
    })
    it('ignores the global moment locale', () => {
      moment.locale('fr')
      expect(new DateTime('2026-11-18T12:00:00Z').startOf('week').format('YYYY-MM-DD')).toBe('2026-11-15')
    })
    it('uses Monday for ISO weeks regardless of locale', () => {
      const value = new DateTime('2026-11-18T12:00:00Z')
      expect(value.startOf('isoWeek').format('YYYY-MM-DD')).toBe('2026-11-16')
      expect(value.startOf('isoWeek', { locale: 'fr' }).format('YYYY-MM-DD')).toBe('2026-11-16')
    })
  })

  describe('diff', () => {
    it('computes signed differences in milliseconds by default', () => {
      const value = new DateTime('2026-11-20T13:30:00Z')
      expect(value.diff('2026-11-20T12:00:00Z')).toBe(5400000)
      expect(value.diff('2026-11-20T15:00:00Z', 'hours', { floating: true })).toBe(-1.5)
    })
    it('counts calendar days in its timezone', () => {
      const value = new DateTime('2026-03-30T00:00:00', { timezone: 'Europe/Paris' })
      expect(value.diff('2026-03-29T00:00:00', 'days')).toBe(1)
      expect(value.diff('2026-03-29T00:00:00', 'hours')).toBe(23)
    })
    it('interprets strings without offset in its timezone', () => {
      const value = new DateTime('2026-11-20T14:00:00', { timezone: 'Europe/Paris' })
      expect(value.diff('2026-11-20T13:00:00', 'hours')).toBe(1)
    })
  })

  describe('comparisons', () => {
    it('compares instants regardless of timezones', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      expect(value.isSame(value.withTimezone('Asia/Tokyo'))).toBe(true)
      expect(value.isBefore('2026-11-20T13:00:01Z')).toBe(true)
      expect(value.isAfter('2026-11-20T12:59:59Z')).toBe(true)
      expect(value.isBefore(value)).toBe(false)
    })
    it('supports relational operators and numeric operations', () => {
      const earlier = new DateTime('2026-11-20T12:00:00Z')
      const later = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      expect(earlier < later).toBe(true)
      expect(later - earlier).toBe(3600000)
      expect(+new DateTime(1000)).toBe(1000)
      expect(new DateTime(1000) - 500).toBe(500)
    })
  })

  describe('format and serialization', () => {
    it('formats in its timezone', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      expect(value.format()).toBe('2026-11-20T14:00:00.000+01:00')
      expect(value.format('dddd D MMMM HH:mm', { locale: 'fr' })).toBe('vendredi 20 novembre 14:00')
    })
    it('converts to strings like a Date does', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      expect(value.toString()).toBe('2026-11-20T14:00:00.000+01:00')
      expect(`${value}`).toBe('2026-11-20T14:00:00.000+01:00')
      expect('At ' + value).toBe('At 2026-11-20T14:00:00.000+01:00')
    })
    it('converts to a native Date and to an ISO 8601 string in UTC', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      expect(value.toDate()).toEqual(new Date('2026-11-20T13:00:00Z'))
      expect(value.toDate()).not.toBe(value.toDate())
      expect(value.toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('round-trips through JSON with its timezone', () => {
      const value = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      const json = JSON.stringify({ value })
      expect(json).toBe('{"value":{"instant":"2026-11-20T13:00:00.000Z","timezone":"Europe/Paris"}}')
      const restored = new DateTime(JSON.parse(json).value)
      expect(restored.isSame(value)).toBe(true)
      expect(restored.timezone).toBe('Europe/Paris')
    })
    it('restores an instance with from', () => {
      const original = new DateTime('2026-11-20T13:00:00Z', { timezone: 'Europe/Paris' })
      const restored = DateTime.from(JSON.parse(JSON.stringify(original)))
      expect(restored.timestamp).toBe(original.timestamp)
      expect(restored.timezone).toBe(original.timezone)
    })
  })
})
