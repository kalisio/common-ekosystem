import { describe, it, expect } from 'vitest'
import { parseCoordinates } from '../../src/coordinates/parse.js'

describe('parseCoordinates', () => {
  describe('DMS format (Degrees Minutes Seconds)', () => {
    it('should parse DMS format with N/E directions', () => {
      const result = parseCoordinates('48°51\'24"N 2°21\'07"E')
      expect(result).toEqual({
        longitude: 2.3519444,
        latitude: 48.8566667
      })
    })

    it('should parse DMS format with S/W directions', () => {
      const result = parseCoordinates('33°51\'35"S 151°12\'40"W')
      expect(result).toEqual({
        longitude: -151.2111111,
        latitude: -33.8597222
      })
    })

    it('should parse DMS format with E/N order', () => {
      const result = parseCoordinates('2°21\'07"E 48°51\'24"N')
      expect(result).toEqual({
        longitude: 2.3519444,
        latitude: 48.8566667
      })
    })

    it('should parse DMS format with decimal seconds', () => {
      const result = parseCoordinates('48°51\'24.5"N 2°21\'07.8"E')
      expect(result).toEqual({
        longitude: 2.3521667,
        latitude: 48.8568056
      })
    })

    it('should parse DMS format with comma separator', () => {
      const result = parseCoordinates('48°51\'24"N, 2°21\'07"E')
      expect(result).toEqual({
        longitude: 2.3519444,
        latitude: 48.8566667
      })
    })

    it('should parse DMS format with extra spaces', () => {
      const result = parseCoordinates('48° 51\' 24" N   2° 21\' 07" E')
      expect(result).toEqual({
        longitude: 2.3519444,
        latitude: 48.8566667
      })
    })
  })

  describe('DDM format (Degrees Decimal Minutes)', () => {
    it('should parse DDM format with N/E directions', () => {
      const result = parseCoordinates('48°51.4\'N 2°21.12\'E')
      expect(result).toEqual({
        longitude: 2.352,
        latitude: 48.8566667
      })
    })

    it('should parse DDM format with S/W directions', () => {
      const result = parseCoordinates('33°51.5\'S 151°12.6\'W')
      expect(result).toEqual({
        longitude: -151.21,
        latitude: -33.8583333
      })
    })

    it('should parse DDM format with E/N order', () => {
      const result = parseCoordinates('2°21.12\'E 48°51.4\'N')
      expect(result).toEqual({
        longitude: 2.352,
        latitude: 48.8566667
      })
    })

    it('should parse DDM format with comma separator', () => {
      const result = parseCoordinates('48°51.4\'N, 2°21.12\'E')
      expect(result).toEqual({
        longitude: 2.352,
        latitude: 48.8566667
      })
    })

    it('should parse DDM format with extra spaces', () => {
      const result = parseCoordinates('48° 51.4\' N   2° 21.12\' E')
      expect(result).toEqual({
        longitude: 2.352,
        latitude: 48.8566667
      })
    })
  })

  describe('DD format with degree symbol', () => {
    it('should parse DD with degree symbol N/E', () => {
      const result = parseCoordinates('48.8566° N, 2.3522° E')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse DD with degree symbol S/W', () => {
      const result = parseCoordinates('33.8597° S, 151.2111° W')
      expect(result).toEqual({
        longitude: -151.2111,
        latitude: -33.8597
      })
    })

    it('should parse DD with degree symbol E/N order', () => {
      const result = parseCoordinates('2.3522° E 48.8566° N')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse DD with degree symbol without comma', () => {
      const result = parseCoordinates('48.8566° N 2.3522° E')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse DD with negative values and directions', () => {
      const result = parseCoordinates('-48.8566° S, -2.3522° W')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })
  })

  describe('DD format without degree symbol', () => {
    it('should parse DD without degree symbol N/E', () => {
      const result = parseCoordinates('48.8566 N, 2.3522 E')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse DD without degree symbol S/W', () => {
      const result = parseCoordinates('33.8597 S, 151.2111 W')
      expect(result).toEqual({
        longitude: -151.2111,
        latitude: -33.8597
      })
    })

    it('should parse DD without degree symbol E/N order', () => {
      const result = parseCoordinates('2.3522 E 48.8566 N')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse DD without degree symbol without comma', () => {
      const result = parseCoordinates('48.8566 N 2.3522 E')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })
  })

  describe('Simple format (lat, lon)', () => {
    it('should parse simple format with positive values', () => {
      const result = parseCoordinates('48.8566, 2.3522')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse simple format with negative values', () => {
      const result = parseCoordinates('-33.8597, -151.2111')
      expect(result).toEqual({
        longitude: -151.2111,
        latitude: -33.8597
      })
    })

    it('should parse simple format with mixed signs', () => {
      const result = parseCoordinates('48.8566, -2.3522')
      expect(result).toEqual({
        longitude: -2.3522,
        latitude: 48.8566
      })
    })

    it('should parse simple format without spaces', () => {
      const result = parseCoordinates('48.8566,2.3522')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse simple format with extra spaces', () => {
      const result = parseCoordinates('48.8566  ,  2.3522')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse simple format with integer values', () => {
      const result = parseCoordinates('48, 2')
      expect(result).toEqual({
        longitude: 2,
        latitude: 48
      })
    })
  })

  describe('Parentheses and brackets removal', () => {
    it('should parse coordinates with parentheses', () => {
      const result = parseCoordinates('(48.8566, 2.3522)')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse coordinates with square brackets', () => {
      const result = parseCoordinates('[48.8566, 2.3522]')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should handle leading/trailing whitespace with parentheses', () => {
      const result = parseCoordinates('  (48.8566, 2.3522)  ')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })
  })

  describe('Out of range values (should normalize)', () => {
    it('should normalize longitude > 180', () => {
      const result = parseCoordinates('48.8566, 185')
      expect(result?.longitude).toBeCloseTo(-175, 7)
      expect(result?.latitude).toBeCloseTo(48.8566, 7)
    })

    it('should normalize longitude < -180', () => {
      const result = parseCoordinates('48.8566, -185')
      expect(result?.longitude).toBeCloseTo(175, 7)
      expect(result?.latitude).toBeCloseTo(48.8566, 7)
    })

    it('should normalize latitude > 90', () => {
      const result = parseCoordinates('95, 2.3522')
      expect(result?.latitude).toBeCloseTo(85, 7)
      // Longitude should flip
      expect(result?.longitude).toBeCloseTo(-177.6478, 7)
    })

    it('should normalize latitude < -90', () => {
      const result = parseCoordinates('-95, 2.3522')
      expect(result?.latitude).toBeCloseTo(-85, 7)
      // Longitude should flip
      expect(result?.longitude).toBeCloseTo(-177.6478, 7)
    })
  })

  describe('Invalid inputs', () => {
    it('should return null for non-string input', () => {
      expect(parseCoordinates(null)).toBeNull()
      expect(parseCoordinates(undefined)).toBeNull()
      expect(parseCoordinates(123)).toBeNull()
      expect(parseCoordinates({})).toBeNull()
      expect(parseCoordinates([])).toBeNull()
      expect(parseCoordinates(true)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(parseCoordinates('')).toBeNull()
      expect(parseCoordinates('   ')).toBeNull()
    })

    it('should return null for invalid format', () => {
      expect(parseCoordinates('invalid')).toBeNull()
      expect(parseCoordinates('48.8566')).toBeNull()
      expect(parseCoordinates('abc, def')).toBeNull()
      expect(parseCoordinates('48.8566 / 2.3522')).toBeNull()
    })

    it('should return null for incomplete DMS format', () => {
      expect(parseCoordinates('48°51\'N')).toBeNull()
      expect(parseCoordinates('48°51\'24"N')).toBeNull()
    })

    it('should return null for incomplete DDM format', () => {
      expect(parseCoordinates('48°51.4\'N')).toBeNull()
    })

    it('should return null for incomplete DD format', () => {
      expect(parseCoordinates('48.8566° N')).toBeNull()
      expect(parseCoordinates('48.8566 N')).toBeNull()
    })

    it('should return null for mixed formats', () => {
      expect(parseCoordinates('48°51\'24"N, 2.3522')).toBeNull()
      expect(parseCoordinates('48.8566, 2°21\'07"E')).toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('should parse coordinates at 0,0', () => {
      const result = parseCoordinates('0, 0')
      expect(result).toEqual({
        longitude: 0,
        latitude: 0
      })
    })

    it('should parse coordinates at boundaries', () => {
      const result = parseCoordinates('90, 180')
      expect(result).toEqual({
        longitude: 180,
        latitude: 90
      })
    })

    it('should parse coordinates at negative boundaries', () => {
      const result = parseCoordinates('-90, -180')
      expect(result).toEqual({
        longitude: -180,
        latitude: -90
      })
    })

    it('should handle very small decimal values', () => {
      const result = parseCoordinates('0.0000001, 0.0000001')
      expect(result).toEqual({
        longitude: 0.0000001,
        latitude: 0.0000001
      })
    })

    it('should handle values with many decimal places', () => {
      const result = parseCoordinates('48.123456789, 2.987654321')
      expect(result?.longitude).toBeCloseTo(2.9876543, 7)
      expect(result?.latitude).toBeCloseTo(48.1234568, 7)
    })
  })

  describe('Real world examples', () => {
    it('should parse Paris coordinates', () => {
      const result = parseCoordinates('48.8566, 2.3522')
      expect(result).toEqual({
        longitude: 2.3522,
        latitude: 48.8566
      })
    })

    it('should parse Sydney coordinates', () => {
      const result = parseCoordinates('-33.8688, 151.2093')
      expect(result).toEqual({
        longitude: 151.2093,
        latitude: -33.8688
      })
    })

    it('should parse New York coordinates', () => {
      const result = parseCoordinates('40.7128, -74.0060')
      expect(result).toEqual({
        longitude: -74.0060,
        latitude: 40.7128
      })
    })

    it('should parse Tokyo coordinates in DMS', () => {
      const result = parseCoordinates('35°41\'22"N 139°41\'30"E')
      expect(result?.latitude).toBeCloseTo(35.6894444, 7)
      expect(result?.longitude).toBeCloseTo(139.6916667, 7)
    })
  })
})
