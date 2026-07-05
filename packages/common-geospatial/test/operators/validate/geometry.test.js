import { describe, it, expect } from 'vitest'
import { validateGeometry } from '../../../src/operators'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { geometries } from '../data/geometry.fixtures.js'
import { points } from '../data/point.fixtures.js'
import { multiPoints } from '../data/multi-point.fixtures.js'
import { lineStrings } from '../data/linestring.fixtures.js'
import { multiLineStrings } from '../data/multi-linestring.fixtures.js'
import { polygons } from '../data/polygon.fixtures.js'
import { multiPolygons } from '../data/multi-polygon.fixtures.js'
import { geometryCollections } from '../data/geometry-collection.fixtures.js'

describe('validateGeometry', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateGeometry(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_GEOMETRY)
    })
    it('should return invalid for a string', () => {
      const result = validateGeometry('Point')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_GEOMETRY)
    })
    it('should return invalid for an array', () => {
      const result = validateGeometry([])
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_GEOMETRY)
    })
    it('should return invalid for missing type', () => {
      const result = validateGeometry(geometries.missingType)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_GEOMETRY_TYPE)
    })
    it('should return invalid for unknown type', () => {
      const result = validateGeometry(geometries.unknownType)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_GEOMETRY_TYPE)
      expect(result.errors[0].params.type).toBe('Triangle')
    })
    it('should return invalid for missing coordinates', () => {
      const result = validateGeometry(points.missingCoordinates)
      expect(result.valid).toBe(false)
    })
    it('should return invalid for non-array coordinates', () => {
      const result = validateGeometry(points.nonArrayCoordinates)
      expect(result.valid).toBe(false)
    })
  })

  describe('Point', () => {
    it('should accept a valid 2D Point', () => {
      const result = validateGeometry(points.valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept a valid 3D Point', () => {
      const result = validateGeometry(points.valid3D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should return invalid for out-of-range longitude', () => {
      const result = validateGeometry(points.invalidLon)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
    })
    it('should include the coordinates path in the error', () => {
      const result = validateGeometry(points.invalidLon)
      expect(result.errors[0].path).toMatch(/coordinates/)
    })
  })

  describe('MultiPoint', () => {
    it('should accept a valid MultiPoint', () => {
      const result = validateGeometry(multiPoints.valid)
      expect(result.valid).toBe(true)
    })
    it('should accept an empty MultiPoint', () => {
      const result = validateGeometry(multiPoints.empty)
      expect(result.valid).toBe(true)
    })
    it('should return invalid if a position is out of range', () => {
      const result = validateGeometry(multiPoints.invalid)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
    })
    it('should include the index of the invalid position in the error', () => {
      const result = validateGeometry(multiPoints.invalid)
      expect(result.errors.some(e => e.index === 1)).toBe(true)
    })
  })

  describe('LineString', () => {
    it('should accept a valid LineString', () => {
      const result = validateGeometry(lineStrings.valid)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for fewer than 2 positions', () => {
      const result = validateGeometry(lineStrings.tooShort)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_COORDINATES_LENGTH)
    })
    it('should warn on duplicate consecutive positions', () => {
      const result = validateGeometry(lineStrings.withDuplicate)
      expect(result.valid).toBe(true)
      const warning = result.warnings.find(w => w.code === VALIDATION_CODES.DUPLICATE_POSITION)
      expect(warning).toBeDefined()
    })
    it('should warn on antimeridian crossing', () => {
      const result = validateGeometry(lineStrings.antimeridian)
      expect(result.valid).toBe(true)
      const warning = result.warnings.find(w => w.code === VALIDATION_CODES.ANTIMERIDIAN_CROSSING)
      expect(warning).toBeDefined()
    })
  })

  describe('MultiLineString', () => {
    it('should accept a valid MultiLineString', () => {
      const result = validateGeometry(multiLineStrings.valid)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry(multiLineStrings.empty)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_MULTI_LINESTRING_COORDINATES)
    })
  })

  describe('Polygon', () => {
    it('should accept a valid Polygon (outer ring CCW)', () => {
      const result = validateGeometry(polygons.valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry(polygons.empty)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_POLYGON_COORDINATES)
    })
    it('should warn on duplicate consecutive positions, and also flag a self-intersection (a zero-length edge looks like a kink)', () => {
      const result = validateGeometry(polygons.withDuplicate)
      expect(result.valid).toBe(false) // SELF_INTERSECTION is an error, not just a warning
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })
    it('should return invalid if ring is not closed', () => {
      const result = validateGeometry(polygons.unclosed)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.RING_NOT_CLOSED)).toBe(true)
    })
    it('should return invalid for fewer than 4 positions in ring', () => {
      const result = validateGeometry(polygons.tooFewPositions)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_COORDINATES_LENGTH)
    })
    it('should warn if outer ring is clockwise', () => {
      const result = validateGeometry(polygons.cwOuter)
      expect(result.valid).toBe(true)
      // Identify the warning by ring path (index 0 = outer), not just by code,
      // so a coincidental warning on another ring can't false-positive this test.
      const warning = result.warnings.find(w => w.code === VALIDATION_CODES.INVALID_WINDING_ORDER && w.path?.endsWith('/0'))
      expect(warning).toBeDefined()
      expect(warning.params).toEqual({ expected: 'counter-clockwise', actual: 'clockwise' })
    })
    it('should warn if hole ring is counter-clockwise', () => {
      const result = validateGeometry(polygons.ccwHole)
      expect(result.valid).toBe(true)
      // Identify the warning by ring path (index 1 = first hole), not just by code.
      const warning = result.warnings.find(w => w.code === VALIDATION_CODES.INVALID_WINDING_ORDER && w.path?.endsWith('/1'))
      expect(warning).toBeDefined()
      expect(warning.params).toEqual({ expected: 'clockwise', actual: 'counter-clockwise' })
      // The outer ring itself should be correctly CCW here — no warning on ring 0.
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.INVALID_WINDING_ORDER && w.path?.endsWith('/0'))).toBe(false)
    })
    it('should return invalid for self-intersecting polygon', () => {
      const result = validateGeometry(polygons.selfIntersecting)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })
  })

  describe('MultiPolygon', () => {
    it('should accept a valid MultiPolygon', () => {
      const result = validateGeometry(multiPolygons.valid)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry(multiPolygons.empty)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_MULTIPOLYGON_COORDINATES)
    })
    it('should return invalid if a polygon in the collection is invalid', () => {
      const result = validateGeometry({
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          [[[0, 0], [0, 1], [1, 1], [1, 0]]] // unclosed
        ]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.RING_NOT_CLOSED)).toBe(true)
    })
  })

  describe('GeometryCollection', () => {
    it('should accept a valid GeometryCollection', () => {
      const result = validateGeometry(geometryCollections.valid)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for empty geometries array', () => {
      const result = validateGeometry(geometryCollections.empty)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_GEOMETRYCOLLECTION_GEOMETRIES)
    })
    it('should return invalid if a child geometry is invalid', () => {
      const result = validateGeometry(geometryCollections.invalid)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
    })
    it('should include the index of the invalid geometry in the error', () => {
      const result = validateGeometry(geometryCollections.invalid)
      expect(result.errors.some(e => e.index === 1)).toBe(true)
    })
    it('should return invalid if a child geometry is null', () => {
      const result = validateGeometry(geometryCollections.nullGeometry)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.INVALID_GEOMETRY)).toBe(true)
    })
  })

  describe('bbox', () => {
    it('should accept a geometry with a valid bbox', () => {
      const result = validateGeometry(geometries.withValidBBox)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for a geometry with an invalid bbox', () => {
      const result = validateGeometry(geometries.withInvalidBBox)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path?.match(/bbox/))).toBe(true)
    })
    it('should forward antimeridian warning from bbox', () => {
      const result = validateGeometry(geometries.withAntimeridianBBox)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING)).toBe(true)
    })
  })
})
