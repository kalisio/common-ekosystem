import { describe, it, expect } from 'vitest'
import { Coords } from '../../src/geometry/coords.js'

describe('Coords', () => {
  describe('constructor', () => {
    it('creates empty coords without argument', () => {
      const c = Coords()
      expect(c.longitude).toBeNull()
      expect(c.latitude).toBeNull()
      expect(c.altitude).toBeNull()
    })

    it('parses a 2D array', () => {
      const c = Coords([1.5, 48.8])
      expect(c.longitude).toBe(1.5)
      expect(c.latitude).toBe(48.8)
      expect(c.altitude).toBeNull()
    })

    it('parses a 3D array', () => {
      const c = Coords([1.5, 48.8, 100])
      expect(c.longitude).toBe(1.5)
      expect(c.latitude).toBe(48.8)
      expect(c.altitude).toBe(100)
    })

    it('ignores an array with less than 2 elements', () => {
      const c = Coords([1.5])
      expect(c.longitude).toBeNull()
    })

    it('parses an object with lon/lat', () => {
      const c = Coords({ lon: 1.5, lat: 48.8 })
      expect(c.longitude).toBe(1.5)
      expect(c.latitude).toBe(48.8)
    })

    it('parses an object with longitude/latitude', () => {
      const c = Coords({ longitude: 1.5, latitude: 48.8 })
      expect(c.longitude).toBe(1.5)
      expect(c.latitude).toBe(48.8)
    })

    it('parses an object with x/y/z', () => {
      const c = Coords({ x: 1.5, y: 48.8, z: 100 })
      expect(c.longitude).toBe(1.5)
      expect(c.latitude).toBe(48.8)
      expect(c.altitude).toBe(100)
    })

    it('parses an object with alt', () => {
      expect(Coords({ lon: 1, lat: 2, alt: 50 }).altitude).toBe(50)
    })

    it('parses an object with altitude', () => {
      expect(Coords({ lon: 1, lat: 2, altitude: 50 }).altitude).toBe(50)
    })
  })

  describe('dimension', () => {
    it('returns 2 without altitude', () => {
      expect(Coords([1, 2]).dimension).toBe(2)
    })

    it('returns 3 with altitude', () => {
      expect(Coords([1, 2, 3]).dimension).toBe(3)
    })
  })

  describe('isValid', () => {
    it('validates correct 2D coords', () => {
      expect(Coords([1.5, 48.8]).isValid()).toBe(true)
    })

    it('validates correct 3D coords', () => {
      expect(Coords([1.5, 48.8, 100]).isValid()).toBe(true)
    })

    it('invalidates if longitude is missing', () => {
      expect(Coords([null, 48.8]).isValid()).toBe(false)
    })

    it('invalidates if latitude is missing', () => {
      const c = Coords([1.5, 48.8])
      c.latitude = null
      expect(c.isValid()).toBe(false)
    })

    it('invalidates if altitude is not a number', () => {
      const c = Coords([1.5, 48.8, 100])
      c.altitude = 'foo'
      expect(c.isValid()).toBe(false)
    })

    it('invalidates without argument', () => {
      expect(Coords().isValid()).toBe(false)
    })
  })

  describe('setters', () => {
    it('updates longitude/latitude/altitude', () => {
      const c = Coords([1, 2])
      c.longitude = 10
      c.latitude = 20
      c.altitude = 30
      expect(c.longitude).toBe(10)
      expect(c.latitude).toBe(20)
      expect(c.altitude).toBe(30)
    })
  })

  describe('normalize', () => {
    it('does not modify already valid coords', () => {
      const c = Coords([2.3488, 48.8534])
      c.normalize()
      expect(c.longitude).toBeCloseTo(2.3488, 4)
      expect(c.latitude).toBeCloseTo(48.8534, 4)
    })

    it('normalizes longitude > 180', () => {
      // 200 → 200 - 360 = -160
      const c = Coords([200, 48])
      c.normalize()
      expect(c.longitude).toBeCloseTo(-160, 5)
    })

    it('normalizes longitude < -180', () => {
      // -200 → -200 + 360 = 160
      const c = Coords([-200, 48])
      c.normalize()
      expect(c.longitude).toBeCloseTo(160, 5)
    })

    it('normalizes longitude = 360', () => {
      const c = Coords([360, 48])
      c.normalize()
      expect(c.longitude).toBe(0)
    })

    it('normalizes longitude = -360', () => {
      const c = Coords([-360, 48])
      c.normalize()
      expect(c.longitude).toBe(0)
    })

    it('normalizes -180 → 180', () => {
      const c = Coords([-180, 48])
      c.normalize()
      expect(c.longitude).toBe(-180)
    })

    it('normalizes latitude > 90 (north pole bounce)', () => {
      // lat=100 → after modulo → 80 (bounce), lon=10+180=190 → normalized → -170
      const c = Coords([10, 100])
      c.normalize()
      expect(c.latitude).toBeCloseTo(80, 5)
      expect(c.longitude).toBeCloseTo(-170, 5)
    })

    it('normalizes latitude < -90 (south pole bounce)', () => {
      // lat=-100 → after modulo → -80 (bounce), lon=10+180=190 → normalized → -170
      const c = Coords([10, -100])
      c.normalize()
      expect(c.latitude).toBeCloseTo(-80, 5)
      expect(c.longitude).toBeCloseTo(-170, 5)
    })

    it('normalizes latitude and longitude simultaneously', () => {
      // lat=100 → 80, lon=200+180=380 → normalized → 20
      const c = Coords([200, 100])
      c.normalize()
      expect(c.latitude).toBeCloseTo(80, 5)
      expect(c.longitude).toBeCloseTo(20, 5)
    })

    it('does not touch altitude', () => {
      const c = Coords([200, 48, 1000])
      c.normalize()
      expect(c.altitude).toBe(1000)
    })

    it('returns this for chaining', () => {
      const c = Coords([200, 48])
      expect(c.normalize()).toBe(c)
    })

    it('throws if invalid', () => {
      expect(() => Coords().normalize()).toThrow()
    })
  })

  describe('truncate', () => {
    it('truncates to default precision (7)', () => {
      const c = Coords([1.123456789, 48.987654321])
      c.truncate()
      expect(c.longitude).toBe(1.1234568)
      expect(c.latitude).toBe(48.9876543)
    })

    it('truncates to a given precision', () => {
      const c = Coords([1.123456789, 48.987654321])
      c.truncate(2)
      expect(c.longitude).toBe(1.12)
      expect(c.latitude).toBe(48.99)
    })

    it('truncates altitude as well', () => {
      const c = Coords([1.1, 2.2, 100.123456789])
      c.truncate(3)
      expect(c.altitude).toBe(100.123)
    })

    it('returns this for chaining', () => {
      const c = Coords([1.1, 2.2])
      expect(c.truncate()).toBe(c)
    })

    it('throws if precision is out of range', () => {
      expect(() => Coords([1, 2]).truncate(9)).toThrow()
    })

    it('throws if coords are invalid', () => {
      expect(() => Coords().truncate()).toThrow()
    })

    it('chains normalize().truncate()', () => {
      // lon=200.123456789 → normalized → -159.876543211 → truncated(4) → -159.8765
      // lat=48.987654321 → unchanged → truncated(4) → 48.9877
      const c = Coords([200.123456789, 48.987654321])
      c.normalize().truncate(4)
      expect(c.longitude).toBe(-159.8765)
      expect(c.latitude).toBe(48.9877)
    })
  })

  describe('toArray', () => {
    it('returns [lon, lat] in 2D', () => {
      expect(Coords([1.5, 48.8]).toArray()).toEqual([1.5, 48.8])
    })

    it('returns [lon, lat, alt] in 3D', () => {
      expect(Coords([1.5, 48.8, 100]).toArray()).toEqual([1.5, 48.8, 100])
    })

    it('returns null if invalid', () => {
      expect(Coords().toArray()).toBeNull()
    })
  })

  describe('toJSON', () => {
    it('returns { lon, lat } in 2D', () => {
      expect(Coords([1.5, 48.8]).toJSON()).toEqual({ lon: 1.5, lat: 48.8 })
    })

    it('returns { lon, lat, alt } in 3D', () => {
      expect(Coords([1.5, 48.8, 100]).toJSON()).toEqual({ lon: 1.5, lat: 48.8, alt: 100 })
    })

    it('returns null if invalid', () => {
      expect(Coords().toJSON()).toBeNull()
    })
  })

  describe('toGeoJSON', () => {
    it('returns coordinates in 2D', () => {
      expect(Coords([1.5, 48.8]).toGeoJSON()).toEqual({ coordinates: [1.5, 48.8] })
    })

    it('returns coordinates in 3D', () => {
      expect(Coords([1.5, 48.8, 100]).toGeoJSON()).toEqual({ coordinates: [1.5, 48.8, 100] })
    })

    it('returns null if invalid', () => {
      expect(Coords().toGeoJSON()).toBeNull()
    })

    it('coordinates are isolated (no reference leak)', () => {
      const c = Coords([1.5, 48.8])
      const geo = c.toGeoJSON()
      geo.coordinates[0] = 999
      expect(c.longitude).toBe(1.5)
    })
  })

  describe('toSexagesimal', () => {
    it('returns DMS values for lon and lat', () => {
      // Paris: lon=2.3488, lat=48.8534
      const dms = Coords([2.3488, 48.8534]).toSexagesimal()
      expect(dms.lon.deg).toBe(2)
      expect(dms.lon.min).toBe(20)
      expect(dms.lon.sec).toBeCloseTo(55.68, 1)
      expect(dms.lon.dir).toBe('E')
      expect(dms.lat.deg).toBe(48)
      expect(dms.lat.min).toBe(51)
      expect(dms.lat.sec).toBeCloseTo(12.24, 1)
      expect(dms.lat.dir).toBe('N')
    })

    it('returns S and W for negative coordinates', () => {
      const dms = Coords([-73.9857, -40.7128]).toSexagesimal()
      expect(dms.lon.dir).toBe('W')
      expect(dms.lat.dir).toBe('S')
    })

    it('includes alt if defined', () => {
      const dms = Coords([1.5, 48.8, 100]).toSexagesimal()
      expect(dms.alt).toBe(100)
    })

    it('does not include alt if absent', () => {
      const dms = Coords([1.5, 48.8]).toSexagesimal()
      expect(dms.alt).toBeUndefined()
    })

    it('returns null if invalid', () => {
      expect(Coords().toSexagesimal()).toBeNull()
    })
  })

  describe('toString', () => {
    it('format FFf (degrees minutes seconds)', () => {
      const s = Coords([2.3488, 48.8534]).toString('FFf')
      expect(s).toContain('°')
      expect(s).toContain('′')
      expect(s).toContain('″')
      expect(s).toContain('N')
      expect(s).toContain('E')
    })

    it('format Ff (degrees decimal minutes)', () => {
      const s = Coords([2.3488, 48.8534]).toString('Ff')
      expect(s).toContain('′')
      expect(s).not.toContain('″')
    })

    it('format f (decimal degrees)', () => {
      const s = Coords([2.3488, 48.8534]).toString('f')
      expect(s).toContain('°')
      expect(s).not.toContain('′')
    })

    it('format AERO matches expected pattern', () => {
      const s = Coords([2.3488, 48.8534]).toString('AERO')
      expect(s).toMatch(/^\d{2}\d{3}[NS] \d{3}\d{3}[EW]$/)
      expect(s).toContain('N')
      expect(s).toContain('E')
    })

    it('format AERO exact values for Paris', () => {
      // lat=48.8534 → deg=48, min=51, sec=12.24 → latMin = floor(51*10 + 12.24/6) = floor(512.04) = 512
      // lon=2.3488  → deg=02, min=20, sec=55.68 → lonMin = floor(20*10 + 55.68/6) = floor(209.28) = 209
      const s = Coords([2.3488, 48.8534]).toString('AERO')
      expect(s).toBe('48512N 002209E')
    })

    it('format AERO with negative coordinates', () => {
      const s = Coords([-73.9857, -40.7128]).toString('AERO')
      expect(s).toContain('S')
      expect(s).toContain('W')
    })

    it('custom lat/lon separator', () => {
      const s = Coords([2.3488, 48.8534]).toString('f', { latLonSeparator: ' / ' })
      expect(s).toContain(' / ')
    })

    it('custom decimal places', () => {
      const s = Coords([2.3488, 48.8534]).toString('f', { decimalPlaces: 2 })
      const parts = s.split(' ')
      parts.forEach(p => {
        const match = p.match(/(\d+\.\d+)/)
        if (match) expect(match[1].split('.')[1].length).toBeLessThanOrEqual(2)
      })
    })

    it('throws if format is undefined', () => {
      expect(() => Coords([1, 2]).toString()).toThrow()
    })

    it('throws if format is empty string', () => {
      expect(() => Coords([1, 2]).toString('')).toThrow()
    })

    it('returns null if invalid', () => {
      expect(Coords().toString('f')).toBeNull()
    })
  })

  describe('private value', () => {
    it('does not expose value directly', () => {
      expect(Coords([1.5, 48.8]).value).toBeUndefined()
    })
  })
})
