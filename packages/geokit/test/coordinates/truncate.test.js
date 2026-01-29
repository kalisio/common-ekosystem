import { describe, it, expect } from 'vitest'
import { truncateCoordinates } from '../../src/coordinates/truncate.js'

describe('truncateCoordinates', () => {
  describe('Valid inputs', () => {
    it('should truncate coordinates with default precision (7)', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432)
      expect(result).toEqual({
        longitude: 2.3522223,
        latitude: 48.8566667
      })
    })

    it('should truncate coordinates with precision 0', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 0)
      expect(result).toEqual({
        longitude: 2,
        latitude: 49
      })
    })

    it('should truncate coordinates with precision 1', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 1)
      expect(result).toEqual({
        longitude: 2.4,
        latitude: 48.9
      })
    })

    it('should truncate coordinates with precision 2', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 2)
      expect(result).toEqual({
        longitude: 2.35,
        latitude: 48.86
      })
    })

    it('should truncate coordinates with precision 3', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 3)
      expect(result).toEqual({
        longitude: 2.352,
        latitude: 48.857
      })
    })

    it('should truncate coordinates with precision 4', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 4)
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8567
      })
    })

    it('should truncate coordinates with precision 5', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 5)
      expect(result).toEqual({
        longitude: 2.35222,
        latitude: 48.85667
      })
    })

    it('should truncate coordinates with precision 6', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 6)
      expect(result).toEqual({
        longitude: 2.352222,
        latitude: 48.856667
      })
    })

    it('should truncate coordinates with precision 8', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, 8)
      expect(result).toEqual({
        longitude: 2.3522223,
        latitude: 48.85666669
      })
    })

    it('should handle negative coordinates', () => {
      const result = truncateCoordinates(-2.35222229876, -48.85666669432, 5)
      expect(result).toEqual({
        longitude: -2.35222,
        latitude: -48.85667
      })
    })

    it('should handle zero coordinates', () => {
      const result = truncateCoordinates(0, 0, 5)
      expect(result).toEqual({
        longitude: 0,
        latitude: 0
      })
    })

    it('should handle integer coordinates', () => {
      const result = truncateCoordinates(2, 48, 5)
      expect(result).toEqual({
        longitude: 2,
        latitude: 48
      })
    })

    it('should handle coordinates at boundaries', () => {
      const result = truncateCoordinates(180, 90, 5)
      expect(result).toEqual({
        longitude: 180,
        latitude: 90
      })
    })

    it('should handle negative boundaries', () => {
      const result = truncateCoordinates(-180, -90, 5)
      expect(result).toEqual({
        longitude: -180,
        latitude: -90
      })
    })
  })

  describe('Invalid inputs', () => {
    it('should return null for non-number longitude', () => {
      expect(truncateCoordinates('2.35', 48.86)).toBeNull()
      expect(truncateCoordinates(null, 48.86)).toBeNull()
      expect(truncateCoordinates(undefined, 48.86)).toBeNull()
      expect(truncateCoordinates({}, 48.86)).toBeNull()
      expect(truncateCoordinates([], 48.86)).toBeNull()
      expect(truncateCoordinates(true, 48.86)).toBeNull()
    })

    it('should return null for non-number latitude', () => {
      expect(truncateCoordinates(2.35, '48.86')).toBeNull()
      expect(truncateCoordinates(2.35, null)).toBeNull()
      expect(truncateCoordinates(2.35, undefined)).toBeNull()
      expect(truncateCoordinates(2.35, {})).toBeNull()
      expect(truncateCoordinates(2.35, [])).toBeNull()
      expect(truncateCoordinates(2.35, false)).toBeNull()
    })

    it('should return null for NaN coordinates', () => {
      expect(truncateCoordinates(NaN, 48.86)).toBeNull()
      expect(truncateCoordinates(2.35, NaN)).toBeNull()
      expect(truncateCoordinates(NaN, NaN)).toBeNull()
    })

    it('should return null for Infinity', () => {
      expect(truncateCoordinates(Infinity, 48.86)).toBeNull()
      expect(truncateCoordinates(2.35, Infinity)).toBeNull()
      expect(truncateCoordinates(-Infinity, 48.86)).toBeNull()
      expect(truncateCoordinates(2.35, -Infinity)).toBeNull()
    })

    it('should return null for non-integer precision', () => {
      expect(truncateCoordinates(2.35, 48.86, 2.5)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, 7.1)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, 3.9)).toBeNull()
    })

    it('should return null for precision < 0', () => {
      expect(truncateCoordinates(2.35, 48.86, -1)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, -5)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, -10)).toBeNull()
    })

    it('should return null for precision > 8', () => {
      expect(truncateCoordinates(2.35, 48.86, 9)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, 10)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, 100)).toBeNull()
    })

    it('should use default precision when precision is undefined', () => {
      const result = truncateCoordinates(2.35222229876, 48.85666669432, undefined)
      expect(result).toEqual({
        longitude: 2.3522223,
        latitude: 48.8566667
      })
    })

    it('should return null for non-number precision', () => {
      expect(truncateCoordinates(2.35, 48.86, '5')).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, null)).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, {})).toBeNull()
      expect(truncateCoordinates(2.35, 48.86, [])).toBeNull()
    })
  })

  describe('Rounding behavior', () => {
    it('should round up correctly', () => {
      const result = truncateCoordinates(2.355, 48.856, 2)
      expect(result).toEqual({
        longitude: 2.36,
        latitude: 48.86
      })
    })

    it('should round down correctly', () => {
      const result = truncateCoordinates(2.354, 48.854, 2)
      expect(result).toEqual({
        longitude: 2.35,
        latitude: 48.85
      })
    })

    it('should handle .5 rounding (round half up)', () => {
      const result1 = truncateCoordinates(2.355, 48.865, 2)
      expect(result1).toEqual({
        longitude: 2.36,
        latitude: 48.87
      })

      const result2 = truncateCoordinates(2.345, 48.875, 2)
      expect(result2).toEqual({
        longitude: 2.35,
        latitude: 48.88
      })
    })

    it('should round negative values correctly', () => {
      const result = truncateCoordinates(-2.355, -48.856, 2)
      expect(result).toEqual({
        longitude: -2.35,
        latitude: -48.86
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle very small positive values', () => {
      const result = truncateCoordinates(0.0000001, 0.0000001, 7)
      expect(result).toEqual({
        longitude: 0.0000001,
        latitude: 0.0000001
      })
    })

    it('should handle very small negative values', () => {
      const result = truncateCoordinates(-0.0000001, -0.0000001, 7)
      expect(result).toEqual({
        longitude: -0.0000001,
        latitude: -0.0000001
      })
    })

    it('should handle values with many decimal places', () => {
      const result = truncateCoordinates(2.12345678901234, 48.98765432109876, 5)
      expect(result).toEqual({
        longitude: 2.12346,
        latitude: 48.98765
      })
    })

    it('should handle precision boundaries', () => {
      expect(truncateCoordinates(2.35, 48.86, 0)).not.toBeNull()
      expect(truncateCoordinates(2.35, 48.86, 8)).not.toBeNull()
    })

    it('should handle large coordinates', () => {
      const result = truncateCoordinates(179.999999, 89.999999, 5)
      expect(result).toEqual({
        longitude: 180,
        latitude: 90
      })
    })

    it('should handle coordinates that become zero after truncation', () => {
      const result = truncateCoordinates(0.00001, 0.00001, 2)
      expect(result).toEqual({
        longitude: 0,
        latitude: 0
      })
    })
  })

  describe('Real world examples', () => {
    it('should truncate Paris coordinates to street level (precision 5)', () => {
      const result = truncateCoordinates(2.3522, 48.8566, 5)
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should truncate Sydney coordinates to neighborhood (precision 2)', () => {
      const result = truncateCoordinates(151.2093, -33.8688, 2)
      expect(result).toEqual({
        longitude: 151.21,
        latitude: -33.87
      })
    })

    it('should truncate New York coordinates to GPS precision (precision 6)', () => {
      const result = truncateCoordinates(-74.0060, 40.7128, 6)
      expect(result).toEqual({
        longitude: -74.006,
        latitude: 40.7128
      })
    })

    it('should truncate Tokyo coordinates to city level (precision 1)', () => {
      const result = truncateCoordinates(139.6917, 35.6895, 1)
      expect(result).toEqual({
        longitude: 139.7,
        latitude: 35.7
      })
    })
  })

  describe('Precision consistency', () => {
    it('should produce same result when called multiple times', () => {
      const coords = { lon: 2.35222229876, lat: 48.85666669432 }
      const result1 = truncateCoordinates(coords.lon, coords.lat, 5)
      const result2 = truncateCoordinates(coords.lon, coords.lat, 5)
      const result3 = truncateCoordinates(coords.lon, coords.lat, 5)

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
    })

    it('should handle truncating already truncated values', () => {
      const first = truncateCoordinates(2.35222229876, 48.85666669432, 5)
      const second = truncateCoordinates(first.longitude, first.latitude, 5)

      expect(first).toEqual(second)
    })

    it('should allow increasing precision on truncated values', () => {
      const truncated = truncateCoordinates(2.35222229876, 48.85666669432, 2)
      const morePrecise = truncateCoordinates(2.35222229876, 48.85666669432, 5)

      expect(truncated).toEqual({ longitude: 2.35, latitude: 48.86 })
      expect(morePrecise).toEqual({ longitude: 2.35222, latitude: 48.85667 })
    })
  })
})
