import moment from 'moment-timezone'
import { timezone } from '../../src/utilities/index.js'
import 'moment/locale/fr.js'

describe('timezone', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('isValid', () => {
    it('returns false for an invalid timezone that matches an inherited property', () => {
      expect(timezone.isValid('constructor')).toBe(false)
      expect(timezone.isValid('__proto__')).toBe(false)
    })
    it('accepts IANA names, links and UTC', () => {
      expect(timezone.isValid('Europe/Paris')).toBe(true)
      expect(timezone.isValid('US/Eastern')).toBe(true)
      expect(timezone.isValid('UTC')).toBe(true)
      expect(timezone.isValid('Etc/GMT+1')).toBe(true)
    })
    it('accepts case-insensitive zone names', () => {
      expect(timezone.isValid('europe/paris')).toBe(true)
      expect(timezone.isValid('us/eastern')).toBe(true)
      expect(timezone.isValid('utc')).toBe(true)
    })
    it('rejects unknown names and non strings', () => {
      for (const value of ['Mars/Olympus', '', ' ', null, undefined, 42, {}, []]) {
        expect(timezone.isValid(value)).toBe(false)
      }
    })
  })

  describe('normalize', () => {
    it('returns the normalized spelling of a zone name', () => {
      expect(timezone.normalize('europe/paris')).toBe('Europe/Paris')
      expect(timezone.normalize('Europe/Paris')).toBe('Europe/Paris')
      expect(timezone.normalize('utc')).toBe('UTC')
    })
    it('keeps link names', () => {
      expect(timezone.normalize('us/eastern')).toBe('US/Eastern')
    })
    it('is idempotent', () => {
      const name = timezone.normalize('europe/paris')
      expect(timezone.normalize(name)).toBe(name)
    })
    it('throws for invalid zones', () => {
      for (const value of ['Mars/Olympus', '', null, 42]) {
        expect(() => timezone.normalize(value)).toThrow(RangeError)
      }
    })
  })

  describe('guess', () => {
    it('returns a valid zone name', () => {
      expect(timezone.isValid(timezone.guess())).toBe(true)
    })
    it('prefers the Intl zone, UTC included', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: 'UTC' }) })
      expect(timezone.guess()).toBe('UTC')
    })
    it('normalizes the zone returned by Intl', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: 'europe/paris' }) })
      expect(timezone.guess()).toBe('Europe/Paris')
    })
    it('falls back to moment when Intl returns no zone', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: undefined }) })
      const fallback = vi.spyOn(moment.tz, 'guess').mockReturnValue('UTC')
      expect(timezone.guess()).toBe('UTC')
      expect(fallback).toHaveBeenCalledOnce()
    })
    it('falls back to moment when Intl returns an invalid zone', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({ resolvedOptions: () => ({ timeZone: 'Mars/Olympus' }) })
      const fallback = vi.spyOn(moment.tz, 'guess').mockReturnValue('Europe/Paris')
      expect(timezone.guess()).toBe('Europe/Paris')
      expect(fallback).toHaveBeenCalledOnce()
    })
  })

  describe('list', () => {
    it('includes known zone names', () => {
      expect(timezone.list()).toEqual(expect.arrayContaining(['Europe/Paris', 'America/New_York', 'UTC']))
    })
    it('returns a fresh array', () => {
      const names = timezone.list()
      names.push('Mars/Olympus')
      expect(timezone.list()).not.toContain('Mars/Olympus')
    })
    it('returns only valid zone names', () => {
      const names = timezone.list()
      expect(names.length).toBeGreaterThan(0)
      expect(names.every(timezone.isValid)).toBe(true)
    })
    it('filters timezones by country', () => {
      const france = timezone.list('FR')
      const usa = timezone.list('US')
      expect(france).toContain('Europe/Paris')
      expect(france).not.toContain('America/New_York')
      expect(usa).toContain('America/New_York')
      expect(usa).toContain('America/Los_Angeles')
      expect(usa).not.toContain('Europe/Paris')
    })
    it('accepts case-insensitive country codes', () => {
      expect(timezone.list('fr')).toEqual(timezone.list('FR'))
      expect(timezone.list('us')).toEqual(timezone.list('US'))
    })
    it('returns all timezones when country is undefined', () => {
      expect(timezone.list(undefined)).toEqual(timezone.list())
    })
    it('returns a fresh array when filtering by country', () => {
      const zones = timezone.list('FR')
      zones.push('Invalid/Timezone')
      expect(timezone.list('FR')).not.toContain('Invalid/Timezone')
    })
    it('rejects non-string country codes', () => {
      for (const country of [null, 42, {}, []]) {
        expect(() => timezone.list(country)).toThrow(TypeError)
      }
    })
    it('rejects invalid or unknown country codes', () => {
      for (const country of ['', 'F', 'FRA', 'F1', 'ZZ']) {
        expect(() => timezone.list(country)).toThrow(RangeError)
      }
    })
  })

  describe('offset', () => {
    it('returns the offset in minutes, positive east of Greenwich', () => {
      expect(timezone.offset('UTC', 0)).toBe(0)
      expect(timezone.offset('Europe/Paris', new Date('2026-01-15T12:00:00Z'))).toBe(60)
      expect(timezone.offset('Europe/Paris', new Date('2026-07-01T12:00:00Z'))).toBe(120)
      expect(timezone.offset('America/New_York', Date.UTC(2026, 0, 15, 12))).toBe(-300)
      expect(timezone.offset('Asia/Kolkata', 0)).toBe(330)
    })
    it('supports non-hour offsets', () => {
      expect(timezone.offset('Asia/Kathmandu', '2026-01-15T12:00:00Z')).toBe(345)
      expect(timezone.offset('Australia/Adelaide', '2026-07-01T12:00:00Z')).toBe(570)
    })
    it('follows the inverted sign convention of Etc/GMT zones', () => {
      expect(timezone.offset('Etc/GMT+1', 0)).toBe(-60)
      expect(timezone.offset('Etc/GMT-2', 0)).toBe(120)
    })
    it('accepts equivalent instant representations', () => {
      const iso = '2026-07-01T12:00:00Z'
      const instant = new Date(iso)
      expect(timezone.offset('Europe/Paris', iso)).toBe(120)
      expect(timezone.offset('Europe/Paris', instant)).toBe(120)
      expect(timezone.offset('Europe/Paris', instant.getTime())).toBe(120)
      expect(timezone.offset('Europe/Paris', '2026-07-01T14:00:00+02:00')).toBe(120)
    })
    it('interprets ISO strings without offset in the zone', () => {
      expect(timezone.offset('Europe/Paris', '2026-01-15T12:00:00')).toBe(60)
      expect(timezone.offset('Europe/Paris', '2026-07-01T12:00:00')).toBe(120)
      expect(timezone.offset('Europe/Paris', '2026-01-15')).toBe(60)
    })
    it('handles the spring DST transition', () => {
      expect(timezone.offset('Europe/Paris', '2026-03-29T00:59:59Z')).toBe(60)
      expect(timezone.offset('Europe/Paris', '2026-03-29T01:00:00Z')).toBe(120)
    })
    it('moves a nonexistent local time forward into summer time', () => {
      expect(timezone.offset('Europe/Paris', '2026-03-29T02:30:00')).toBe(120)
    })
    it('handles the autumn DST transition', () => {
      expect(timezone.offset('Europe/Paris', '2026-10-25T00:59:59Z')).toBe(120)
      expect(timezone.offset('Europe/Paris', '2026-10-25T01:00:00Z')).toBe(60)
    })
    it('uses the earlier occurrence of an ambiguous local time', () => {
      expect(timezone.offset('Europe/Paris', '2026-10-25T02:30:00')).toBe(120)
      expect(timezone.offset('Europe/Paris', '2026-10-25T03:30:00')).toBe(60)
    })
    it('respects explicit offsets for ambiguous local times', () => {
      expect(timezone.offset('Europe/Paris', '2026-10-25T02:30:00+02:00')).toBe(120)
      expect(timezone.offset('Europe/Paris', '2026-10-25T02:30:00+01:00')).toBe(60)
    })
    it('does not mutate a Date input', () => {
      const instant = new Date('2026-07-01T12:00:00Z')
      const timestamp = instant.getTime()
      timezone.offset('Europe/Paris', instant)
      expect(instant.getTime()).toBe(timestamp)
    })
    it('defaults to the current instant', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-01T00:00:00Z'))
      expect(timezone.offset('Europe/Paris')).toBe(120)
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      expect(timezone.offset('Europe/Paris')).toBe(60)
    })
    it('treats an undefined instant as omitted', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-01T00:00:00Z'))
      expect(timezone.offset('Europe/Paris', undefined)).toBe(120)
    })
    it('throws for an invalid zone', () => {
      expect(() => timezone.offset('Mars/Olympus', 0)).toThrow(RangeError)
      expect(() => timezone.offset(null, 0)).toThrow(RangeError)
    })
    it('rejects unsupported instant types', () => {
      for (const value of [NaN, Infinity, -Infinity, null, {}, [], true, '']) {
        expect(() => timezone.offset('Europe/Paris', value)).toThrow(TypeError)
      }
    })
    it('rejects invalid dates and malformed ISO strings', () => {
      expect(() => timezone.offset('Europe/Paris', new Date(NaN))).toThrow(RangeError)
      expect(() => timezone.offset('Europe/Paris', '01/07/2026')).toThrow(RangeError)
      expect(() => timezone.offset('Europe/Paris', '2026-02-30')).toThrow(RangeError)
      expect(() => timezone.offset('Europe/Paris', 'not-a-date')).toThrow(RangeError)
    })
  })

  describe('abbreviation', () => {
    it('returns the abbreviation in effect at the instant', () => {
      expect(timezone.abbreviation('Europe/Paris', new Date('2026-01-15T12:00:00Z'))).toBe('CET')
      expect(timezone.abbreviation('Europe/Paris', new Date('2026-07-01T12:00:00Z'))).toBe('CEST')
    })
    it('changes abbreviation at DST transitions', () => {
      expect(timezone.abbreviation('Europe/Paris', '2026-03-29T00:59:59Z')).toBe('CET')
      expect(timezone.abbreviation('Europe/Paris', '2026-03-29T01:00:00Z')).toBe('CEST')
      expect(timezone.abbreviation('Europe/Paris', '2026-10-25T01:00:00Z')).toBe('CET')
    })
    it('returns a numeric abbreviation when the zone has none', () => {
      expect(timezone.abbreviation('America/Sao_Paulo', 0)).toBe('-03')
    })
    it('accepts timestamps and ISO strings', () => {
      expect(timezone.abbreviation('Europe/Paris', Date.UTC(2026, 6, 1, 12))).toBe('CEST')
      expect(timezone.abbreviation('Europe/Paris', '2026-07-01T14:00:00+02:00')).toBe('CEST')
    })
    it('defaults to the current instant', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
      expect(timezone.abbreviation('Europe/Paris')).toBe('CET')
    })
    it('rejects invalid zones and instants', () => {
      expect(() => timezone.abbreviation('Mars/Olympus', 0)).toThrow(RangeError)
      expect(() => timezone.abbreviation('UTC', null)).toThrow(TypeError)
      expect(() => timezone.abbreviation('UTC', new Date(NaN))).toThrow(RangeError)
      expect(() => timezone.abbreviation('UTC', 'invalid')).toThrow(RangeError)
    })
  })

  describe('format', () => {
    it('formats timezone offsets', () => {
      expect(timezone.format('Europe/Paris', '2026-01-15T12:00:00Z', 'Z')).toBe('+01:00')
      expect(timezone.format('Europe/Paris', '2026-07-15T12:00:00Z', 'Z')).toBe('+02:00')
      expect(timezone.format('America/New_York', '2026-01-15T12:00:00Z', 'Z')).toBe('-05:00')
      expect(timezone.format('Asia/Kathmandu', '2026-01-15T12:00:00Z', 'Z')).toBe('+05:45')
    })
    it('supports Moment timezone formatting tokens', () => {
      const at = '2026-07-15T12:00:00Z'
      expect(timezone.format('Europe/Paris', at, 'Z')).toBe('+02:00')
      expect(timezone.format('Europe/Paris', at, 'ZZ')).toBe('+0200')
      expect(timezone.format('Europe/Paris', at, 'z')).toBe('CEST')
      expect(timezone.format('Europe/Paris', at, '[UTC]Z')).toBe('UTC+02:00')
    })
    it('formats dates in the specified timezone', () => {
      const at = '2026-07-15T12:00:00Z'
      expect(timezone.format('Europe/Paris', at, 'YYYY-MM-DD HH:mm')).toBe('2026-07-15 14:00')
      expect(timezone.format('America/New_York', at, 'YYYY-MM-DD HH:mm')).toBe('2026-07-15 08:00')
      expect(timezone.format('UTC', at, 'YYYY-MM-DD HH:mm')).toBe('2026-07-15 12:00')
    })
    it('handles daylight saving transitions', () => {
      expect(timezone.format('Europe/Paris', '2026-03-29T00:59:59Z', 'HH:mm z')).toBe('01:59 CET')
      expect(timezone.format('Europe/Paris', '2026-03-29T01:00:00Z', 'HH:mm z')).toBe('03:00 CEST')
      expect(timezone.format('Europe/Paris', '2026-10-25T00:59:59Z', 'HH:mm z')).toBe('02:59 CEST')
      expect(timezone.format('Europe/Paris', '2026-10-25T01:00:00Z', 'HH:mm z')).toBe('02:00 CET')
    })
    it('uses the current instant and Z format by default', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-15T12:00:00Z'))
      expect(timezone.format('Europe/Paris')).toBe('+02:00')
      expect(timezone.format('UTC')).toBe('+00:00')
    })
    it('accepts Date, timestamps and ISO strings', () => {
      const at = '2026-07-15T12:00:00Z'
      expect(timezone.format('Europe/Paris', at)).toBe('+02:00')
      expect(timezone.format('Europe/Paris', new Date(at))).toBe('+02:00')
      expect(timezone.format('Europe/Paris', Date.parse(at))).toBe('+02:00')
    })
    it('interprets local ISO strings in the specified timezone', () => {
      expect(timezone.format('Europe/Paris', '2026-07-15T12:00:00', 'HH:mm Z')).toBe('12:00 +02:00')
      expect(timezone.format('Europe/Paris', '2026-07-15T12:00:00Z', 'HH:mm Z')).toBe('14:00 +02:00')
    })
    it('supports explicit locales', () => {
      expect(timezone.format('Europe/Paris', '2026-11-20T12:00:00Z', 'dddd D MMMM', { locale: 'fr' }))
        .toBe('vendredi 20 novembre')
      expect(timezone.format('Europe/Paris', '2026-11-20T12:00:00Z', 'dddd D MMMM', { locale: 'en' }))
        .toBe('Friday 20 November')
    })
    it('rejects invalid timezones', () => {
      expect(() => timezone.format('Mars/Olympus', 0)).toThrow(RangeError)
      expect(() => timezone.format(null, 0)).toThrow(RangeError)
    })
    it('rejects invalid patterns', () => {
      for (const pattern of ['', null, 42]) {
        expect(() => timezone.format('UTC', 0, pattern)).toThrow(TypeError)
      }
    })
    it('rejects unknown or unloaded locales', () => {
      for (const locale of ['xx', '', null]) {
        expect(() => timezone.format('UTC', 0, 'Z', { locale })).toThrow(RangeError)
      }
    })
    it('rejects invalid dates', () => {
      expect(() => timezone.format('UTC', 'invalid')).toThrow(RangeError)
      expect(() => timezone.format('UTC', new Date(NaN))).toThrow(RangeError)
      expect(() => timezone.format('UTC', null)).toThrow(TypeError)
    })
  })
})
