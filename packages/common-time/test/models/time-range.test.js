import { DateTime } from '../../src/models/date-time.js'
import { Duration } from '../../src/models/duration.js'
import { TimeRange } from '../../src/models/time-range.js'

const START = '2026-11-20T12:00:00.000Z'
const END = '2026-11-20T14:00:00.000Z'

describe('TimeRange', () => {
  describe('constructor', () => {
    it('builds a time range from two bounds', () => {
      const value = new TimeRange(START, END)
      expect(value.start.toISOString()).toBe(START)
      expect(value.end.toISOString()).toBe(END)
      expect(value.timezone).toBe('UTC')
    })
    it('accepts Dates, timestamps, strings and DateTimes as bounds', () => {
      const value = new TimeRange(new Date(START), Date.parse(END))
      expect(value.equals(new TimeRange(new DateTime(START), END))).toBe(true)
    })
    it('interprets strings without offset in the given timezone', () => {
      const value = new TimeRange('2026-11-20T13:00:00', '2026-11-20T15:00:00', { timezone: 'Europe/Paris' })
      expect(value.start.toISOString()).toBe(START)
      expect(value.end.toISOString()).toBe(END)
      expect(value.timezone).toBe('Europe/Paris')
    })
    it('inherits the timezone of a DateTime start and converts the end to it', () => {
      const start = new DateTime(START, { timezone: 'Europe/Paris' })
      const end = new DateTime(END, { timezone: 'Asia/Tokyo' })
      const value = new TimeRange(start, end)
      expect(value.timezone).toBe('Europe/Paris')
      expect(value.end.timezone).toBe('Europe/Paris')
      expect(value.end.toISOString()).toBe(END)
      expect(start.timezone).toBe('Europe/Paris')
      expect(end.timezone).toBe('Asia/Tokyo')
    })
    it('copies another time range with its timezone, unless another one is given', () => {
      const original = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      expect(new TimeRange(original).timezone).toBe('Europe/Paris')
      expect(new TimeRange(original).equals(original)).toBe(true)
      expect(new TimeRange(original, undefined, { timezone: 'Asia/Tokyo' }).timezone).toBe('Asia/Tokyo')
    })
    it('restores a JSON snapshot', () => {
      const value = new TimeRange({ start: START, end: END, timezone: 'Europe/Paris' })
      expect(value.start.toISOString()).toBe(START)
      expect(value.timezone).toBe('Europe/Paris')
      expect(new TimeRange({ start: START, end: END }).timezone).toBe('UTC')
    })
    it('parses an ISO 8601 interval made of two instants', () => {
      const value = new TimeRange(`${START}/${END}`)
      expect(value.start.toISOString()).toBe(START)
      expect(value.end.toISOString()).toBe(END)
    })
    it('allows empty time ranges', () => {
      expect(new TimeRange(START, START).isEmpty()).toBe(true)
      expect(new TimeRange(START, END).isEmpty()).toBe(false)
    })
    it('rejects a start after the end', () => {
      expect(() => new TimeRange(END, START)).toThrow(RangeError)
      expect(() => new TimeRange(`${END}/${START}`)).toThrow(RangeError)
    })
    it('rejects missing bounds and malformed ISO 8601 intervals', () => {
      expect(() => new TimeRange()).toThrow(TypeError)
      expect(() => new TimeRange(START)).toThrow(TypeError)
      expect(() => new TimeRange({ start: START })).toThrow(TypeError)
      expect(() => new TimeRange(`${START}/${END}/${END}`)).toThrow(RangeError)
      expect(() => new TimeRange(`${START}/not-a-date`)).toThrow(RangeError)
    })
    it('rejects ISO 8601 intervals with empty bounds', () => {
      for (const value of [`${START}/`, `/${END}`, '/', `${START}//${END}`, `${START}/ `]) {
        expect(() => new TimeRange(value)).toThrow(RangeError)
      }
    })
    it('rejects invalid bounds and timezones', () => {
      expect(() => new TimeRange('2026-02-30', END)).toThrow(RangeError)
      expect(() => new TimeRange(START, null)).toThrow(TypeError)
      expect(() => new TimeRange(START, END, { timezone: 'Mars/Olympus' })).toThrow(RangeError)
    })
    it('is frozen and exposes no internal state', () => {
      const value = new TimeRange(START, END)
      expect(Object.isFrozen(value)).toBe(true)
      expect(Object.keys(value)).toEqual([])
      expect(() => { value.start = new DateTime() }).toThrow(TypeError)
    })
  })

  describe('from', () => {
    it('returns the same instance for a time range without overrides', () => {
      const value = new TimeRange(START, END)
      expect(TimeRange.from(value)).toBe(value)
      expect(TimeRange.from(value, undefined, { timezone: 'Europe/Paris' })).not.toBe(value)
    })
    it('creates a time range from other values', () => {
      expect(TimeRange.from(START, END)).toBeInstanceOf(TimeRange)
      expect(TimeRange.from(`${START}/${END}`)).toBeInstanceOf(TimeRange)
    })
  })

  describe('duration', () => {
    it('returns the exact elapsed duration', () => {
      expect(new TimeRange(START, END).duration.toISOString()).toBe('PT2H')
      expect(new TimeRange(START, START).duration.toISOString()).toBe('P0D')
      expect(new TimeRange(START, END).duration).toBeInstanceOf(Duration)
    })
    it('counts the real length of a day with a daylight saving transition', () => {
      const value = new TimeRange('2026-03-29T00:00:00', '2026-03-30T00:00:00', { timezone: 'Europe/Paris' })
      expect(value.duration.toISOString()).toBe('PT23H')
    })
  })

  describe('contains', () => {
    it('includes the start and excludes the end', () => {
      const value = new TimeRange(START, END)
      expect(value.contains(START)).toBe(true)
      expect(value.contains('2026-11-20T13:00:00Z')).toBe(true)
      expect(value.contains(END)).toBe(false)
      expect(value.contains('2026-11-20T11:59:59.999Z')).toBe(false)
    })
    it('contains nothing when empty', () => {
      expect(new TimeRange(START, START).contains(START)).toBe(false)
    })
    it('interprets strings without offset in its timezone', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      expect(value.contains('2026-11-20T14:30:00')).toBe(true)
      expect(value.contains('2026-11-20T12:30:00')).toBe(false)
    })
  })

  describe('overlaps and intersection', () => {
    it('recognizes identical time ranges as overlapping', () => {
      const value = new TimeRange(START, END)
      expect(value.overlaps(value)).toBe(true)
      expect(value.intersection(value).equals(value)).toBe(true)
    })
    it('detects overlapping time ranges', () => {
      const value = new TimeRange(START, END)
      expect(value.overlaps(new TimeRange('2026-11-20T13:00:00Z', '2026-11-20T15:00:00Z'))).toBe(true)
      expect(value.intersection(new TimeRange('2026-11-20T13:00:00Z', '2026-11-20T15:00:00Z')).toString())
        .toBe('2026-11-20T13:00:00.000Z/2026-11-20T14:00:00.000Z')
    })
    it('considers adjacent time ranges as disjoint', () => {
      const value = new TimeRange(START, END)
      const next = new TimeRange(END, '2026-11-20T16:00:00Z')
      expect(value.overlaps(next)).toBe(false)
      expect(value.intersection(next)).toBeNull()
    })
    it('returns null for disjoint intervals in both directions', () => {
      const first = new TimeRange(0, 1000)
      const second = new TimeRange(2000, 3000)
      expect(first.intersection(second)).toBeNull()
      expect(second.intersection(first)).toBeNull()
    })
    it('never overlaps with an empty time range', () => {
      const value = new TimeRange(START, END)
      const empty = new TimeRange('2026-11-20T13:00:00Z', '2026-11-20T13:00:00Z')
      expect(value.overlaps(empty)).toBe(false)
      expect(empty.overlaps(value)).toBe(false)
      expect(value.intersection(empty)).toBeNull()
    })
    it('returns the contained time range when one encloses the other', () => {
      const value = new TimeRange(START, END)
      const inner = new TimeRange('2026-11-20T12:30:00Z', '2026-11-20T13:30:00Z')
      expect(value.intersection(inner).equals(inner)).toBe(true)
    })
    it('keeps its own timezone for the intersection', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      const other = new TimeRange('2026-11-20T13:00:00Z', '2026-11-20T15:00:00Z', { timezone: 'Asia/Tokyo' })
      expect(value.intersection(other).timezone).toBe('Europe/Paris')
    })
    it('accepts snapshots and ISO 8601 intervals', () => {
      const value = new TimeRange(START, END)
      expect(value.overlaps({ start: '2026-11-20T13:00:00Z', end: '2026-11-20T15:00:00Z' })).toBe(true)
      expect(value.overlaps('2026-11-20T13:00:00Z/2026-11-20T15:00:00Z')).toBe(true)
    })
  })

  describe('shift', () => {
    it('shifts both bounds by a time duration, preserving the length', () => {
      const value = new TimeRange(START, END).shift('PT1H')
      expect(value.toString()).toBe('2026-11-20T13:00:00.000Z/2026-11-20T15:00:00.000Z')
      expect(new TimeRange(START, END).shift(-90, 'minutes').duration.toISOString()).toBe('PT2H')
    })
    it('shifts aligned calendar periods', () => {
      const january = new TimeRange('2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')
      expect(january.shift('P1M').toString()).toBe('2026-02-01T00:00:00.000Z/2026-03-01T00:00:00.000Z')
      expect(january.shift(new Duration('P1M')).duration.toISOString()).toBe('PT672H')
    })
    it('shifts calendar days in local time across daylight saving transitions', () => {
      const value = new TimeRange('2026-03-28T00:00:00', '2026-03-29T00:00:00', { timezone: 'Europe/Paris' })
      expect(value.shift('P1D').duration.toISOString()).toBe('PT23H')
    })
    it('distinguishes calendar and absolute shifts across daylight saving transitions', () => {
      const value = new TimeRange('2026-03-28T12:00:00', '2026-03-28T14:00:00', { timezone: 'Europe/Paris' })
      const calendar = value.shift('P1D')
      const absolute = value.shift('PT24H')
      expect(calendar.start.format('YYYY-MM-DD HH:mm')).toBe('2026-03-29 12:00')
      expect(absolute.start.format('YYYY-MM-DD HH:mm')).toBe('2026-03-29 13:00')
      expect(calendar.duration.asMilliseconds()).toBe(7200000)
      expect(absolute.duration.asMilliseconds()).toBe(7200000)
    })
    it('can shorten or empty a time range when bounds are clamped to the end of a month', () => {
      expect(new TimeRange('2026-01-30T00:00:00Z', '2026-01-31T00:00:00Z').shift('P1M').isEmpty()).toBe(true)
    })
    it('keeps the timezone and does not mutate the instance', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      expect(value.shift('PT1H').timezone).toBe('Europe/Paris')
      expect(value.start.toISOString()).toBe(START)
    })
    it('rejects invalid shift durations', () => {
      const value = new TimeRange(START, END)
      expect(() => value.shift('invalid')).toThrow(RangeError)
      expect(() => value.shift(3)).toThrow(TypeError)
      expect(() => value.shift(null)).toThrow(TypeError)
    })
  })

  describe('withTimezone and equals', () => {
    it('keeps the bounds and changes the timezone', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      const other = value.withTimezone('Asia/Tokyo')
      expect(other.timezone).toBe('Asia/Tokyo')
      expect(other.start.timezone).toBe('Asia/Tokyo')
      expect(other.equals(value)).toBe(true)
    })
    it('compares absolute bounds independently of timezone', () => {
      const value = new TimeRange(START, END)
      expect(value.equals(`${START}/${END}`)).toBe(true)
      expect(value.equals({ start: START, end: '2026-11-20T15:00:00Z' })).toBe(false)
    })
  })

  describe('serialization', () => {
    it('serializes to a snapshot with its timezone', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      expect(JSON.stringify(value)).toBe(`{"start":"${START}","end":"${END}","timezone":"Europe/Paris"}`)
    })
    it('round-trips through JSON', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      const restored = TimeRange.from(JSON.parse(JSON.stringify(value)))
      expect(restored.equals(value)).toBe(true)
      expect(restored.timezone).toBe('Europe/Paris')
    })
    it('writes and reads an ISO 8601 interval in UTC', () => {
      const value = new TimeRange(START, END, { timezone: 'Europe/Paris' })
      expect(value.toString()).toBe(`${START}/${END}`)
      expect(`${value}`).toBe(`${START}/${END}`)
      expect(new TimeRange(value.toString()).equals(value)).toBe(true)
    })
  })
})
