import { describe, it, expect } from 'vitest'
import { validateBBox } from '../../../src/algorithms/validate'

describe('validateBBox', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateBBox(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/4.*6|6.*4/)
    })

    it('should return invalid for array of length 3', () => {
      const result = validateBBox([0, 0, 0])
      expect(result.valid).toBe(false)
    })

    it('should return invalid for array of length 5', () => {
      const result = validateBBox([0, 0, 0, 0, 0])
      expect(result.valid).toBe(false)
    })

    it('should return invalid for array of length 7', () => {
      const result = validateBBox([0, 0, 0, 0, 0, 0, 0])
      expect(result.valid).toBe(false)
    })
  })

  describe('south-west validation', () => {
    it('should return invalid for out-of-range west longitude', () => {
      const result = validateBBox([-181, 0, 10, 10])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/south-west/)
    })

    it('should return invalid for out-of-range south latitude', () => {
      const result = validateBBox([0, -91, 10, 10])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/south-west/)
    })
  })

  describe('north-east validation', () => {
    it('should return invalid for out-of-range east longitude', () => {
      const result = validateBBox([0, 0, 181, 10])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/north-east/)
    })

    it('should return invalid for out-of-range north latitude', () => {
      const result = validateBBox([0, 0, 10, 91])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/north-east/)
    })
  })

  describe('south <= north', () => {
    it('should return invalid if south > north', () => {
      const result = validateBBox([0, 10, 10, 5])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/south.*north|north.*south/)
    })

    it('should accept south === north', () => {
      const result = validateBBox([0, 10, 10, 10])
      expect(result.valid).toBe(true)
    })
  })

  describe('antimeridian', () => {
    it('should warn when west > east (antimeridian crossing)', () => {
      const result = validateBBox([170, -10, -170, 10])
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/antimeridian/))).toBe(true)
    })

    it('should not warn for normal bbox', () => {
      const result = validateBBox([-10, -10, 10, 10])
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('3D bbox', () => {
    it('should accept valid 3D bbox', () => {
      const result = validateBBox([-10, -10, 0, 10, 10, 100])
      expect(result.valid).toBe(true)
    })
  })

  describe('precision warnings', () => {
    it('should forward precision warnings from positions', () => {
      const result = validateBBox([2.1234567, 48.1234567, 3.1234567, 49.1234567])
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('valid bbox', () => {
    it('should accept a standard 2D bbox', () => {
      const result = validateBBox([-5, 41, 9, 51])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })
})
