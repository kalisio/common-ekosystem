import { describe, it, expect } from 'vitest'
import { validateCRS } from '../../../src/operators'

describe('validateCRS', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateCRS(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/object/)
    })

    it('should return invalid for a string', () => {
      const result = validateCRS('EPSG:4326')
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/object/)
    })

    it('should return invalid for unknown type', () => {
      const result = validateCRS({ type: 'unknown' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/unknown type/)
    })

    it('should return invalid for missing type', () => {
      const result = validateCRS({ properties: { name: 'EPSG:4326' } })
      expect(result.valid).toBe(false)
    })
  })

  describe('name CRS', () => {
    it('should accept a valid name CRS', () => {
      const result = validateCRS({ type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid if properties.name is missing', () => {
      const result = validateCRS({ type: 'name', properties: {} })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/name/)
    })

    it('should return invalid if properties.name is empty string', () => {
      const result = validateCRS({ type: 'name', properties: { name: '' } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/name/)
    })

    it('should return invalid if properties is missing', () => {
      const result = validateCRS({ type: 'name' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/name/)
    })
  })

  describe('link CRS', () => {
    it('should accept a valid link CRS', () => {
      const result = validateCRS({ type: 'link', properties: { href: 'https://example.com/crs', type: 'proj4' } })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept a link CRS without type property', () => {
      const result = validateCRS({ type: 'link', properties: { href: 'https://example.com/crs' } })
      expect(result.valid).toBe(true)
    })

    it('should return invalid if properties.href is missing', () => {
      const result = validateCRS({ type: 'link', properties: {} })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/href/)
    })

    it('should return invalid if properties.href is empty string', () => {
      const result = validateCRS({ type: 'link', properties: { href: '' } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/href/)
    })

    it('should return invalid if properties is missing', () => {
      const result = validateCRS({ type: 'link' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/href/)
    })
  })
})
