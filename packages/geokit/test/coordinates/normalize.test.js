import { describe, it, expect } from 'vitest'
import { normalizeCoordinates } from '../../src/coordinates/normalize.js'

describe('normalizeCoordinates', () => {
  describe('Valid inputs with default precision', () => {
    it('should normalize and truncate coordinates with default precision (7)', () => {
      const result = normalizeCoordinates(2.35222229876, 48.85666669432)
      expect(result).toEqual({
        longitude: 2.3522223,
        latitude: 48.8566667
      })
    })

    it('should handle coordinates within valid ranges', () => {
      const result = normalizeCoordinates(2.3522, 48.8566, 5)
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should handle negative coordinates', () => {
      const result = normalizeCoordinates(-2.3522, -48.8566, 5)
      expect(result).toEqual({
        longitude: -2.3522,
        latitude: -48.8566
      })
    })

    it('should handle zero coordinates', () => {
      const result = normalizeCoordinates(0, 0, 5)
      expect(result).toEqual({
        longitude: 0,
        latitude: 0
      })
    })

    it('should handle coordinates at boundaries', () => {
      const result = normalizeCoordinates(180, 90, 5)
      expect(result).toEqual({
        longitude: 180,
        latitude: 90
      })
    })

    it('should handle negative boundaries', () => {
      const result = normalizeCoordinates(-180, -90, 5)
      expect(result).toEqual({
        longitude: -180,
        latitude: -90
      })
    })
  })

  describe('Longitude normalization', () => {
    it('should normalize longitude > 180 to [-180, 180]', () => {
      const result = normalizeCoordinates(185, 48.8567, 2)
      expect(result).toEqual({
        longitude: -175,
        latitude: 48.86
      })
    })

    it('should normalize longitude < -180 to [-180, 180]', () => {
      const result = normalizeCoordinates(-185, 48.8567, 2)
      expect(result).toEqual({
        longitude: 175,
        latitude: 48.86
      })
    })

    it('should normalize longitude = 360 to 0', () => {
      const result = normalizeCoordinates(360, 0, 2)
      expect(result).toEqual({
        longitude: 0,
        latitude: 0
      })
    })

    it('should normalize longitude = 540 (360 + 180)', () => {
      const result = normalizeCoordinates(540, 0, 2)
      expect(result).toEqual({
        longitude: 180,
        latitude: 0
      })
    })

    it('should normalize longitude = -360 to 0', () => {
      const result = normalizeCoordinates(-360, 0, 2)
      expect(result).toEqual({
        longitude: 0,
        latitude: 0
      })
    })

    it('should normalize very large positive longitude', () => {
      const result = normalizeCoordinates(1000, 45, 2)
      expect(result?.longitude).toBeGreaterThanOrEqual(-180)
      expect(result?.longitude).toBeLessThanOrEqual(180)
    })

    it('should normalize very large negative longitude', () => {
      const result = normalizeCoordinates(-1000, 45, 2)
      expect(result?.longitude).toBeGreaterThanOrEqual(-180)
      expect(result?.longitude).toBeLessThanOrEqual(180)
    })
  })

  describe('Latitude normalization with longitude flip', () => {
    it('should normalize latitude > 90 and flip longitude', () => {
      const result = normalizeCoordinates(10, 95, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: 85
      })
    })

    it('should normalize latitude < -90 and flip longitude', () => {
      const result = normalizeCoordinates(10, -95, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: -85
      })
    })

    it('should normalize latitude = 100', () => {
      const result = normalizeCoordinates(0, 100, 2)
      expect(result).toEqual({
        longitude: 180,
        latitude: 80
      })
    })

    it('should normalize latitude = -100', () => {
      const result = normalizeCoordinates(0, -100, 2)
      expect(result).toEqual({
        longitude: 180,
        latitude: -80
      })
    })

    it('should normalize latitude = 135 (crossing pole)', () => {
      const result = normalizeCoordinates(10, 135, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: 45
      })
    })

    it('should normalize latitude = -135 (crossing south pole)', () => {
      const result = normalizeCoordinates(10, -135, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: -45
      })
    })

    it('should handle latitude = 270 with longitude flip', () => {
      const result = normalizeCoordinates(10, 270, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: -90
      })
    })

    it('should normalize very large positive latitude', () => {
      const result = normalizeCoordinates(10, 500, 2)
      expect(result?.longitude).toBeGreaterThanOrEqual(-180)
      expect(result?.longitude).toBeLessThanOrEqual(180)
      expect(result?.latitude).toBeGreaterThanOrEqual(-90)
      expect(result?.latitude).toBeLessThanOrEqual(90)
    })

    it('should normalize very large negative latitude', () => {
      const result = normalizeCoordinates(10, -500, 2)
      expect(result?.longitude).toBeGreaterThanOrEqual(-180)
      expect(result?.longitude).toBeLessThanOrEqual(180)
      expect(result?.latitude).toBeGreaterThanOrEqual(-90)
      expect(result?.latitude).toBeLessThanOrEqual(90)
    })
  })

  describe('Combined longitude and latitude normalization', () => {
    it('should normalize both longitude > 180 and latitude > 90', () => {
      const result = normalizeCoordinates(185, 95, 2)
      expect(result?.longitude).toBeGreaterThanOrEqual(-180)
      expect(result?.longitude).toBeLessThanOrEqual(180)
      expect(result?.latitude).toBeGreaterThanOrEqual(-90)
      expect(result?.latitude).toBeLessThanOrEqual(90)
    })

    it('should normalize both longitude < -180 and latitude < -90', () => {
      const result = normalizeCoordinates(-185, -95, 2)
      expect(result?.longitude).toBeGreaterThanOrEqual(-180)
      expect(result?.longitude).toBeLessThanOrEqual(180)
      expect(result?.latitude).toBeGreaterThanOrEqual(-90)
      expect(result?.latitude).toBeLessThanOrEqual(90)
    })
  })

  describe('Precision handling', () => {
    it('should apply precision 0', () => {
      const result = normalizeCoordinates(2.35222229876, 48.85666669432, 0)
      expect(result).toEqual({
        longitude: 2,
        latitude: 49
      })
    })

    it('should apply precision 2', () => {
      const result = normalizeCoordinates(2.35222229876, 48.85666669432, 2)
      expect(result).toEqual({
        longitude: 2.35,
        latitude: 48.86
      })
    })

    it('should apply precision 5', () => {
      const result = normalizeCoordinates(2.35222229876, 48.85666669432, 5)
      expect(result).toEqual({
        longitude: 2.35222,
        latitude: 48.85667
      })
    })

    it('should apply precision 8', () => {
      const result = normalizeCoordinates(2.35222229876, 48.85666669432, 8)
      expect(result).toEqual({
        longitude: 2.3522223,
        latitude: 48.85666669
      })
    })

    it('should apply precision after normalization', () => {
      const result = normalizeCoordinates(185.12345, 95.12345, 2)
      // After normalization: lon=-174.87655, lat=84.87655
      expect(result?.longitude).toBeCloseTo(5.12, 2)
      expect(result?.latitude).toBeCloseTo(84.88, 2)
    })
  })

  describe('Invalid inputs', () => {
    it('should return null for non-number longitude', () => {
      expect(normalizeCoordinates('2.35', 48.86)).toBeNull()
      expect(normalizeCoordinates(null, 48.86)).toBeNull()
      expect(normalizeCoordinates({}, 48.86)).toBeNull()
      expect(normalizeCoordinates([], 48.86)).toBeNull()
      expect(normalizeCoordinates(true, 48.86)).toBeNull()
    })

    it('should return null for non-number latitude', () => {
      expect(normalizeCoordinates(2.35, '48.86')).toBeNull()
      expect(normalizeCoordinates(2.35, null)).toBeNull()
      expect(normalizeCoordinates(2.35, {})).toBeNull()
      expect(normalizeCoordinates(2.35, [])).toBeNull()
      expect(normalizeCoordinates(2.35, false)).toBeNull()
    })

    it('should return null for NaN coordinates', () => {
      expect(normalizeCoordinates(NaN, 48.86)).toBeNull()
      expect(normalizeCoordinates(2.35, NaN)).toBeNull()
      expect(normalizeCoordinates(NaN, NaN)).toBeNull()
    })

    it('should return null for Infinity', () => {
      expect(normalizeCoordinates(Infinity, 48.86)).toBeNull()
      expect(normalizeCoordinates(2.35, Infinity)).toBeNull()
      expect(normalizeCoordinates(-Infinity, 48.86)).toBeNull()
      expect(normalizeCoordinates(2.35, -Infinity)).toBeNull()
    })

    it('should return null for non-integer precision', () => {
      expect(normalizeCoordinates(2.35, 48.86, 2.5)).toBeNull()
      expect(normalizeCoordinates(2.35, 48.86, 7.1)).toBeNull()
    })

    it('should return null for precision < 0', () => {
      expect(normalizeCoordinates(2.35, 48.86, -1)).toBeNull()
      expect(normalizeCoordinates(2.35, 48.86, -5)).toBeNull()
    })

    it('should return null for precision > 8', () => {
      expect(normalizeCoordinates(2.35, 48.86, 9)).toBeNull()
      expect(normalizeCoordinates(2.35, 48.86, 10)).toBeNull()
    })

    it('should return null for non-number precision', () => {
      expect(normalizeCoordinates(2.35, 48.86, '5')).toBeNull()
      expect(normalizeCoordinates(2.35, 48.86, null)).toBeNull()
      expect(normalizeCoordinates(2.35, 48.86, {})).toBeNull()
      expect(normalizeCoordinates(2.35, 48.86, [])).toBeNull()
    })
  })

  describe('Real world examples', () => {
    it('should normalize Paris coordinates', () => {
      const result = normalizeCoordinates(2.3522, 48.8566, 5)
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should normalize Sydney coordinates', () => {
      const result = normalizeCoordinates(151.2093, -33.8688, 5)
      expect(result).toEqual({
        longitude: 151.2093,
        latitude: -33.8688
      })
    })

    it('should normalize New York coordinates', () => {
      const result = normalizeCoordinates(-74.0060, 40.7128, 5)
      expect(result).toEqual({
        longitude: -74.006,
        latitude: 40.7128
      })
    })

    it('should normalize coordinates crossing dateline', () => {
      const result = normalizeCoordinates(190, 45, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: 45
      })
    })

    it('should normalize coordinates crossing north pole', () => {
      const result = normalizeCoordinates(10, 100, 2)
      expect(result).toEqual({
        longitude: -170,
        latitude: 80
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle very small values', () => {
      const result = normalizeCoordinates(0.0000001, 0.0000001, 7)
      expect(result).toEqual({
        longitude: 0.0000001,
        latitude: 0.0000001
      })
    })

    it('should handle coordinates at exactly 90/-90', () => {
      const result1 = normalizeCoordinates(10, 90, 5)
      const result2 = normalizeCoordinates(10, -90, 5)
      
      expect(result1).toEqual({
        longitude: 10,
        latitude: 90
      })
      expect(result2).toEqual({
        longitude: 10,
        latitude: -90
      })
    })

    it('should handle coordinates at exactly 180/-180', () => {
      const result1 = normalizeCoordinates(180, 45, 5)
      const result2 = normalizeCoordinates(-180, 45, 5)
      
      expect(result1).toEqual({
        longitude: 180,
        latitude: 45
      })
      expect(result2).toEqual({
        longitude: -180,
        latitude: 45
      })
    })

    it('should be idempotent', () => {
      const first = normalizeCoordinates(185, 84, 5)
      const second = normalizeCoordinates(first.longitude, first.latitude, 5)
      expect(first).toEqual(second)
    })
  })
})