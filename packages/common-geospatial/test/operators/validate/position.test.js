import { describe, it, expect } from 'vitest'
import { validatePosition } from '../../../src/operators'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { positions } from '../data/position.fixtures.js'

describe('validatePosition', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validatePosition(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })
    it('should return invalid for a string', () => {
      const result = validatePosition('0,0')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })

    it('should return invalid for an object', () => {
      const result = validatePosition({ lon: 0, lat: 0 })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })
    it('should return invalid for an empty array', () => {
      const result = validatePosition(positions.empty)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })
    it('should return invalid for array of length 1', () => {
      const result = validatePosition(positions.tooShort)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })
    it('should return invalid for array of length 4', () => {
      const result = validatePosition(positions.tooLong)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })
    it('should return invalid if longitude is NaN', () => {
      const result = validatePosition(positions.withNaNLon)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
    it('should return invalid if latitude is NaN', () => {
      const result = validatePosition(positions.withNaNLat)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
    it('should return invalid if longitude is Infinity', () => {
      const result = validatePosition(positions.withInfinityLon)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
    it('should return invalid if an element is null', () => {
      const result = validatePosition(positions.withNullInArray)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
    it('should return invalid if an element is a string', () => {
      const result = validatePosition(positions.withStringInArray)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
  })

  describe('longitude validation', () => {
    it('should return invalid for longitude < -180', () => {
      const result = validatePosition(positions.invalidLonLow)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLonLow[0])
    })
    it('should return invalid for longitude > 180', () => {
      const result = validatePosition(positions.invalidLonHigh)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLonHigh[0])
    })
    it('should accept longitude = -180', () => {
      const result = validatePosition(positions.atLonMin)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept longitude = 180', () => {
      const result = validatePosition(positions.atLonMax)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('latitude validation', () => {
    it('should return invalid for latitude < -90', () => {
      const result = validatePosition(positions.invalidLatLow)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLatLow[1])
    })
    it('should return invalid for latitude > 90', () => {
      const result = validatePosition(positions.invalidLatHigh)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLatHigh[1])
    })
    it('should accept latitude = -90', () => {
      const result = validatePosition(positions.atLatMin)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept latitude = 90', () => {
      const result = validatePosition(positions.atLatMax)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('altitude validation', () => {
    it('should accept a valid 3D position', () => {
      const result = validatePosition(positions.valid3D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should return invalid if altitude is not a number', () => {
      const result = validatePosition(positions.invalidAltitude)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_ALTITUDE)
    })
    it('should return invalid if altitude is NaN', () => {
      const result = validatePosition([0, 0, NaN])
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_ALTITUDE)
    })
  })

  describe('validatePosition — precision warnings', () => {
    it('does not warn at the default precision (7 decimals)', () => {
      const result = validatePosition([2.3522123, 48.8566123])
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
    it('warns beyond the default precision (8 decimals on longitude)', () => {
      const result = validatePosition([2.35221234, 48.8566])
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION,
          params: { precision: 8, max: 7 }
        })
      )
    })
    it('warns beyond the default precision (8 decimals on latitude)', () => {
      const result = validatePosition([2.3522, 48.85661234])
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LATITUDE_PRECISION,
          params: { precision: 8, max: 7 }
        })
      )
    })
    it('respects a custom precision threshold', () => {
      const result = validatePosition([2.3522123, 48.8566], '', { precision: 6 })
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION,
          params: { precision: 7, max: 6 }
        })
      )
    })
    it('reports max reflecting the passed precision', () => {
      const result = validatePosition([2.352212345, 48.8566], '', { precision: 4 })
      expect(result.warnings[0].params.max).toBe(4)
    })
  })

  describe('valid positions', () => {
    it('should accept a standard 2D position', () => {
      const result = validatePosition(positions.valid2D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
    it('should accept a standard 3D position', () => {
      const result = validatePosition(positions.valid3D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept extreme valid coordinates (corners of the world)', () => {
      expect(validatePosition([-180, -90]).valid).toBe(true)
      expect(validatePosition([180, 90]).valid).toBe(true)
      expect(validatePosition([0, 0]).valid).toBe(true)
    })
  })
})
