import { describe, it, expect, beforeEach } from 'vitest'
import { locale, axes, coordinate } from '../../src/core'

describe('coordinate', () => {
  beforeEach(() => {
    locale.set('en')
  })

  describe('normalize', () => {
    describe('longitude', () => {
      it('does not modify a valid longitude', () => {
        console.log(axes)
        expect(coordinate.normalize(2.3488, axes.LONGITUDE)).toBeCloseTo(2.3488, 5)
      })

      it('wraps longitude > 180', () => {
        // 200 → 200 - 360 = -160
        expect(coordinate.normalize(200, 'LON')).toBeCloseTo(-160, 5)
      })

      it('wraps longitude < -180', () => {
        // -200 → -200 + 360 = 160
        expect(coordinate.normalize(-200, 'LON')).toBeCloseTo(160, 5)
      })

      it('wraps longitude = 360', () => {
        expect(coordinate.normalize(360, 'LON')).toBe(0)
      })

      it('normalizes -540 → 180', () => {
        // -540 → after modulo → -180 → corrected to 180
        expect(coordinate.normalize(-540, 'LON')).toBe(180)
      })

      it('fixes -0 edge case', () => {
        expect(Object.is(coordinate.normalize(-360, 'LON'), -0)).toBe(false)
      })
    })

    describe('latitude', () => {
      it('does not modify a valid latitude', () => {
        expect(coordinate.normalize(48.8534, 'LAT')).toBeCloseTo(48.8534, 5)
      })

      it('clamps latitude > 90 to 90', () => {
        expect(coordinate.normalize(100, 'LAT')).toBe(90)
      })

      it('clamps latitude < -90 to -90', () => {
        expect(coordinate.normalize(-100, 'LAT')).toBe(-90)
      })

      it('clamps latitude = 91 to 90', () => {
        expect(coordinate.normalize(91, 'LAT')).toBe(90)
      })
    })

    it('throws if coord is not a number', () => {
      expect(() => coordinate.normalize('foo', 'LON')).toThrow()
    })

    it('throws if axis is invalid', () => {
      expect(() => coordinate.normalize(45, 'ALT')).toThrow()
      expect(() => coordinate.normalize(45, 'foo')).toThrow()
    })
  })

  describe('toSexagesimal', () => {
    it('converts a positive longitude without axis', () => {
      // 2.3488 → 2° 20' 55.68"
      const r = coordinate.toSexagesimal(2.3488)
      expect(r.deg).toBe(2)
      expect(r.min).toBe(20)
      expect(r.sec).toBeCloseTo(55.68, 1)
      expect(r.dir).toBeUndefined()
    })

    it('converts a negative number without axis', () => {
      const r = coordinate.toSexagesimal(-2.3488)
      expect(r.deg).toBe(-2)
      expect(r.min).toBe(20)
      expect(r.sec).toBeCloseTo(55.68, 1)
    })

    it('converts with axis LON → dir E', () => {
      const r = coordinate.toSexagesimal(2.3488, 'LON')
      expect(r.deg).toBe(2)
      expect(r.min).toBe(20)
      expect(r.sec).toBeCloseTo(55.68, 1)
      expect(r.dir).toBe('E')
    })

    it('converts with axis LON → dir W if negative', () => {
      const r = coordinate.toSexagesimal(-73.9857, 'LON')
      expect(r.dir).toBe('W')
      expect(r.deg).toBe(73)
    })

    it('converts with axis LAT → dir N', () => {
      // Paris: lat=48.8534 → 48° 51' 12.24"
      const r = coordinate.toSexagesimal(48.8534, 'LAT')
      expect(r.dir).toBe('N')
      expect(r.deg).toBe(48)
      expect(r.min).toBe(51)
      expect(r.sec).toBeCloseTo(12.24, 1)
    })

    it('converts with axis LAT → dir S if negative', () => {
      const r = coordinate.toSexagesimal(-40.7128, 'LAT')
      expect(r.dir).toBe('S')
      expect(r.deg).toBe(40)
    })

    it('converts 0 correctly with LAT axis', () => {
      const r = coordinate.toSexagesimal(0, 'LAT')
      expect(r.deg).toBe(0)
      expect(r.min).toBe(0)
      expect(r.sec).toBeCloseTo(0, 5)
      expect(r.dir).toBe('N')
    })

    it('throws if coord is not a number', () => {
      expect(() => coordinate.toSexagesimal('foo')).toThrow()
    })

    it('throws if axis is invalid', () => {
      expect(() => coordinate.toSexagesimal(2.3, 'ALT')).toThrow()
      expect(() => coordinate.toSexagesimal(2.3, 'foo')).toThrow()
    })
  })

  describe('fromSexagesimal', () => {
    it('converts integer degrees', () => {
      expect(coordinate.fromSexagesimal(48)).toBeCloseTo(48, 5)
    })

    it('converts degrees + minutes', () => {
      expect(coordinate.fromSexagesimal(48, 30)).toBeCloseTo(48.5, 5)
    })

    it('converts degrees + minutes + seconds', () => {
      // 2° 20' 55.68" = 2 + 20/60 + 55.68/3600 ≈ 2.3488
      expect(coordinate.fromSexagesimal(2, 20, 55.68)).toBeCloseTo(2.3488, 3)
    })

    it('preserves negative sign', () => {
      expect(coordinate.fromSexagesimal(-48, 30)).toBeCloseTo(-48.5, 5)
    })

    it('applies sign from dir S', () => {
      expect(coordinate.fromSexagesimal(48, 30, 0, 'S')).toBeCloseTo(-48.5, 5)
    })

    it('applies sign from dir W', () => {
      expect(coordinate.fromSexagesimal(2, 20, 55.68, 'W')).toBeCloseTo(-2.3488, 3)
    })

    it('applies sign from dir N (positive)', () => {
      expect(coordinate.fromSexagesimal(48, 30, 0, 'N')).toBeCloseTo(48.5, 5)
    })

    it('applies sign from dir E (positive)', () => {
      expect(coordinate.fromSexagesimal(2, 20, 0, 'E')).toBeCloseTo(2.3333, 3)
    })

    it('throws if deg is not a number', () => {
      expect(() => coordinate.fromSexagesimal('foo')).toThrow()
    })

    it('throws if min is out of range', () => {
      expect(() => coordinate.fromSexagesimal(48, 61)).toThrow()
    })

    it('throws if sec is out of range', () => {
      expect(() => coordinate.fromSexagesimal(48, 0, 61)).toThrow()
    })

    it('throws if deg is negative with a dir', () => {
      expect(() => coordinate.fromSexagesimal(-48, 0, 0, 'N')).toThrow()
    })

    it('round-trip toSexagesimal → fromSexagesimal ≈ original', () => {
      const original = 2.3488
      const dms = coordinate.toSexagesimal(original, 'LON')
      const back = coordinate.fromSexagesimal(dms.deg, dms.min, dms.sec, dms.dir)
      expect(back).toBeCloseTo(original, 4)
    })
  })
})
