import { describe, it, expect } from 'vitest'
import { validateGeometry } from '../../../src/operators'
import { geometries } from './data/fixtures.js'

describe('validateGeometry', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateGeometry(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty object/)
    })

    it('should return invalid for a string', () => {
      const result = validateGeometry('Point')
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty object/)
    })

    it('should return invalid for an array', () => {
      const result = validateGeometry([])
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty object/)
    })

    it('should return invalid for missing type', () => {
      const result = validateGeometry(geometries.missingType)
      expect(result.valid).toBe(false)
    })

    it('should return invalid for unknown type', () => {
      const result = validateGeometry(geometries.unknownType)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/Invalid geometry type/)
      expect(result.errors[0].message).toMatch(/Triangle/)
    })

    it('should return invalid for missing coordinates', () => {
      const result = validateGeometry(geometries.missingCoordinates)
      expect(result.valid).toBe(false)
    })

    it('should return invalid for non-array coordinates', () => {
      const result = validateGeometry(geometries.nonArrayCoordinates)
      expect(result.valid).toBe(false)
    })
  })

  describe('Point', () => {
    it('should accept a valid 2D Point', () => {
      const result = validateGeometry(geometries.validPoint)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept a valid 3D Point', () => {
      const result = validateGeometry(geometries.validPoint3D)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for out-of-range longitude', () => {
      const result = validateGeometry(geometries.invalidPointLon)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/longitude/)
    })

    it('should include the coordinates path in the error', () => {
      const result = validateGeometry(geometries.invalidPointLon)
      expect(result.errors[0].path).toMatch(/coordinates/)
    })
  })

  describe('MultiPoint', () => {
    it('should accept a valid MultiPoint', () => {
      const result = validateGeometry(geometries.validMultiPoint)
      expect(result.valid).toBe(true)
    })

    it('should accept an empty MultiPoint', () => {
      const result = validateGeometry(geometries.emptyMultiPoint)
      expect(result.valid).toBe(true)
    })

    it('should return invalid if a position is out of range', () => {
      const result = validateGeometry(geometries.invalidMultiPoint)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/longitude/)
    })

    it('should include the index of the invalid position in the error', () => {
      const result = validateGeometry(geometries.invalidMultiPoint)
      expect(result.errors.some(e => e.index === 1)).toBe(true)
    })
  })

  describe('LineString', () => {
    it('should accept a valid LineString', () => {
      const result = validateGeometry(geometries.validLineString)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for fewer than 2 positions', () => {
      const result = validateGeometry(geometries.tooShortLineString)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/2/)
    })

    it('should warn on antimeridian crossing', () => {
      const result = validateGeometry(geometries.antimeridianLineString)
      expect(result.valid).toBe(true)
      const warning = result.warnings.find(w => w.message.match(/antimeridian/))
      expect(warning).toBeDefined()
      expect(warning.message).toMatch(/0.*1|1.*0/)
    })
  })

  describe('MultiLineString', () => {
    it('should accept a valid MultiLineString', () => {
      const result = validateGeometry(geometries.validMultiLineString)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry(geometries.emptyMultiLineString)
      expect(result.valid).toBe(false)
    })
  })

  describe('Polygon', () => {
    it('should accept a valid Polygon (outer ring CCW)', () => {
      const result = validateGeometry(geometries.validPolygon)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry(geometries.emptyPolygon)
      expect(result.valid).toBe(false)
    })

    it('should return invalid if ring is not closed', () => {
      const result = validateGeometry(geometries.unclosedPolygon)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.match(/first and last/))).toBe(true)
    })

    it('should return invalid for fewer than 4 positions in ring', () => {
      const result = validateGeometry(geometries.tooFewPositionsPolygon)
      expect(result.valid).toBe(false)
    })

    it('should warn if outer ring is clockwise', () => {
      const result = validateGeometry(geometries.cwOuterPolygon)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/counter-clockwise/))).toBe(true)
    })

    it('should warn if hole ring is counter-clockwise', () => {
      const result = validateGeometry(geometries.ccwHolePolygon)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/counter-clockwise/))).toBe(true)
    })

    it('should return invalid for self-intersecting polygon', () => {
      const result = validateGeometry(geometries.selfIntersectingPolygon)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.match(/self-intersection/))).toBe(true)
    })
  })

  describe('MultiPolygon', () => {
    it('should accept a valid MultiPolygon', () => {
      const result = validateGeometry(geometries.validMultiPolygon)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry(geometries.emptyMultiPolygon)
      expect(result.valid).toBe(false)
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
    })
  })

  describe('GeometryCollection', () => {
    it('should accept a valid GeometryCollection', () => {
      const result = validateGeometry(geometries.validGeometryCollection)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty geometries array', () => {
      const result = validateGeometry(geometries.emptyGeometryCollection)
      expect(result.valid).toBe(false)
    })

    it('should return invalid if a child geometry is invalid', () => {
      const result = validateGeometry(geometries.invalidGeometryCollection)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/longitude/)
    })

    it('should include the index of the invalid geometry in the error', () => {
      const result = validateGeometry(geometries.invalidGeometryCollection)
      expect(result.errors.some(e => e.index === 1)).toBe(true)
    })

    it('should return invalid if a child geometry is null', () => {
      const result = validateGeometry(geometries.nullGeometryInCollection)
      expect(result.valid).toBe(false)
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
      expect(result.warnings.some(w => w.message.match(/antimeridian/))).toBe(true)
    })
  })
})
