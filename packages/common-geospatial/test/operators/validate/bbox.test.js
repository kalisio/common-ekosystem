import { describe, it, expect } from 'vitest'
import { validateBBox } from '../../../src/operators'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { bboxes } from './data/fixtures.js'

describe('validateBBox', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateBBox(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })

    it('should return invalid for a string', () => {
      const result = validateBBox('0,0,1,1')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })

    it('should return invalid for an object', () => {
      const result = validateBBox({ west: 0, south: 0, east: 1, north: 1 })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })

    it('should return invalid for array of length 3', () => {
      const result = validateBBox(bboxes.wrongLength3)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })

    it('should return invalid for array of length 5', () => {
      const result = validateBBox(bboxes.wrongLength5)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })

    it('should return invalid for array of length 7', () => {
      const result = validateBBox(bboxes.wrongLength7)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LENGTH)
    })

    it('should return invalid if west is NaN', () => {
      const result = validateBBox(bboxes.withNaN)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })

    it('should return invalid if west is null', () => {
      const result = validateBBox(bboxes.withNull)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POSITION_COORDINATES)
    })
  })

  describe('south-west corner validation', () => {
    it('should return invalid for out-of-range west longitude', () => {
      const result = validateBBox(bboxes.invalidWest)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/min/)
    })

    it('should return invalid for out-of-range south latitude', () => {
      const result = validateBBox(bboxes.invalidSouth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/min/)
    })
  })

  describe('north-east corner validation', () => {
    it('should return invalid for out-of-range east longitude', () => {
      const result = validateBBox(bboxes.invalidEast)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/max/)
    })

    it('should return invalid for out-of-range north latitude', () => {
      const result = validateBBox(bboxes.invalidNorth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LATITUDE_RANGE)
      expect(result.errors[0].path).toMatch(/max/)
    })
  })

  describe('south <= north constraint', () => {
    it('should return invalid if south > north', () => {
      const result = validateBBox(bboxes.southGtNorth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LATITUDE_ORDER)
    })

    it('should include the actual south and north values in the error', () => {
      const result = validateBBox([0, 30, 10, 20])
      expect(result.valid).toBe(false)
      expect(result.errors[0].params.south).toBe(30)
      expect(result.errors[0].params.north).toBe(20)
    })

    it('should accept south === north', () => {
      const result = validateBBox(bboxes.southEqualsNorth)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('antimeridian crossing', () => {
    it('should warn when west > east (antimeridian crossing)', () => {
      const result = validateBBox(bboxes.antimeridian)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(true)
    })

    it('should include west and east values in the warning', () => {
      const result = validateBBox([170, -10, -170, 10])
      expect(result.valid).toBe(true)
      const warning = result.warnings.find(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)
      expect(warning.params.west).toBe(170)
      expect(warning.params.east).toBe(-170)
    })

    it('should not warn for a standard bbox (west < east)', () => {
      const result = validateBBox(bboxes.valid2D)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should not warn when west === east', () => {
      const result = validateBBox([5, -10, 5, 10])
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(false)
    })
  })

  describe('3D bbox', () => {
    it('should accept a valid 3D bbox', () => {
      const result = validateBBox(bboxes.valid3D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('precision warnings', () => {
    it('should forward precision warnings from SW and NE positions', () => {
      const result = validateBBox(bboxes.highPrecision)
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => [
        VALIDATION_CODES.HIGH_LONGITUDE_PRECISION,
        VALIDATION_CODES.HIGH_LATITUDE_PRECISION
      ].includes(w.code))).toBe(true)
    })
  })

  describe('valid bbox', () => {
    it('should accept a standard 2D bbox', () => {
      const result = validateBBox(bboxes.valid2D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })
})
