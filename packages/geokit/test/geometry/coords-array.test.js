import { describe, it, expect, vi } from 'vitest'
import { CoordsArray } from '../../src/geometry/coords-array.js'

describe('CoordsArray', () => {
  describe('constructor', () => {
    it('creates an empty array without argument', () => {
      const ca = CoordsArray()
      expect(ca.length).toBe(0)
      expect(ca.isValid).toBe(true)
    })

    it('parses an array of 2D arrays', () => {
      const ca = CoordsArray([[1.5, 48.8], [2.3, 43.6]])
      expect(ca.length).toBe(2)
      expect(ca.stride).toBe(2)
      expect(ca.isValid).toBe(true)
    })

    it('parses an array of 3D arrays', () => {
      const ca = CoordsArray([[1.5, 48.8, 100], [2.3, 43.6, 200]])
      expect(ca.stride).toBe(3)
    })

    it('parses an array of objects with lon/lat', () => {
      const ca = CoordsArray([{ lon: 1.5, lat: 48.8 }, { lon: 2.3, lat: 43.6 }])
      expect(ca.isValid).toBe(true)
      expect(ca.stride).toBe(2)
    })

    it('parses an array of objects with longitude/latitude', () => {
      const ca = CoordsArray([{ longitude: 1.5, latitude: 48.8 }])
      expect(ca.isValid).toBe(true)
    })

    it('detects altitude via alt', () => {
      const ca = CoordsArray([{ lon: 1, lat: 2, alt: 50 }])
      expect(ca.stride).toBe(3)
    })

    it('detects altitude via z', () => {
      const ca = CoordsArray([{ lon: 1, lat: 2, z: 50 }])
      expect(ca.stride).toBe(3)
    })

    it('marks isValid as false if longitude is missing', () => {
      const ca = CoordsArray([[null, 48.8]])
      expect(ca.isValid).toBe(false)
    })

    it('marks isValid as false if latitude is not a number', () => {
      const ca = CoordsArray([{ lon: 1.5, lat: 'oops' }])
      expect(ca.isValid).toBe(false)
    })

    it('marks isValid as false if altitude is not a number in 3D', () => {
      const ca = CoordsArray([[1, 2, 100], [3, 4, 'bad']])
      expect(ca.isValid).toBe(false)
    })
  })

  describe('dimension', () => {
    it('returns 2 for 2D coords', () => {
      expect(CoordsArray([[1, 2]]).dimension).toBe(2)
    })

    it('returns 3 for 3D coords', () => {
      expect(CoordsArray([[1, 2, 3]]).dimension).toBe(3)
    })
  })

  describe('at', () => {
    it('returns a Coords at the given index', () => {
      const ca = CoordsArray([[1.5, 48.8], [2.3, 43.6]])
      const c = ca.at(1)
      expect(c.longitude).toBe(2.3)
      expect(c.latitude).toBe(43.6)
    })

    it('returns a Coords with altitude in 3D', () => {
      const ca = CoordsArray([[1.5, 48.8, 100]])
      expect(ca.at(0).altitude).toBe(100)
    })
  })

  describe('Symbol.iterator', () => {
    it('iterates over all points', () => {
      const ca = CoordsArray([[1, 2], [3, 4]])
      const result = [...ca]
      expect(result).toHaveLength(2)
      expect(result[0].longitude).toBe(1)
      expect(result[1].longitude).toBe(3)
    })

    it('yields nothing if invalid', () => {
      const ca = CoordsArray([[null, 2]])
      expect([...ca]).toHaveLength(0)
    })
  })

  describe('forEach', () => {
    it('calls fn for each point', () => {
      const ca = CoordsArray([[1, 2], [3, 4]])
      const lons = []
      ca.forEach(c => lons.push(c.longitude))
      expect(lons).toEqual([1, 3])
    })

    it('does nothing if invalid', () => {
      const ca = CoordsArray([[null, 2]])
      const spy = vi.fn()
      ca.forEach(spy)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('map', () => {
    it('transforms each point', () => {
      const ca = CoordsArray([[1, 2], [3, 4]])
      const lons = ca.map(c => c.longitude)
      expect(lons).toEqual([1, 3])
    })

    it('returns [] if invalid', () => {
      expect(CoordsArray([[null, 2]]).map(c => c)).toEqual([])
    })
  })

  describe('toArray', () => {
    it('returns an array of 2D arrays', () => {
      const ca = CoordsArray([[1.5, 48.8], [2.3, 43.6]])
      expect(ca.toArray()).toEqual([[1.5, 48.8], [2.3, 43.6]])
    })

    it('returns an array of 3D arrays', () => {
      const ca = CoordsArray([[1.5, 48.8, 100]])
      expect(ca.toArray()).toEqual([[1.5, 48.8, 100]])
    })

    it('returns [] if invalid', () => {
      expect(CoordsArray([[null, 2]]).toArray()).toEqual([])
    })
  })

  describe('toGeoJSON', () => {
    it('returns coordinates in 2D', () => {
      const ca = CoordsArray([[1.5, 48.8]])
      expect(ca.toGeoJSON()).toEqual({ coordinates: [[1.5, 48.8]] })
    })

    it('returns coordinates in 3D', () => {
      const ca = CoordsArray([[1.5, 48.8, 100]])
      expect(ca.toGeoJSON()).toEqual({ coordinates: [[1.5, 48.8, 100]] })
    })

    it('returns { coordinates: [] } if invalid', () => {
      expect(CoordsArray([[null, 2]]).toGeoJSON()).toEqual({ coordinates: [] })
    })
  })

  describe('bbox', () => {
    it('computes 2D bbox with correct min/max', () => {
      const ca = CoordsArray([[1, 10], [5, 20], [3, 15]])
      const bb = ca.bbox()
      expect(bb).not.toBeNull()
      expect(bb.min.longitude).toBe(1)
      expect(bb.min.latitude).toBe(10)
      expect(bb.max.longitude).toBe(5)
      expect(bb.max.latitude).toBe(20)
    })

    it('computes 3D bbox with correct min/max', () => {
      const ca = CoordsArray([[1, 10, 0], [5, 20, 100]])
      const bb = ca.bbox()
      expect(bb).not.toBeNull()
      expect(bb.min.altitude).toBe(0)
      expect(bb.max.altitude).toBe(100)
    })

    it('returns null if invalid', () => {
      expect(CoordsArray([[null, 2]]).bbox()).toBeNull()
    })

    it('returns null if empty', () => {
      expect(CoordsArray().bbox()).toBeNull()
    })
  })

  describe('centroid', () => {
    it('computes 2D centroid', () => {
      const ca = CoordsArray([[0, 0], [2, 4]])
      const c = ca.centroid()
      expect(c.longitude).toBe(1)
      expect(c.latitude).toBe(2)
    })

    it('computes 3D centroid', () => {
      const ca = CoordsArray([[0, 0, 0], [2, 4, 100]])
      const c = ca.centroid()
      expect(c.longitude).toBe(1)
      expect(c.latitude).toBe(2)
      expect(c.altitude).toBe(50)
    })

    it('returns null if invalid', () => {
      expect(CoordsArray([[null, 2]]).centroid()).toBeNull()
    })

    it('returns null if empty', () => {
      expect(CoordsArray().centroid()).toBeNull()
    })
  })

  describe('truncate', () => {
    it('truncates all points', () => {
      // 1.123456789 truncated to 2 decimal places → 1.12
      // 48.987654321 truncated to 2 decimal places → 48.99
      const ca = CoordsArray([[1.123456789, 48.987654321]])
      ca.truncate(2)
      expect(ca.at(0).longitude).toBe(1.12)
      expect(ca.at(0).latitude).toBe(48.99)
    })

    it('returns this for chaining', () => {
      const ca = CoordsArray([[1, 2]])
      expect(ca.truncate()).toBe(ca)
    })

    it('throws if precision is out of range', () => {
      const ca = CoordsArray([[1, 2]])
      expect(() => ca.truncate(9)).toThrow()
    })

    it('throws if invalid', () => {
      const ca = CoordsArray([[null, 2]])
      expect(() => ca.truncate()).toThrow()
    })
  })
})
