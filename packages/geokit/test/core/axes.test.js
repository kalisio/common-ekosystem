import { describe, it, expect, beforeEach } from 'vitest'
import { axes } from '../../src/core/axes.js'
import { locale } from '../../src/core/locale.js'

describe('axes', () => {
  beforeEach(() => {
    locale.set('en')
  })

  describe('constants', () => {
    it('exposes LATITUDE, LONGITUDE, ALTITUDE', () => {
      expect(axes.LATITUDE).toBe('LAT')
      expect(axes.LONGITUDE).toBe('LON')
      expect(axes.ALTITUDE).toBe('ALT')
    })

    it('is frozen — constants cannot be mutated', () => {
      expect(() => { axes.LATITUDE = 'oops' }).toThrow()
    })
  })

  describe('isLatitude', () => {
    it('returns true for LAT', () => {
      expect(axes.isLatitude('LAT')).toBe(true)
    })

    it('returns false for LON and ALT', () => {
      expect(axes.isLatitude('LON')).toBe(false)
      expect(axes.isLatitude('ALT')).toBe(false)
    })

    it('returns false for unknown values', () => {
      expect(axes.isLatitude('foo')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => axes.isLatitude(42)).toThrow()
      expect(() => axes.isLatitude(null)).toThrow()
    })
  })

  describe('isLongitude', () => {
    it('returns true for LON', () => {
      expect(axes.isLongitude('LON')).toBe(true)
    })

    it('returns false for LAT and ALT', () => {
      expect(axes.isLongitude('LAT')).toBe(false)
      expect(axes.isLongitude('ALT')).toBe(false)
    })

    it('returns false for unknown values', () => {
      expect(axes.isLongitude('foo')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => axes.isLongitude(42)).toThrow()
    })
  })

  describe('isAltitude', () => {
    it('returns true for ALT', () => {
      expect(axes.isAltitude('ALT')).toBe(true)
    })

    it('returns false for LAT and LON', () => {
      expect(axes.isAltitude('LAT')).toBe(false)
      expect(axes.isAltitude('LON')).toBe(false)
    })

    it('returns false for unknown values', () => {
      expect(axes.isAltitude('foo')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => axes.isAltitude(null)).toThrow()
    })
  })

  describe('isAxis', () => {
    it('returns true for any valid axis', () => {
      expect(axes.isAxis('LAT')).toBe(true)
      expect(axes.isAxis('LON')).toBe(true)
      expect(axes.isAxis('ALT')).toBe(true)
    })

    it('returns false for unknown values', () => {
      expect(axes.isAxis('foo')).toBe(false)
    })

    it('throws if not a string', () => {
      expect(() => axes.isAxis(42)).toThrow()
    })
  })

  describe('guessAxis', () => {
    describe('with direction hint', () => {
      it('returns LONGITUDE for E direction', () => {
        expect(axes.guessAxis(2.3, 'E')).toBe(axes.LONGITUDE)
      })

      it('returns LONGITUDE for W direction', () => {
        expect(axes.guessAxis(73.9, 'W')).toBe(axes.LONGITUDE)
      })

      it('returns LATITUDE for N direction', () => {
        expect(axes.guessAxis(48.8, 'N')).toBe(axes.LATITUDE)
      })

      it('returns LATITUDE for S direction', () => {
        expect(axes.guessAxis(40.7, 'S')).toBe(axes.LATITUDE)
      })
    })

    describe('without direction hint', () => {
      it('returns LONGITUDE if abs(coord) > 90', () => {
        expect(axes.guessAxis(91)).toBe(axes.LONGITUDE)
        expect(axes.guessAxis(-91)).toBe(axes.LONGITUDE)
        expect(axes.guessAxis(180)).toBe(axes.LONGITUDE)
        expect(axes.guessAxis(-180)).toBe(axes.LONGITUDE)
      })

      it('returns [LONGITUDE, LATITUDE] if ambiguous (abs <= 90)', () => {
        const result = axes.guessAxis(45)
        expect(result).toEqual([axes.LONGITUDE, axes.LATITUDE])
      })

      it('returns [LONGITUDE, LATITUDE] for 0', () => {
        expect(axes.guessAxis(0)).toEqual([axes.LONGITUDE, axes.LATITUDE])
      })

      it('returns [LONGITUDE, LATITUDE] for 90', () => {
        expect(axes.guessAxis(90)).toEqual([axes.LONGITUDE, axes.LATITUDE])
      })

      it('returns [LONGITUDE, LATITUDE] for -90', () => {
        expect(axes.guessAxis(-90)).toEqual([axes.LONGITUDE, axes.LATITUDE])
      })
    })

    it('throws if coord is not a number', () => {
      expect(() => axes.guessAxis('foo')).toThrow()
    })

    it('throws if dir is invalid', () => {
      expect(() => axes.guessAxis(45, 'foo')).toThrow()
    })
  })
})
