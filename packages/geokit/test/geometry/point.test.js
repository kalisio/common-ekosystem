import { describe, it, expect } from 'vitest'
import { Position, isPosition } from '../../src/geometry/position.js'
import { Point } from '../../src/geometry/point.js'

describe('Point', () => {
  describe('type', () => {
    it('should have type Point', () => {
      expect(Point([2.3522, 48.8566]).type).toBe('Point')
    })

    it('should not be detected as Position', () => {
      expect(isPosition(Point([2.3522, 48.8566]))).toBe(false)
    })
  })

  describe('from array', () => {
    it('should be valid with lon and lat', () => {
      const point = Point([2.3522, 48.8566])
      expect(point.isValid()).toBe(true)
      expect(point.longitude).toBe(2.3522)
      expect(point.latitude).toBe(48.8566)
      expect(point.altitude).toBe(null)
    })

    it('should be valid with lon, lat and altitude', () => {
      const point = Point([2.3522, 48.8566, 100])
      expect(point.isValid()).toBe(true)
      expect(point.altitude).toBe(100)
    })

    it('should be invalid with only one element', () => {
      expect(Point([2.3522]).isValid()).toBe(false)
    })
  })

  describe('from object', () => {
    it('should be valid with lon and lat', () => {
      const point = Point({ lon: 2.3522, lat: 48.8566 })
      expect(point.isValid()).toBe(true)
      expect(point.longitude).toBe(2.3522)
      expect(point.latitude).toBe(48.8566)
    })

    it('should be valid with longitude and latitude', () => {
      const point = Point({ longitude: 2.3522, latitude: 48.8566 })
      expect(point.isValid()).toBe(true)
    })

    it('should be valid with x and y', () => {
      const point = Point({ x: 2.3522, y: 48.8566 })
      expect(point.isValid()).toBe(true)
    })
  })

  describe('from Position', () => {
    it('should wrap a Position directly', () => {
      const pos = Position([2.3522, 48.8566])
      const point = Point(pos)
      expect(point.isValid()).toBe(true)
      expect(point.longitude).toBe(2.3522)
      expect(point.latitude).toBe(48.8566)
    })

    it('should expose the underlying position', () => {
      const pos = Position([2.3522, 48.8566])
      const point = Point(pos)
      expect(point.position).toBe(pos)
    })

    it('should not create a nested Position', () => {
      const pos = Position([2.3522, 48.8566])
      const point = Point(pos)
      expect(isPosition(point.position)).toBe(true)
    })
  })

  describe('dimension', () => {
    it('should be 2 without altitude', () => {
      expect(Point([2.3522, 48.8566]).dimension).toBe(2)
    })

    it('should be 3 with altitude', () => {
      expect(Point([2.3522, 48.8566, 100]).dimension).toBe(3)
    })
  })

  describe('setters', () => {
    it('should update longitude', () => {
      const point = Point([2.3522, 48.8566])
      point.longitude = 3.0
      expect(point.longitude).toBe(3.0)
    })

    it('should update latitude', () => {
      const point = Point([2.3522, 48.8566])
      point.latitude = 49.0
      expect(point.latitude).toBe(49.0)
    })

    it('should update altitude', () => {
      const point = Point([2.3522, 48.8566, 100])
      point.altitude = 200
      expect(point.altitude).toBe(200)
    })
  })

  describe('normalize', () => {
    it('should normalize and return this for chaining', () => {
      const point = Point([181, 48.8566])
      const result = point.normalize()
      expect(result).toBe(point)
      expect(point.longitude).toBeCloseTo(-179)
    })

    it('should throw if invalid', () => {
      expect(() => Point([]).normalize()).toThrow()
    })
  })

  describe('truncate', () => {
    it('should truncate and return this for chaining', () => {
      const point = Point([2.3522, 48.8566])
      const result = point.truncate(2)
      expect(result).toBe(point)
      expect(point.longitude).toBe(2.35)
      expect(point.latitude).toBe(48.86)
    })

    it('should throw if precision is out of range', () => {
      expect(() => Point([2.3522, 48.8566]).truncate(9)).toThrow()
    })
  })

  describe('toArray', () => {
    it('should return null if invalid', () => {
      expect(Point([]).toArray()).toBe(null)
    })

    it('should return [lon, lat] for 2D', () => {
      expect(Point([2.3522, 48.8566]).toArray()).toEqual([2.3522, 48.8566])
    })

    it('should return [lon, lat, alt] for 3D', () => {
      expect(Point([2.3522, 48.8566, 100]).toArray()).toEqual([2.3522, 48.8566, 100])
    })
  })

  describe('toJSON', () => {
    it('should return null if invalid', () => {
      expect(Point([]).toJSON()).toBe(null)
    })

    it('should return lon and lat', () => {
      expect(Point([2.3522, 48.8566]).toJSON()).toEqual({ lon: 2.3522, lat: 48.8566 })
    })

    it('should include alt if defined', () => {
      expect(Point([2.3522, 48.8566, 100]).toJSON()).toEqual({ lon: 2.3522, lat: 48.8566, alt: 100 })
    })
  })

  describe('toGeoJSON', () => {
    it('should return null if invalid', () => {
      expect(Point([]).toGeoJSON()).toBe(null)
    })

    it('should return a GeoJSON Point for 2D', () => {
      expect(Point([2.3522, 48.8566]).toGeoJSON()).toEqual({
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      })
    })

    it('should return a GeoJSON Point for 3D', () => {
      expect(Point([2.3522, 48.8566, 100]).toGeoJSON()).toEqual({
        type: 'Point',
        coordinates: [2.3522, 48.8566, 100]
      })
    })
  })

  describe('toString', () => {
    it('should format in DD', () => {
      const result = Point([2.3522, 48.8566]).toString('DD', 2)
      expect(result).toContain('N')
      expect(result).toContain('E')
    })

    it('should format negative coordinates with S and W', () => {
      const result = Point([-73.9857, -40.7128]).toString('DD', 2)
      expect(result).toContain('S')
      expect(result).toContain('W')
    })

    it('should return null if invalid', () => {
      expect(Point([]).toString('DD', 2)).toBe(null)
    })
  })
})
