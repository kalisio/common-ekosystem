import { describe, it, expect } from 'vitest'
import { parseCoordinates } from '../../src/coordinates/parse.js'

describe('parseCoordinates', () => {
  describe('Invalid inputs', () => {
    it('should return null for non-string inputs', () => {
      expect(parseCoordinates(null)).toBeNull()
      expect(parseCoordinates(undefined)).toBeNull()
      expect(parseCoordinates(123)).toBeNull()
      expect(parseCoordinates({})).toBeNull()
      expect(parseCoordinates([])).toBeNull()
    })

    it('should return null for empty or invalid strings', () => {
      expect(parseCoordinates('')).toBeNull()
      expect(parseCoordinates('   ')).toBeNull()
      expect(parseCoordinates('not coordinates')).toBeNull()
      expect(parseCoordinates('abc, def')).toBeNull()
    })

    it('should return null for mixed formats', () => {
      expect(parseCoordinates('48°51\'24"N, 2.3522')).toBeNull()
      expect(parseCoordinates('48.8566, 2°21\'07"E')).toBeNull()
      expect(parseCoordinates('48°51\'N, 2.3522')).toBeNull()
      expect(parseCoordinates('48.8566 N, 2°21\'')).toBeNull()
    })

    it('should return null for invalid coordinate values', () => {
      expect(parseCoordinates('95.0, 200.0')).toBeNull() // latitude > 90
      expect(parseCoordinates('48.8566, 185.0')).toBeNull() // longitude > 180
    })
  })

  describe('DMS format (Degrees Minutes Seconds)', () => {
    it('should parse standard DMS format', () => {
      const result = parseCoordinates('48°51\'24"N 2°21\'07"E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.3519, 4)
    })

    it('should parse DMS with comma separator', () => {
      const result = parseCoordinates('48°51\'24"N, 2°21\'07"E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.3519, 4)
    })

    it('should parse DMS with South/West directions', () => {
      const result = parseCoordinates('33°51\'35"S 151°12\'40"E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(-33.8597, 4)
      expect(result.longitude).toBeCloseTo(151.2111, 4)
    })

    it('should parse DMS with decimal seconds', () => {
      const result = parseCoordinates('40°26\'46.302"N 79°58\'56.418"W')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(40.4462, 4)
      expect(result.longitude).toBeCloseTo(-79.9823, 4)
    })

    it('should handle DMS with extra spaces', () => {
      const result = parseCoordinates('48° 51\' 24" N  ,  2° 21\' 07" E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.3519, 4)
    })

    it('should parse DMS with lowercase directions', () => {
      const result = parseCoordinates('48°51\'24"n 2°21\'07"e')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.3519, 4)
    })

    it('should parse DMS with longitude first', () => {
      const result = parseCoordinates('2°21\'07"E 48°51\'24"N')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.3519, 4)
    })
  })

  describe('DDM format (Degrees Decimal Minutes)', () => {
    it('should parse standard DDM format', () => {
      const result = parseCoordinates('48°51.4\'N 2°21.12\'E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.352, 3)
    })

    it('should parse DDM with comma separator', () => {
      const result = parseCoordinates('48°51.4\'N, 2°21.12\'E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.352, 3)
    })

    it('should parse DDM with South/West directions', () => {
      const result = parseCoordinates('33°51.583\'S 151°12.667\'E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(-33.8597, 4)
      expect(result.longitude).toBeCloseTo(151.2111, 4)
    })

    it('should parse DDM with extra spaces', () => {
      const result = parseCoordinates('48° 51.4\' N  ,  2° 21.12\' E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.352, 3)
    })

    it('should parse DDM with lowercase directions', () => {
      const result = parseCoordinates('48°51.4\'n 2°21.12\'e')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8567, 4)
      expect(result.longitude).toBeCloseTo(2.352, 3)
    })
  })

  describe('DD format with degree symbol and directions', () => {
    it('should parse DD with degree symbol', () => {
      const result = parseCoordinates('48.8566° N, 2.3522° E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse DD with South/West directions', () => {
      const result = parseCoordinates('33.8597° S, 151.2111° E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(-33.8597)
      expect(result.longitude).toBe(151.2111)
    })

    it('should parse DD without comma', () => {
      const result = parseCoordinates('48.8566° N 2.3522° E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse DD with lowercase directions', () => {
      const result = parseCoordinates('48.8566° n, 2.3522° e')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })
  })

  describe('DD format without degree symbol but with directions', () => {
    it('should parse DD without degree symbol', () => {
      const result = parseCoordinates('48.8566 N, 2.3522 E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse DD with South/West directions', () => {
      const result = parseCoordinates('33.8597 S, 151.2111 E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(-33.8597)
      expect(result.longitude).toBe(151.2111)
    })

    it('should parse DD without comma', () => {
      const result = parseCoordinates('48.8566 N 2.3522 E')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse DD with lowercase directions', () => {
      const result = parseCoordinates('48.8566 n, 2.3522 e')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })
  })

  describe('Simple DD format (latitude, longitude)', () => {
    it('should parse simple positive coordinates', () => {
      const result = parseCoordinates('48.8566, 2.3522')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse with negative longitude', () => {
      const result = parseCoordinates('40.7128, -74.0060')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(40.7128)
      expect(result.longitude).toBe(-74.0060)
    })

    it('should parse with negative latitude', () => {
      const result = parseCoordinates('-33.8688, 151.2093')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(-33.8688)
      expect(result.longitude).toBe(151.2093)
    })

    it('should parse with both negative', () => {
      const result = parseCoordinates('-33.8688, -70.6693')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(-33.8688)
      expect(result.longitude).toBe(-70.6693)
    })

    it('should parse with spaces around comma', () => {
      const result = parseCoordinates('48.8566  ,  2.3522')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse with semicolon separator', () => {
      const result = parseCoordinates('48.8566; 2.3522')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should parse integer coordinates', () => {
      const result = parseCoordinates('48, 2')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48)
      expect(result.longitude).toBe(2)
    })

    it('should handle reverse order when values suggest it', () => {
      // longitude=151.2093 (valid but outside typical lat range), latitude=-33.8688
      const result = parseCoordinates('151.2093, -33.8688')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(-33.8688)
      expect(result.longitude).toBe(151.2093)
    })
  })

  describe('Edge cases', () => {
    it('should handle coordinates with parentheses', () => {
      const result = parseCoordinates('(48.8566, 2.3522)')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should handle coordinates with brackets', () => {
      const result = parseCoordinates('[48.8566, 2.3522]')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should handle extra whitespace', () => {
      const result = parseCoordinates('  48.8566 , 2.3522  ')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(48.8566)
      expect(result.longitude).toBe(2.3522)
    })

    it('should handle zero coordinates', () => {
      const result = parseCoordinates('0, 0')
      expect(result).not.toBeNull()
      expect(result.latitude).toBe(0)
      expect(result.longitude).toBe(0)
    })

    it('should handle coordinates at boundaries', () => {
      const result1 = parseCoordinates('90, 180')
      expect(result1).not.toBeNull()
      expect(result1.latitude).toBe(90)
      expect(result1.longitude).toBe(180)

      const result2 = parseCoordinates('-90, -180')
      expect(result2).not.toBeNull()
      expect(result2.latitude).toBe(-90)
      expect(result2.longitude).toBe(-180)
    })
  })

  describe('Real-world locations', () => {
    it('should parse Paris coordinates (Eiffel Tower)', () => {
      const result = parseCoordinates('48.8584, 2.2945')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(48.8584, 4)
      expect(result.longitude).toBeCloseTo(2.2945, 4)
    })

    it('should parse New York coordinates (Statue of Liberty)', () => {
      const result = parseCoordinates('40.6892, -74.0445')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(40.6892, 4)
      expect(result.longitude).toBeCloseTo(-74.0445, 4)
    })

    it('should parse Sydney coordinates (Opera House)', () => {
      const result = parseCoordinates('-33.8568, 151.2153')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(-33.8568, 4)
      expect(result.longitude).toBeCloseTo(151.2153, 4)
    })

    it('should parse Tokyo coordinates', () => {
      const result = parseCoordinates('35.6762, 139.6503')
      expect(result).not.toBeNull()
      expect(result.latitude).toBeCloseTo(35.6762, 4)
      expect(result.longitude).toBeCloseTo(139.6503, 4)
    })
  })
})
