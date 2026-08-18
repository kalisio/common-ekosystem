import { describe, it, expect } from 'vitest'
import { validateOptionalBBox } from '../../../src/operators/validate/bbox.js'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { bboxes } from '../data/bbox.fixtures.js'

// Corner range and precision checks flow through validatePosition, which is
// geodesic-only. WGS84 behaviour must be requested explicitly.
const GEO = { geodesic: true }

describe('validateOptionalBBox', () => {
  describe('optional bbox', () => {
    it('treats undefined as absent (valid)', () => {
      const result = validateOptionalBBox(undefined)
      expect(result.valid).toBe(true)
    })
    it('treats null as absent (valid)', () => {
      const result = validateOptionalBBox(null)
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('should return invalid for a string', () => {
      const result = validateOptionalBBox('0,0,1,1')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })
    it('should return invalid for an object', () => {
      const result = validateOptionalBBox({ west: 0, south: 0, east: 1, north: 1 })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })
    it('should return invalid for array of length 3', () => {
      const result = validateOptionalBBox(bboxes.wrongLength3)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })
    it('should return invalid for array of length 5', () => {
      const result = validateOptionalBBox(bboxes.wrongLength5)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })
    it('should return invalid for array of length 7', () => {
      const result = validateOptionalBBox(bboxes.wrongLength7)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })
    it('should return invalid if west is NaN', () => {
      const result = validateOptionalBBox(bboxes.withNaN)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
    it('should return invalid if west is null', () => {
      const result = validateOptionalBBox(bboxes.withNull)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
  })

  describe('south-west corner validation (geodesic)', () => {
    it('should return invalid for out-of-range west longitude', () => {
      const result = validateOptionalBBox(bboxes.invalidWest, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/min/)
    })
    it('should return invalid for out-of-range south latitude', () => {
      const result = validateOptionalBBox(bboxes.invalidSouth, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/min/)
    })
  })

  describe('north-east corner validation (geodesic)', () => {
    it('should return invalid for out-of-range east longitude', () => {
      const result = validateOptionalBBox(bboxes.invalidEast, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/max/)
    })
    it('should return invalid for out-of-range north latitude', () => {
      const result = validateOptionalBBox(bboxes.invalidNorth, '', GEO)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/max/)
    })
  })

  describe('south <= north constraint (CRS-independent)', () => {
    it('should return invalid if south > north', () => {
      const result = validateOptionalBBox(bboxes.southGtNorth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LATITUDE_ORDER)
    })
    it('should include the actual south and north values in the error', () => {
      const result = validateOptionalBBox([0, 30, 10, 20])
      expect(result.valid).toBe(false)
      expect(result.errors[0].params.south).toBe(30)
      expect(result.errors[0].params.north).toBe(20)
    })
    it('should accept south === north', () => {
      const result = validateOptionalBBox(bboxes.southEqualsNorth, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('antimeridian crossing (geodesic)', () => {
    it('should warn when west > east (antimeridian crossing)', () => {
      const result = validateOptionalBBox(bboxes.antimeridian, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(true)
    })
    it('should include west and east values in the warning', () => {
      const result = validateOptionalBBox([170, -10, -170, 10], '', GEO)
      expect(result.valid).toBe(true)
      const warning = result.warnings.find(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)
      expect(warning.params.west).toBe(170)
      expect(warning.params.east).toBe(-170)
    })
    it('should not warn for a standard bbox (west < east)', () => {
      const result = validateOptionalBBox(bboxes.valid2D, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
    it('should not warn when west === east', () => {
      const result = validateOptionalBBox([5, -10, 5, 10], '', GEO)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(false)
    })
  })

  describe('3D bbox', () => {
    it('should accept a valid 3D bbox', () => {
      const result = validateOptionalBBox(bboxes.valid3D, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('precision warnings (geodesic)', () => {
    it('does not warn at the default precision (7 decimals)', () => {
      const result = validateOptionalBBox([2.3522123, 48.8566123, 3.1234567, 49.1234567], '', GEO)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
    it('warns beyond the default precision (8 decimals)', () => {
      const result = validateOptionalBBox([2.35221234, 48.8566, 3.1234, 49.1234], '', GEO)
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION,
          params: { precision: 8, max: 7 }
        })
      )
    })
    it('propagates a custom precision to min/max positions', () => {
      // 7-decimal coords with threshold 6 -> warnings must surface with max: 6
      const result = validateOptionalBBox([2.3522123, 48.8566123, 3.1234567, 49.1234567], '', { geodesic: true, precision: 6 })
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.every((w) => w.params.max === 6)).toBe(true)
    })
    it('reports precision warnings with the correct path (min/max)', () => {
      const result = validateOptionalBBox([2.35221234, 48.8566, 3.1234, 49.1234], 'bbox', GEO)
      // the warning should come from the /min position (west has 8 decimals)
      expect(result.warnings.some((w) => w.path.includes('min'))).toBe(true)
    })
  })

  describe('projected CRS (geodesic: false)', () => {
    // Lambert-93 easting/northing; X ordering is enforced (no antimeridian).
    it('rejects an X-inverted bbox as a longitude order error', () => {
      const result = validateOptionalBBox([700000, 6800000, 500000, 6900000], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LONGITUDE_ORDER)
    })
    it('accepts coordinates outside the geographic ranges', () => {
      const result = validateOptionalBBox([500000, 6800000, 700000, 6900000], '', { geodesic: false })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('never emits an antimeridian warning', () => {
      const result = validateOptionalBBox([700000, 6800000, 500000, 6900000], '', { geodesic: false })
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(false)
    })
    it('still enforces south <= north', () => {
      const result = validateOptionalBBox([500000, 6900000, 700000, 6800000], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LATITUDE_ORDER)
    })
  })

  describe('valid bbox (geodesic)', () => {
    it('should accept a standard 2D bbox', () => {
      const result = validateOptionalBBox(bboxes.valid2D, '', GEO)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })
})
