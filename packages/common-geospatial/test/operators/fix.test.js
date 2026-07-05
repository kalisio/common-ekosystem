import { describe, it, expect } from 'vitest'
import { fixGeoJson, validateGeoJson } from '../../src/operators'
import { VALIDATION_CODES } from '../../src/operators/validate/codes.js'
import { lineStrings } from './data/linestring.fixtures.js'
import { polygons } from './data/polygon.fixtures.js'
import { geometries } from './data/geometry.fixtures.js'
import { features } from './data/feature.fixtures.js'

describe('fixGeoJson', () => {
  describe('argument validation', () => {
    it('should throw if geoJson is not GeoJson-like', () => {
      const validation = validateGeoJson(polygons.valid)
      expect(() => fixGeoJson(null, { validation })).toThrow()
      expect(() => fixGeoJson('not-geojson', { validation })).toThrow()
    })
    it('should throw if options is missing', () => {
      const geometry = structuredClone(polygons.cwOuter)
      expect(() => fixGeoJson(geometry)).toThrow()
    })
    it('should throw if options.validation is missing', () => {
      const geometry = structuredClone(polygons.cwOuter)
      expect(() => fixGeoJson(geometry, {})).toThrow()
    })
    it('should throw if options.windingOrder is not a boolean', () => {
      const geometry = structuredClone(polygons.cwOuter)
      const validation = validateGeoJson(geometry)
      expect(() => fixGeoJson(geometry, { validation, windingOrder: 'yes' })).toThrow()
    })
  })

  describe('raw geometry', () => {
    it('should fix a clockwise polygon', () => {
      const geometry = structuredClone(polygons.cwOuter)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(true)
      expect(result.corrections[0].path).toBe('')
      expect(result.fixed).toBe(geometry)
    })
    it('should fix a self-intersecting polygon', () => {
      const geometry = structuredClone(polygons.selfIntersecting)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })
    it('should return no corrections and no unfixed for an already valid geometry', () => {
      const geometry = structuredClone(polygons.valid)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections).toHaveLength(0)
      expect(result.unfixed).toHaveLength(0)
    })
    it('should leave a LineString untouched even if it self-intersects', () => {
      const geometry = { type: 'LineString', coordinates: [[0, 0], [2, 2], [0, 2], [2, 0]] }
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections).toHaveLength(0)
    })
  })

  describe('duplicate position', () => {
    it('should remove a duplicate consecutive position from a LineString', () => {
      const geometry = structuredClone(lineStrings.withDuplicate)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
      expect(geometry.coordinates).toHaveLength(lineStrings.withDuplicate.coordinates.length - 1)
    })
    it('should fix both the duplicate and the resulting self-intersection on a Polygon, without needlessly perturbing an already-clean ring', () => {
      const geometry = structuredClone(polygons.withDuplicate)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
      // The self-intersection is reported as corrected -- resolved as a side
      // effect of dedupe, not via the buffer fix -- and nothing is left unfixed.
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
      expect(result.unfixed).toHaveLength(0)
    })
    it('should still apply the buffer fix for a genuine self-intersection unrelated to any duplicate', () => {
      const geometry = structuredClone(polygons.selfIntersecting)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })
    it('should respect duplicatePosition: false and report it as unfixed', () => {
      const geometry = structuredClone(lineStrings.withDuplicate)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation, duplicatePosition: false })
      expect(result.corrections).toHaveLength(0)
      expect(result.unfixed.some(i => i.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
    })
  })

  describe('Feature', () => {
    it('should fix the geometry of an invalid Feature and report the /geometry path', () => {
      const feature = structuredClone(features.valid)
      feature.geometry = structuredClone(polygons.cwOuter)
      const validation = validateGeoJson(feature)
      const result = fixGeoJson(feature, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(true)
      expect(result.corrections[0].path).toBe('/geometry')
    })
  })

  describe('FeatureCollection', () => {
    it('should fix only the feature that needs it, with a flat corrections list', () => {
      const collection = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: {}, geometry: structuredClone(polygons.valid) },
          { type: 'Feature', properties: {}, geometry: structuredClone(polygons.cwOuter) }
        ]
      }
      const validation = validateGeoJson(collection)
      const result = fixGeoJson(collection, { validation })
      expect(result.corrections).toHaveLength(1)
      expect(result.corrections[0].path).toBe('/features/1/geometry')
      expect(result.corrections[0].code).toBe(VALIDATION_CODES.INVALID_WINDING_ORDER)
    })
  })

  describe('unfixed issues', () => {
    it('should report issues it cannot fix, like an invalid bbox', () => {
      const geometry = structuredClone(geometries.withInvalidBBox)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.unfixed.some(i => i.path?.match(/bbox/))).toBe(true)
    })
    it('should still fix what it can while reporting the rest as unfixed', () => {
      const geometry = { ...structuredClone(polygons.cwOuter), bbox: [200, -200, 210, -190] }
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(true)
      expect(result.unfixed.length).toBeGreaterThan(0)
    })
  })

  describe('windingOrder / selfIntersection options', () => {
    it('should respect windingOrder: false and report it as unfixed', () => {
      const geometry = structuredClone(polygons.cwOuter)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation, windingOrder: false })
      expect(result.corrections).toHaveLength(0)
      expect(result.unfixed.some(i => i.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(true)
    })
    it('should respect selfIntersection: false and report it as unfixed', () => {
      const geometry = structuredClone(polygons.selfIntersecting)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation, selfIntersection: false })
      expect(result.corrections).toHaveLength(0)
      expect(result.unfixed.some(i => i.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })
  })

  describe('precision option', () => {
    it('should accept a custom precision for self-intersection fixing', () => {
      const geometry = structuredClone(polygons.selfIntersecting)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation, precision: 1e-7 })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })
  })
})
