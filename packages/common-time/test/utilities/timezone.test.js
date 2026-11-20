import moment from 'moment-timezone'
import { timezone } from '../../src/utilities/index.js'

describe('timezone', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('isValid', () => {
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
})
