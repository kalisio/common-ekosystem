import { describe, it, expect } from 'vitest'
import { validatePosition } from '../../../src/operators'

describe('validatePosition', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validatePosition(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/array/)
    })

    it('should return invalid for empty array', () => {
      const result = validatePosition([])
      expect(result.valid).toBe(false)
    })

    it('should return invalid for array of length 1', () => {
      const result = validatePosition([1])
      expect(result.valid).toBe(false)
    })

    it('should return invalid for array of length 4', () => {
      const result = validatePosition([1, 2, 3, 4])
      expect(result.valid).toBe(false)
    })
  })

  describe('longitude validation', () => {
    it('should return invalid for longitude < -180', () => {
      const result = validatePosition([-181, 0])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/longitude/)
    })

    it('should return invalid for longitude > 180', () => {
      const result = validatePosition([181, 0])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/longitude/)
    })

    it('should accept longitude = -180', () => {
      const result = validatePosition([-180, 0])
      expect(result.valid).toBe(true)
    })

    it('should accept longitude = 180', () => {
      const result = validatePosition([180, 0])
      expect(result.valid).toBe(true)
    })
  })

  describe('latitude validation', () => {
    it('should return invalid for latitude < -90', () => {
      const result = validatePosition([0, -91])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/latitude/)
    })

    it('should return invalid for latitude > 90', () => {
      const result = validatePosition([0, 91])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/latitude/)
    })

    it('should accept latitude = -90', () => {
      const result = validatePosition([0, -90])
      expect(result.valid).toBe(true)
    })

    it('should accept latitude = 90', () => {
      const result = validatePosition([0, 90])
      expect(result.valid).toBe(true)
    })
  })

  describe('altitude validation', () => {
    it('should accept valid 3D position', () => {
      const result = validatePosition([0, 0, 100])
      expect(result.valid).toBe(true)
    })

    it('should return invalid if altitude is not a number', () => {
      const result = validatePosition([0, 0, 'high'])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/altitude/)
    })
  })

  describe('precision warnings', () => {
    it('should warn if longitude precision > 6 decimals', () => {
      const result = validatePosition([2.1234567, 48])
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/longitude precision/))).toBe(true)
    })

    it('should warn if latitude precision > 6 decimals', () => {
      const result = validatePosition([2, 48.1234567])
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/latitude precision/))).toBe(true)
    })

    it('should not warn for precision <= 6 decimals', () => {
      const result = validatePosition([2.123456, 48.123456])
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('valid positions', () => {
    it('should accept a standard 2D position', () => {
      const result = validatePosition([2.3522, 48.8566])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept a standard 3D position', () => {
      const result = validatePosition([2.3522, 48.8566, 35])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
