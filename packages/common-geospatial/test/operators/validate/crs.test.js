import { describe, it, expect } from 'vitest'
import { validateOptionalCRS } from '../../../src/operators/validate/crs.js'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { WGS84 } from '../../../src/foundation/index.js'
import { crsObjects } from '../data/crs.fixtures.js'

// A root CRS carries path '/crs' by construction (root object path is '' and the
// caller suffixes '/crs'). Anything else is nested and rejected. Every case that
// exercises CRS resolution must therefore run at the root path.
const ROOT = '/crs'

describe('validateOptionalCRS', () => {
  describe('absent CRS (root defaults to WGS84)', () => {
    it('returns WGS84 and marks the context geodesic at the root', () => {
      const context = {}
      const result = validateOptionalCRS(undefined, ROOT, context)
      expect(result.valid).toBe(true)
      expect(result.crs).toBe(WGS84)
      expect(context.geodesic).toBe(true)
    })
    it('treats null as absent', () => {
      const result = validateOptionalCRS(null, ROOT, {})
      expect(result.valid).toBe(true)
      expect(result.crs).toBe(WGS84)
    })
  })

  describe('invalid inputs', () => {
    it('should return invalid for a string', () => {
      const result = validateOptionalCRS('EPSG:4326', ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_OBJECT)
    })
    it('should return invalid for an array', () => {
      const result = validateOptionalCRS([], ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_OBJECT)
    })
    it('should return invalid for missing type', () => {
      const result = validateOptionalCRS(crsObjects.missingType, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_TYPE)
    })
    it('should return invalid for unknown type', () => {
      const result = validateOptionalCRS(crsObjects.unknownType, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_TYPE)
      expect(result.errors[0].params.type).toBe(crsObjects.unknownType.type)
    })
  })

  describe('name CRS', () => {
    it('should accept a valid name CRS', () => {
      const result = validateOptionalCRS(crsObjects.validName, ROOT)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
    it('should return invalid if properties is missing', () => {
      const result = validateOptionalCRS(crsObjects.nameMissingProperties, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties is null', () => {
      const result = validateOptionalCRS(crsObjects.nameNullProperties, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties.name is missing', () => {
      const result = validateOptionalCRS(crsObjects.nameEmptyProperties, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties.name is an empty string', () => {
      const result = validateOptionalCRS(crsObjects.nameEmptyString, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should return invalid if properties.name is not a string', () => {
      const result = validateOptionalCRS({ type: 'name', properties: { name: 42 } }, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_NAME)
    })
    it('should accept a registered non-WGS84 named CRS', () => {
      const result = validateOptionalCRS({ type: 'name', properties: { name: 'EPSG:3857' } }, ROOT)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should return unsupported crs for an unregistered named CRS', () => {
      const result = validateOptionalCRS({ type: 'name', properties: { name: 'UNKNOWN:CRS' } }, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_CRS)
    })
  })

  describe('geodesic context', () => {
    it('sets geodesic true for a WGS84 named CRS', () => {
      const context = {}
      validateOptionalCRS({ type: 'name', properties: { name: 'EPSG:4326' } }, ROOT, context)
      expect(context.geodesic).toBe(true)
    })
    it('sets geodesic false for a registered projected CRS', () => {
      const context = {}
      validateOptionalCRS({ type: 'name', properties: { name: 'EPSG:3857' } }, ROOT, context)
      expect(context.geodesic).toBe(false)
    })
  })

  describe('link CRS', () => {
    it('should reject a structurally valid link CRS as unsupported', () => {
      const result = validateOptionalCRS(crsObjects.validLink, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_LINK_CRS)
    })
    it('should reject a link CRS without type property as unsupported', () => {
      const result = validateOptionalCRS(crsObjects.validLinkNoType, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_LINK_CRS)
    })
    it('should return invalid if properties is missing', () => {
      const result = validateOptionalCRS(crsObjects.linkMissingProperties, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties is null', () => {
      const result = validateOptionalCRS(crsObjects.linkNullProperties, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties.href is missing', () => {
      const result = validateOptionalCRS(crsObjects.linkMissingHref, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties.href is an empty string', () => {
      const result = validateOptionalCRS(crsObjects.linkEmptyHref, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
    it('should return invalid if properties.href is not a string', () => {
      const result = validateOptionalCRS({ type: 'link', properties: { href: 42 } }, ROOT)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_LINK)
    })
  })

  describe('nested CRS', () => {
    it('rejects a well-formed CRS declared below the root', () => {
      const result = validateOptionalCRS(crsObjects.validName, '/features/0/crs', {})
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_NESTED_CRS)
    })
    it('rejects a malformed nested CRS with the same code (shape is not inspected)', () => {
      const result = validateOptionalCRS('EPSG:4326', '/geometry/crs', {})
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNSUPPORTED_NESTED_CRS)
    })
    it('accepts an absent nested CRS without touching geodesic', () => {
      const context = { geodesic: true }
      const result = validateOptionalCRS(undefined, '/features/0/crs', context)
      expect(result.valid).toBe(true)
      expect(context.geodesic).toBe(true)
    })
    it('does not default a nested absent CRS to WGS84', () => {
      const result = validateOptionalCRS(undefined, '/features/0/crs', {})
      expect(result.crs).toBeUndefined()
    })
  })
})
