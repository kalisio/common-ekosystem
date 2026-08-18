import { describe, it, expect } from 'vitest'
import { validatePosition } from '../../../src/operators/validate/position.js'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { positions } from '../data/position.fixtures.js'

// Range and precision checks are geodesic-only. In isolation validatePosition
// reads context.geodesic with no default (it is set upstream by the root CRS),
// so WGS84 behaviour must be requested explicitly.
const GEO = { geodesic: true }

describe('validatePosition', () => {
  describe('invalid inputs (CRS-independent)', () => {
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

  describe('longitude validation (geodesic)', () => {
    it('should return invalid for longitude < -180', () => {
      const result = validatePosition(positions.invalidLonLow, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLonLow[0])
    })
    it('should return invalid for longitude > 180', () => {
      const result = validatePosition(positions.invalidLonHigh, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLonHigh[0])
    })
    it('should accept longitude = -180', () => {
      const result = validatePosition(positions.atLonMin, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept longitude = 180', () => {
      const result = validatePosition(positions.atLonMax, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('latitude validation (geodesic)', () => {
    it('should return invalid for latitude < -90', () => {
      const result = validatePosition(positions.invalidLatLow, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLatLow[1])
    })
    it('should return invalid for latitude > 90', () => {
      const result = validatePosition(positions.invalidLatHigh, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].params.value).toBe(positions.invalidLatHigh[1])
    })
    it('should accept latitude = -90', () => {
      const result = validatePosition(positions.atLatMin, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept latitude = 90', () => {
      const result = validatePosition(positions.atLatMax, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('altitude validation (CRS-independent)', () => {
    it('should accept a valid 3D position', () => {
      const result = validatePosition(positions.valid3D, '', GEO)
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

  describe('precision warnings (geodesic)', () => {
    it('does not warn at the default precision (7 decimals)', () => {
      const result = validatePosition([2.3522123, 48.8566123], '', GEO)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
    it('warns beyond the default precision (8 decimals on longitude)', () => {
      const result = validatePosition([2.35221234, 48.8566], '', GEO)
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION,
          params: { precision: 8, max: 7 }
        })
      )
    })
    it('warns beyond the default precision (8 decimals on latitude)', () => {
      const result = validatePosition([2.3522, 48.85661234], '', GEO)
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LATITUDE_PRECISION,
          params: { precision: 8, max: 7 }
        })
      )
    })
    it('respects a custom precision threshold', () => {
      const result = validatePosition([2.3522123, 48.8566], '', { geodesic: true, precision: 6 })
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION,
          params: { precision: 7, max: 6 }
        })
      )
    })
    it('reports max reflecting the passed precision', () => {
      const result = validatePosition([2.352212345, 48.8566], '', { geodesic: true, precision: 4 })
      expect(result.warnings[0].params.max).toBe(4)
    })
  })

  describe('projected CRS (geodesic: false)', () => {
    // Lambert-93 (EPSG:2154) easting/northing, well outside geographic ranges.
    it('accepts coordinates outside the geographic longitude/latitude ranges', () => {
      const result = validatePosition([652149.12, 6862035.87], '', { geodesic: false })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('does not emit precision warnings for long decimals', () => {
      const result = validatePosition([652149.12345678, 6862035.87654321], '', { geodesic: false })
      expect(result.warnings).toHaveLength(0)
    })
    it('still rejects non-finite coordinates', () => {
      const result = validatePosition([NaN, 6862035.87], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
    it('still rejects a wrong length', () => {
      const result = validatePosition([652149.12], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_LENGTH)
    })
  })

  describe('default context', () => {
    it('treats a bare call as planar: no range check without geodesic', () => {
      // [200, 100] is out of WGS84 range but valid in planar mode.
      const result = validatePosition([200, 100])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('emits no precision warnings without geodesic', () => {
      const result = validatePosition([2.35221234, 48.85661234])
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('valid positions (geodesic)', () => {
    it('should accept a standard 2D position', () => {
      const result = validatePosition(positions.valid2D, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
    it('should accept a standard 3D position', () => {
      const result = validatePosition(positions.valid3D, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept extreme valid coordinates (corners of the world)', () => {
      expect(validatePosition([-180, -90], '', GEO).valid).toBe(true)
      expect(validatePosition([180, 90], '', GEO).valid).toBe(true)
      expect(validatePosition([0, 0], '', GEO).valid).toBe(true)
    })
  })
})
