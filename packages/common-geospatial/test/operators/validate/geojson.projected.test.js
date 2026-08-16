import { describe, it, expect, beforeAll } from 'vitest'
import { validateGeoJson, validateBBox, validatePosition } from '../../../src/operators'
import { defineProjection } from '../../../src/foundation/index.js'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'

// Lambert-93 (EPSG:2154) is not registered by proj4 out of the box.
const LAMBERT_93_DEF = '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
const lambert93 = { type: 'name', properties: { name: 'EPSG:2154' } }
const projected = (geometry, extra = {}) => ({ type: 'Feature', geometry, properties: {}, crs: lambert93, ...extra })

describe('validateGeoJson — projected CRS', () => {
  beforeAll(() => defineProjection('EPSG:2154', LAMBERT_93_DEF))

  describe('CRS detection', () => {
    it('accepts projected coordinates under a registered non-WGS84 CRS', () => {
      const result = validateGeoJson(projected({ type: 'Point', coordinates: [700000, 6600000] }))
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('accepts a bare projected geometry carrying the CRS', () => {
      const result = validateGeoJson({ type: 'Point', coordinates: [700000, 6600000], crs: lambert93 })
      expect(result.valid).toBe(true)
    })
    it('accepts Web Mercator (EPSG:3857), registered by default', () => {
      const result = validateGeoJson({ type: 'Point', coordinates: [257000, 6250000], crs: { type: 'name', properties: { name: 'EPSG:3857' } } })
      expect(result.valid).toBe(true)
    })
    it('normalises an EPSG URN CRS consistently with extractGeoJsonCRS', () => {
      const result = validateGeoJson(projected({ type: 'Point', coordinates: [700000, 6600000] }, { crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::2154' } } }))
      expect(result.valid).toBe(true)
    })
    it('reports UNSUPPORTED_CRS for an unregistered named CRS', () => {
      const result = validateGeoJson({ type: 'Point', coordinates: [700000, 6600000], crs: { type: 'name', properties: { name: 'UNKNOWN:CRS' } } })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.UNSUPPORTED_CRS)).toBe(true)
    })
    it('reports UNSUPPORTED_LINK_CRS for a link CRS', () => {
      const result = validateGeoJson({ type: 'Point', coordinates: [700000, 6600000], crs: { type: 'link', properties: { href: 'https://example.com/crs' } } })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.UNSUPPORTED_LINK_CRS)).toBe(true)
    })
  })

  describe('WGS84 interpretation without a CRS', () => {
    it('rejects the same projected coordinates as out-of-range longitude', () => {
      const result = validateGeoJson({ type: 'Point', coordinates: [700000, 6600000] })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
    })
  })

  describe('CRS-independent checks still run', () => {
    it('rejects non-finite projected coordinates', () => {
      expect(validateGeoJson(projected({ type: 'Point', coordinates: [Infinity, 6600000] })).valid).toBe(false)
      expect(validateGeoJson(projected({ type: 'Point', coordinates: [NaN, 6600000] })).valid).toBe(false)
    })
    it('rejects an unclosed projected ring', () => {
      const ring = [[700000, 6600000], [701000, 6600000], [701000, 6601000], [700000, 6601000]]
      const result = validateGeoJson(projected({ type: 'Polygon', coordinates: [ring] }))
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.RING_NOT_CLOSED)).toBe(true)
    })
    it('warns about consecutive duplicate projected positions', () => {
      const line = [[700000, 6600000], [700000, 6600000], [701000, 6601000]]
      const result = validateGeoJson(projected({ type: 'LineString', coordinates: line }))
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
    })
    it('accepts a valid projected bbox', () => {
      const result = validateGeoJson(projected({ type: 'Point', coordinates: [700000, 6600000] }, { bbox: [700000, 6600000, 710000, 6610000] }))
      expect(result.valid).toBe(true)
    })
  })

  describe('geodesic-only checks are skipped', () => {
    it('does not enforce winding order on a clockwise projected exterior ring', () => {
      const cwRing = [[700000, 6600000], [700000, 6601000], [701000, 6601000], [701000, 6600000], [700000, 6600000]]
      const result = validateGeoJson(projected({ type: 'Polygon', coordinates: [cwRing] }))
      expect(result.valid).toBe(true)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(false)
    })
    it('does not warn about antimeridian crossings for projected line segments', () => {
      const line = [[700000, 6600000], [1200000, 6600000]]
      const result = validateGeoJson(projected({ type: 'LineString', coordinates: line }))
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.ANTIMERIDIAN_CROSSING)).toBe(false)
    })
    it('does not apply longitude/latitude ranges through validatePosition', () => {
      const result = validatePosition([700000, 6600000], '', { geodesic: false })
      expect(result.valid).toBe(true)
    })
  })

  describe('optional CRS/bbox are not skipped', () => {
    it('validates the CRS of a Feature with null geometry', () => {
      const result = validateGeoJson({ type: 'Feature', geometry: null, properties: {}, crs: { type: 'link', properties: { href: 'https://example.com/crs' } } })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.UNSUPPORTED_LINK_CRS)).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.MISSING_GEOMETRY)).toBe(true)
    })
    it('validates the CRS of an empty FeatureCollection', () => {
      const result = validateGeoJson({ type: 'FeatureCollection', features: [], crs: { type: 'link', properties: { href: 'https://example.com/crs' } } })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.UNSUPPORTED_LINK_CRS)).toBe(true)
    })
    it('accepts an empty FeatureCollection', () => {
      const result = validateGeoJson({ type: 'FeatureCollection', features: [], crs: lambert93 })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('rejects a projected bbox whose minX exceeds maxX', () => {
      const result = validateBBox([710000, 6600000, 700000, 6610000], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LONGITUDE_ORDER)
    })
    it('rejects a projected bbox whose south exceeds north', () => {
      const result = validateBBox([700000, 6610000, 710000, 6600000], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_LATITUDE_ORDER)
    })
    it('rejects a projected 3D bbox whose min altitude exceeds max altitude', () => {
      const result = validateBBox([700000, 6600000, 100, 710000, 6610000, 50], '', { geodesic: false })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_BBOX_ALTITUDE_ORDER)
    })
    it('keeps a WGS84 west>east bbox an antimeridian warning, not a projected-X error', () => {
      const result = validateBBox([170, 40, -170, 50], '', { geodesic: true })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(true)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.INVALID_BBOX_LONGITUDE_ORDER)).toBe(false)
    })
  })
})
