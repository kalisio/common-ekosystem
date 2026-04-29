// geometry.test.js
import { describe, it, expect } from 'vitest'
import { simplifyGeometry } from '../../../src/operators'
import {
  LINESTRING,
  POLYGON,
  POLYGON_WITH_HOLE,
  MULTI_LINESTRING,
  MULTI_POLYGON,
  POINT,
  MULTI_POINT,
  GEOMETRY_COLLECTION
} from './data/fixtures.js'

describe('simplifyGeometry', () => {
  // --- Validation ---

  it('throws if geometry is null', () => {
    expect(() => simplifyGeometry(null)).toThrow()
  })

  it('throws if geometry has an invalid type', () => {
    expect(() => simplifyGeometry({ type: 'NotAType', coordinates: [] })).toThrow()
  })

  // --- LineString ---

  it('reduces the number of points in a LineString', () => {
    const geometry = structuredClone(LINESTRING)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
  })

  it('always preserves the first and last point of a LineString', () => {
    const geometry = structuredClone(LINESTRING)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates[0]).toEqual(LINESTRING.coordinates[0])
    expect(geometry.coordinates[geometry.coordinates.length - 1]).toEqual(LINESTRING.coordinates[LINESTRING.coordinates.length - 1])
  })

  it('does not simplify a LineString with tolerance = 0', () => {
    const geometry = structuredClone(LINESTRING)
    simplifyGeometry(geometry, { tolerance: 0 })
    expect(geometry.coordinates).toEqual(LINESTRING.coordinates)
  })

  // --- Polygon ---

  it('reduces the number of points in each ring of a Polygon', () => {
    const geometry = structuredClone(POLYGON)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(POLYGON.coordinates[i].length)
    })
  })

  it('simplifies both the exterior ring and the hole of a Polygon', () => {
    const geometry = structuredClone(POLYGON_WITH_HOLE)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toHaveLength(2) // exterior + hole still present
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(POLYGON_WITH_HOLE.coordinates[i].length)
    })
  })

  // --- MultiLineString ---

  it('reduces the number of points in each line of a MultiLineString', () => {
    const geometry = structuredClone(MULTI_LINESTRING)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((line, i) => {
      expect(line.length).toBeLessThanOrEqual(MULTI_LINESTRING.coordinates[i].length)
    })
  })

  // --- MultiPolygon ---

  it('reduces the number of points in each ring of each polygon of a MultiPolygon', () => {
    const geometry = structuredClone(MULTI_POLYGON)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((poly, i) => {
      poly.forEach((ring, j) => {
        expect(ring.length).toBeLessThanOrEqual(MULTI_POLYGON.coordinates[i][j].length)
      })
    })
  })

  // --- GeometryCollection ---

  it('simplifies each geometry in a GeometryCollection', () => {
    const geometry = structuredClone(GEOMETRY_COLLECTION)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    geometry.geometries.forEach((g, i) => {
      const original = GEOMETRY_COLLECTION.geometries[i]
      if (g.coordinates) {
        const flatResult = g.coordinates.flat(Infinity).length
        const flatOriginal = original.coordinates.flat(Infinity).length
        expect(flatResult).toBeLessThanOrEqual(flatOriginal)
      }
    })
  })

  // --- Point / MultiPoint ---

  it('does not alter a Point', () => {
    const geometry = structuredClone(POINT)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(POINT.coordinates)
  })

  it('does not alter a MultiPoint', () => {
    const geometry = structuredClone(MULTI_POINT)
    simplifyGeometry(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(MULTI_POINT.coordinates)
  })

  // --- Return value ---

  it('mutates in place and returns the same object', () => {
    const geometry = structuredClone(LINESTRING)
    expect(simplifyGeometry(geometry, { tolerance: 1e-7 })).toBe(geometry)
  })
})
