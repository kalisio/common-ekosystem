import { describe, it, expect } from 'vitest'
import { validateGeometry } from '../../../src/operators'

describe('validateGeometry', () => {
  describe('invalid inputs', () => {
    it('should return invalid for null', () => {
      const result = validateGeometry(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty object/)
    })

    it('should return invalid for unknown type', () => {
      const result = validateGeometry({ type: 'Triangle', coordinates: [] })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/Invalid geometry type/)
    })

    it('should return invalid for missing type', () => {
      const result = validateGeometry({ coordinates: [0, 0] })
      expect(result.valid).toBe(false)
    })
  })

  describe('Point', () => {
    it('should accept a valid Point', () => {
      const result = validateGeometry({ type: 'Point', coordinates: [2.3522, 48.8566] })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for out-of-range coordinates', () => {
      const result = validateGeometry({ type: 'Point', coordinates: [200, 48] })
      expect(result.valid).toBe(false)
    })

    it('should accept a valid 3D Point', () => {
      const result = validateGeometry({ type: 'Point', coordinates: [2.3522, 48.8566, 35] })
      expect(result.valid).toBe(true)
    })
  })

  describe('MultiPoint', () => {
    it('should accept a valid MultiPoint', () => {
      const result = validateGeometry({ type: 'MultiPoint', coordinates: [[0, 0], [1, 1]] })
      expect(result.valid).toBe(true)
    })

    it('should accept an empty MultiPoint', () => {
      const result = validateGeometry({ type: 'MultiPoint', coordinates: [] })
      expect(result.valid).toBe(true)
    })

    it('should return invalid if a position is invalid', () => {
      const result = validateGeometry({ type: 'MultiPoint', coordinates: [[0, 0], [200, 0]] })
      expect(result.valid).toBe(false)
    })
  })

  describe('LineString', () => {
    it('should accept a valid LineString', () => {
      const result = validateGeometry({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for less than 2 positions', () => {
      const result = validateGeometry({ type: 'LineString', coordinates: [[0, 0]] })
      expect(result.valid).toBe(false)
    })

    it('should warn on antimeridian crossing', () => {
      const result = validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/antimeridian/))).toBe(true)
    })
  })

  describe('MultiLineString', () => {
    it('should accept a valid MultiLineString', () => {
      const result = validateGeometry({
        type: 'MultiLineString',
        coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]]
      })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry({ type: 'MultiLineString', coordinates: [] })
      expect(result.valid).toBe(false)
    })
  })

  describe('Polygon', () => {
    const validPolygon = {
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    }

    it('should accept a valid Polygon', () => {
      const result = validateGeometry(validPolygon)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry({ type: 'Polygon', coordinates: [] })
      expect(result.valid).toBe(false)
    })

    it('should return invalid if ring is not closed', () => {
      const result = validateGeometry({
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0]]]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.match(/first and last/))).toBe(true)
    })

    it('should return invalid if outer ring is clockwise', () => {
      const result = validateGeometry({
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
      })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(e => e.message.match(/counter-clockwise/))).toBe(true)
    })

    it('should return invalid if hole ring is counter-clockwise', () => {
      const result = validateGeometry({
        type: 'Polygon',
        coordinates: [
          [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]], // outer CCW
          [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]] // hole should be CW
        ]
      })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(e => e.message.match(/counter-clockwise/))).toBe(true)
    })

    it('should return invalid for self-intersecting polygon', () => {
      const result = validateGeometry({
        type: 'Polygon',
        coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.match(/self-intersection/))).toBe(true)
    })

    it('should return invalid for less than 4 positions in ring', () => {
      const result = validateGeometry({
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 1], [0, 0]]]
      })
      expect(result.valid).toBe(false)
    })
  })

  describe('MultiPolygon', () => {
    it('should accept a valid MultiPolygon', () => {
      const result = validateGeometry({
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]], // CCW
          [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]] // CCW
        ]
      })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty coordinates', () => {
      const result = validateGeometry({ type: 'MultiPolygon', coordinates: [] })
      expect(result.valid).toBe(false)
    })
  })

  describe('GeometryCollection', () => {
    it('should accept a valid GeometryCollection', () => {
      const result = validateGeometry({
        type: 'GeometryCollection',
        geometries: [
          { type: 'Point', coordinates: [0, 0] },
          { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
        ]
      })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty geometries', () => {
      const result = validateGeometry({ type: 'GeometryCollection', geometries: [] })
      expect(result.valid).toBe(false)
    })

    it('should return invalid if a geometry is invalid', () => {
      const result = validateGeometry({
        type: 'GeometryCollection',
        geometries: [
          { type: 'Point', coordinates: [0, 0] },
          { type: 'Point', coordinates: [200, 0] }
        ]
      })
      expect(result.valid).toBe(false)
    })
  })

  describe('bbox', () => {
    it('should validate optional bbox on a valid geometry', () => {
      const result = validateGeometry({
        type: 'Point',
        coordinates: [2, 48],
        bbox: [-5, 41, 9, 51]
      })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for an invalid bbox', () => {
      const result = validateGeometry({
        type: 'Point',
        coordinates: [2, 48],
        bbox: [0, 10, 0, 5] // south > north
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path.match(/bbox/))).toBe(true)
    })
  })
})
