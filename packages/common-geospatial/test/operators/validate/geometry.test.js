import { describe, it, expect } from 'vitest'
import { validateGeometry } from '../../../src/operators/validate/geometry.js'
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
    it('should warn on duplicate consecutive positions without flagging a phantom self-intersection', () => {
      const result = validateGeometry(polygons.withDuplicate)
      // A duplicate vertex is a warning only. The zero-length edge it creates
      // must not be misread as a self-intersection: that was a floating-point
      // false positive at the shared vertex, now guarded in
      // ringSelfIntersections.
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.DUPLICATE_POSITION)).toBe(true)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(false)
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
    it('should be invalid if outer ring is clockwise', () => {
      const result = validateGeometry(polygons.cwOuter)
      expect(result.valid).toBe(false)
      const error = result.errors.find(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER && e.path?.endsWith('/0'))
      expect(error).toBeDefined()
      expect(error.params).toEqual({ expected: 'counter-clockwise', actual: 'clockwise' })
    })
    it('should be invalid if hole ring is counter-clockwise', () => {
      const result = validateGeometry(polygons.ccwHole)
      expect(result.valid).toBe(false)
      const error = result.errors.find(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER && e.path?.endsWith('/1'))
      expect(error).toBeDefined()
      expect(error.params).toEqual({ expected: 'clockwise', actual: 'counter-clockwise' })
      expect(result.errors.some(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER && e.path?.endsWith('/0'))).toBe(false)
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

  describe('precision', () => {
    // The default warning threshold is DEFAULT_COORDINATE_PRECISION (7 decimals).
    it('should not warn at the default precision (7 decimals)', () => {
      const geometry = { type: 'Point', coordinates: [2.3522123, 48.8566123] }
      const result = validateGeometry(geometry)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
    it('should warn beyond the default precision (8 decimals)', () => {
      const geometry = { type: 'Point', coordinates: [2.35221234, 48.8566] }
      const result = validateGeometry(geometry)
      const warning = result.warnings.find((w) => w.code === VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION)
      expect(warning).toBeDefined()
      expect(warning.params).toEqual({ precision: 8, max: 7 })
    })
    it('should respect a custom precision threshold', () => {
      const geometry = { type: 'Point', coordinates: [2.3522123, 48.8566] } // 7 decimals
      const result = validateGeometry(geometry, '', { precision: 6 })
      const warning = result.warnings.find((w) => w.code === VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION)
      expect(warning).toBeDefined()
      expect(warning.params).toEqual({ precision: 7, max: 6 })
    })
    it('should propagate precision down to polygon rings', () => {
      // 7-decimal coords with threshold 6 must reach validatePosition through
      // validatePolygonCoordinates -> validateLinearRing -> validateCoordinatesArray
      const polygon = {
        type: 'Polygon',
        coordinates: [[
          [2.3522123, 48.8566],
          [3, 48.8566],
          [3, 49],
          [2.3522123, 48.8566]
        ]]
      }
      const result = validateGeometry(polygon, '', { precision: 6 })
      const precisionWarnings = result.warnings.filter((w) => w.code === VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION)
      expect(precisionWarnings.length).toBeGreaterThan(0)
      expect(precisionWarnings.every((w) => w.params.max === 6)).toBe(true)
    })
  })
})
