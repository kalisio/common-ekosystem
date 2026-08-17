import { describe, it, expect } from 'vitest'
import { isGeoJsonFixable, fixGeoJson, validateGeoJson } from '../../src/operators'
import { VALIDATION_CODES } from '../../src/operators/validate/codes.js'
import { lineStrings } from './data/linestring.fixtures.js'
import { polygons } from './data/polygon.fixtures.js'
import { geometries } from './data/geometry.fixtures.js'
import { features } from './data/feature.fixtures.js'

describe('isGeoJsonFixable', () => {
  it('returns false when there are no errors', () => {
    expect(isGeoJsonFixable({ errors: [] })).toBe(false)
  })
  it('returns true when all errors are fixable', () => {
    expect(isGeoJsonFixable({
      errors: [
        { code: VALIDATION_CODES.INVALID_WINDING_ORDER },
        { code: VALIDATION_CODES.HOLE_INTERSECTS_SHELL }
      ]
    })).toBe(true)
  })
  it('returns false when at least one error is not fixable', () => {
    expect(isGeoJsonFixable({
      errors: [
        { code: VALIDATION_CODES.INVALID_WINDING_ORDER },
        { code: VALIDATION_CODES.INVALID_POSITION_COORDINATES }
      ]
    })).toBe(false)
  })
  it('returns false when no error is fixable', () => {
    expect(isGeoJsonFixable({
      errors: [
        { code: VALIDATION_CODES.INVALID_POSITION_LENGTH },
        { code: VALIDATION_CODES.UNSUPPORTED_CRS }
      ]
    })).toBe(false)
  })
  it('ignores warnings', () => {
    expect(isGeoJsonFixable({
      errors: [
        { code: VALIDATION_CODES.INVALID_WINDING_ORDER }
      ],
      warnings: [
        { code: VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING }
      ]
    })).toBe(true)
  })
  it('throws when validation is not a non-empty object', () => {
    expect(() => isGeoJsonFixable()).toThrow()
    expect(() => isGeoJsonFixable(null)).toThrow()
    expect(() => isGeoJsonFixable({})).toThrow()
  })
  it('throws when validation.errors is not an array', () => {
    expect(() => isGeoJsonFixable({
      errors: 'INVALID_WINDING_ORDER'
    })).toThrow()
  })
  it('works with a validateGeoJson result', () => {
    const validation = validateGeoJson(polygons.holeIntersectsShell)
    expect(validation.valid).toBe(false)
    expect(isGeoJsonFixable(validation)).toBe(true)
  })
})

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

    it('removes the duplicate on a Polygon and reports no phantom self-intersection', () => {
      const geometry = structuredClone(polygons.withDuplicate)
      const validation = validateGeoJson(geometry)
      // A duplicate vertex is a DUPLICATE_POSITION only -- it must not surface as
      // a self-intersection (that was a floating-point false positive at the
      // shared vertex, now guarded in ringSelfIntersections).
      expect(validation.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(false)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(false)
      expect(result.unfixed).toHaveLength(0)
      // The dedupe leaves a clean octagon.
      expect(geometry.coordinates[0]).toHaveLength(polygons.withDuplicate.coordinates[0].length - 1)
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

  describe('round-trip: validate -> fix -> validate', () => {
    it('resolves the winding so validate no longer flags it', () => {
      const geometry = structuredClone(polygons.cwOuter)
      const result = fixGeoJson(geometry, { validation: validateGeoJson(geometry) })
      const revalidated = validateGeoJson(result.fixed)
      expect(revalidated.errors.some(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(false)
    })

    it('resolves the self-intersection so validate no longer flags it', () => {
      const geometry = structuredClone(polygons.selfIntersecting)
      const result = fixGeoJson(geometry, { validation: validateGeoJson(geometry) })
      const revalidated = validateGeoJson(result.fixed)
      expect(revalidated.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(false)
    })

    it('yields a fully valid geometry after fixing a self-intersection', () => {
      // buffer(0) normalizes winding on output, so the round-trip is clean.
      const geometry = structuredClone(polygons.selfIntersecting)
      const result = fixGeoJson(geometry, { validation: validateGeoJson(geometry) })
      expect(validateGeoJson(result.fixed).valid).toBe(true)
    })
  })

  describe('precision drives deduplication, in lockstep with validate', () => {
    // Two mid positions equal at precision 3, distinct at the default precision.
    const near = () => ({ type: 'LineString', coordinates: [[0, 0], [1, 0.0001], [1, 0.0002], [2, 0]] })

    it('collapses them when fix runs at the same coarse precision validate used', () => {
      const geometry = near()
      const validation = validateGeoJson(geometry, { precision: 3 })
      const result = fixGeoJson(geometry, { validation, precision: 3 })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
      expect(geometry.coordinates).toHaveLength(3)
    })

    it('keeps them at the default precision', () => {
      const geometry = near()
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(false)
      expect(geometry.coordinates).toHaveLength(4)
    })
  })

  describe('hole intersecting shell', () => {
    it('repairs a hole that straddles the shell via the buffer rebuild', () => {
      const geometry = structuredClone(polygons.holeIntersectsShell)
      const validation = validateGeoJson(geometry)
      // Precondition: validate flags exactly this, and nothing winding-related.
      expect(validation.errors.some(e => e.code === VALIDATION_CODES.HOLE_INTERSECTS_SHELL)).toBe(true)
      expect(validation.errors.some(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER)).toBe(false)
      const result = fixGeoJson(geometry, { validation })
      expect(result.corrections.some(c => c.code === VALIDATION_CODES.HOLE_INTERSECTS_SHELL)).toBe(true)
    })

    it('yields a geometry validate no longer flags for hole/shell overlap (round-trip)', () => {
      const geometry = structuredClone(polygons.holeIntersectsShell)
      const result = fixGeoJson(geometry, { validation: validateGeoJson(geometry) })
      const revalidated = validateGeoJson(result.fixed)
      expect(revalidated.errors.some(e => e.code === VALIDATION_CODES.HOLE_INTERSECTS_SHELL)).toBe(false)
    })

    it('respects holeIntersectsShell: false and reports it as unfixed', () => {
      const geometry = structuredClone(polygons.holeIntersectsShell)
      const validation = validateGeoJson(geometry)
      const result = fixGeoJson(geometry, { validation, holeIntersectsShell: false })
      expect(result.corrections).toHaveLength(0)
      expect(result.unfixed.some(i => i.code === VALIDATION_CODES.HOLE_INTERSECTS_SHELL)).toBe(true)
    })
  })
})
