import { describe, it, expect } from 'vitest'
import { validateBBox } from '../../../src/operators'
import { bboxes } from './data/fixtures.js'

describe('validateBBox', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateBBox(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/4.*6|6.*4/)
    })

    it('should return invalid for a string', () => {
      const result = validateBBox('0,0,1,1')
      expect(result.valid).toBe(false)
    })

    it('should return invalid for an object', () => {
      const result = validateBBox({ west: 0, south: 0, east: 1, north: 1 })
      expect(result.valid).toBe(false)
    })

    it('should return invalid for array of length 3', () => {
      const result = validateBBox(bboxes.wrongLength3)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/4.*6|6.*4/)
    })

    it('should return invalid for array of length 5', () => {
      const result = validateBBox(bboxes.wrongLength5)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/4.*6|6.*4/)
    })

    it('should return invalid for array of length 7', () => {
      const result = validateBBox(bboxes.wrongLength7)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/4.*6|6.*4/)
    })

    it('should return invalid if west is NaN', () => {
      const result = validateBBox(bboxes.withNaN)
      expect(result.valid).toBe(false)
    })

    it('should return invalid if west is null', () => {
      const result = validateBBox(bboxes.withNull)
      expect(result.valid).toBe(false)
    })
  })

  describe('south-west corner validation', () => {
    it('should return invalid for out-of-range west longitude', () => {
      const result = validateBBox(bboxes.invalidWest)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/south-west/)
      expect(result.errors[0].message).toMatch(/-181|longitude/)
    })

    it('should return invalid for out-of-range south latitude', () => {
      const result = validateBBox(bboxes.invalidSouth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/south-west/)
      expect(result.errors[0].message).toMatch(/-91|latitude/)
    })
  })

  describe('north-east corner validation', () => {
    it('should return invalid for out-of-range east longitude', () => {
      const result = validateBBox(bboxes.invalidEast)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/north-east/)
      expect(result.errors[0].message).toMatch(/181|longitude/)
    })

    it('should return invalid for out-of-range north latitude', () => {
      const result = validateBBox(bboxes.invalidNorth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/north-east/)
      expect(result.errors[0].message).toMatch(/91|latitude/)
    })
  })

  describe('south <= north constraint', () => {
    it('should return invalid if south > north', () => {
      const result = validateBBox(bboxes.southGtNorth)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/south.*north|north.*south/)
    })

    it('should include the actual south and north values in the error', () => {
      const result = validateBBox([0, 30, 10, 20])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/30/)
      expect(result.errors[0].message).toMatch(/20/)
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
      expect(result.warnings.some(w => w.message.match(/antimeridian/))).toBe(true)
    })

    it('should include west and east values in the warning', () => {
      const result = validateBBox([170, -10, -170, 10])
      expect(result.valid).toBe(true)
      const warning = result.warnings.find(w => w.message.match(/antimeridian/))
      expect(warning.message).toMatch(/170/)
      expect(warning.message).toMatch(/-170/)
    })

    it('should not warn for a standard bbox (west < east)', () => {
      const result = validateBBox(bboxes.valid2D)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should not warn when west === east', () => {
      const result = validateBBox([5, -10, 5, 10])
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/antimeridian/))).toBe(false)
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
      expect(result.warnings.some(w => w.message.match(/precision/))).toBe(true)
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
