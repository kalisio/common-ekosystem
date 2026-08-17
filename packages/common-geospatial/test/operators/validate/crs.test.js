import { describe, it, expect } from 'vitest'
import { validateCRS } from '../../../src/operators/validate/crs.js'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { crsObjects } from '../data/crs.fixtures.js'

describe('validateCRS', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateCRS(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_OBJECT)
    })

    it('should return invalid for a string', () => {
      const result = validateCRS('EPSG:4326')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_OBJECT)
    })

    it('should return invalid for an array', () => {
      const result = validateCRS([])
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_OBJECT)
    })

    it('should return invalid for missing type', () => {
      const result = validateCRS(crsObjects.missingType)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_TYPE)
    })

    it('should return invalid for unknown type', () => {
      const result = validateCRS(crsObjects.unknownType)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_TYPE)
      expect(result.errors[0].params.type).toBe(crsObjects.unknownType.type)
    })
  })

  describe('name CRS', () => {
    it('should accept a valid name CRS', () => {
      const result = validateCRS(crsObjects.validName)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
    it('should return invalid if properties is missing', () => {
      const result = validateCRS(crsObjects.nameMissingProperties)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties is null', () => {
      const result = validateCRS(crsObjects.nameNullProperties)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties.name is missing', () => {
      const result = validateCRS(crsObjects.nameEmptyProperties)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties.name is an empty string', () => {
      const result = validateCRS(crsObjects.nameEmptyString)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties.name is not a string', () => {
      const result = validateCRS({ type: 'name', properties: { name: 42 } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should accept a registered non-WGS84 named CRS', () => {
      const result = validateCRS({ type: 'name', properties: { name: 'EPSG:3857' } })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should return unsupported crs for an unregistered named CRS', () => {
      const result = validateCRS({ type: 'name', properties: { name: 'UNKNOWN:CRS' } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_CRS)
    })
  })

  describe('link CRS', () => {
    it('should reject a structurally valid link CRS as unsupported', () => {
      const result = validateCRS(crsObjects.validLink)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_LINK_CRS)
    })
    it('should reject a link CRS without type property as unsupported', () => {
      const result = validateCRS(crsObjects.validLinkNoType)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_LINK_CRS)
    })
    it('should return invalid if properties is missing', () => {
      const result = validateCRS(crsObjects.linkMissingProperties)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties is null', () => {
      const result = validateCRS(crsObjects.linkNullProperties)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties.href is missing', () => {
      const result = validateCRS(crsObjects.linkMissingHref)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties.href is an empty string', () => {
      const result = validateCRS(crsObjects.linkEmptyHref)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties.href is not a string', () => {
      const result = validateCRS({ type: 'link', properties: { href: 42 } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
  })
})
