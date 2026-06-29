import { describe, it, expect } from 'vitest'
import { simplify } from '../../../src/operators/index.js'
import {
  LINESTRING,
  POLYGON,
  POLYGON_WITH_HOLE,
  MULTI_LINESTRING,
  MULTI_POLYGON,
  POINT,
  MULTI_POINT,
  GEOMETRY_COLLECTION,
  FEATURE,
  FEATURE_NULL_GEOMETRY,
  FEATURE_COLLECTION,
  FEATURE_COLLECTION_EMPTY
} from './data/fixtures.js'

describe('simplify', () => {
  // --- Validation ---

  it('throws if input is null', () => {
    expect(() => simplify(null)).toThrow()
  })

  it('throws if input is not a GeoJson object', () => {
    expect(() => simplify({ type: 'Invalid' })).toThrow()
  })

  // --- LineString ---

  it('reduces the number of points in a LineString', () => {
    const geometry = structuredClone(LINESTRING)
    simplify(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
  })

  it('always preserves the first and last point of a LineString', () => {
    const geometry = structuredClone(LINESTRING)
    simplify(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates[0]).toEqual(LINESTRING.coordinates[0])
    expect(geometry.coordinates[geometry.coordinates.length - 1]).toEqual(LINESTRING.coordinates[LINESTRING.coordinates.length - 1])
  })

  it('does not simplify a LineString with tolerance = 0', () => {
    const geometry = structuredClone(LINESTRING)
    simplify(geometry, { tolerance: 0 })
    expect(geometry.coordinates).toEqual(LINESTRING.coordinates)
  })

  // --- Polygon ---

  it('reduces the number of points in each ring of a Polygon', () => {
    const geometry = structuredClone(POLYGON)
    simplify(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(POLYGON.coordinates[i].length)
    })
  })

  it('simplifies both the exterior ring and the hole of a Polygon', () => {
    const geometry = structuredClone(POLYGON_WITH_HOLE)
    simplify(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toHaveLength(2)
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(POLYGON_WITH_HOLE.coordinates[i].length)
    })
  })

  // --- MultiLineString ---

  it('reduces the number of points in each line of a MultiLineString', () => {
    const geometry = structuredClone(MULTI_LINESTRING)
    simplify(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((line, i) => {
      expect(line.length).toBeLessThanOrEqual(MULTI_LINESTRING.coordinates[i].length)
    })
  })

  // --- MultiPolygon ---

  it('reduces the number of points in each ring of each polygon of a MultiPolygon', () => {
    const geometry = structuredClone(MULTI_POLYGON)
    simplify(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((poly, i) => {
      poly.forEach((ring, j) => {
        expect(ring.length).toBeLessThanOrEqual(MULTI_POLYGON.coordinates[i][j].length)
      })
    })
  })

  // --- GeometryCollection ---

  it('simplifies each geometry in a GeometryCollection', () => {
    const geometry = structuredClone(GEOMETRY_COLLECTION)
    simplify(geometry, { tolerance: 1e-7 })
    geometry.geometries.forEach((g, i) => {
      const original = GEOMETRY_COLLECTION.geometries[i]
      if (g.coordinates) {
        expect(g.coordinates.flat(Infinity).length).toBeLessThanOrEqual(original.coordinates.flat(Infinity).length)
      }
    })
  })

  // --- Point / MultiPoint ---

  it('does not alter a Point', () => {
    const geometry = structuredClone(POINT)
    simplify(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(POINT.coordinates)
  })

  it('does not alter a MultiPoint', () => {
    const geometry = structuredClone(MULTI_POINT)
    simplify(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(MULTI_POINT.coordinates)
  })

  // --- Feature ---

  it('simplifies the geometry of a Feature', () => {
    const feature = structuredClone(FEATURE)
    simplify(feature, { tolerance: 1e-7 })
    expect(feature.geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
  })

  it('does not throw for a Feature with null geometry', () => {
    const feature = structuredClone(FEATURE_NULL_GEOMETRY)
    expect(() => simplify(feature, { tolerance: 1e-7 })).not.toThrow()
  })

  it('does not alter feature properties', () => {
    const feature = structuredClone(FEATURE)
    simplify(feature, { tolerance: 1e-7 })
    expect(feature.properties).toEqual(FEATURE.properties)
  })

  // --- FeatureCollection ---

  it('simplifies each feature geometry in a FeatureCollection', () => {
    const fc = structuredClone(FEATURE_COLLECTION)
    simplify(fc, { tolerance: 1e-7 })
    fc.features
      .filter(f => f.geometry?.type === 'LineString')
      .forEach(f => {
        expect(f.geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
      })
  })

  it('does not throw for a Feature with null geometry inside a FeatureCollection', () => {
    const fc = structuredClone(FEATURE_COLLECTION)
    expect(() => simplify(fc, { tolerance: 1e-7 })).not.toThrow()
  })

  it('handles an empty FeatureCollection without throwing', () => {
    expect(() => simplify(structuredClone(FEATURE_COLLECTION_EMPTY), { tolerance: 1e-7 })).not.toThrow()
  })

  it('throws for an unknown feature type inside a FeatureCollection', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [{ type: 'Unknown', geometry: null, properties: {} }]
    }
    expect(() => simplify(fc, { tolerance: 1e-7 })).toThrow()
  })

  // --- Return value ---

  it('mutates in place and returns the same object for a geometry', () => {
    const geometry = structuredClone(LINESTRING)
    expect(simplify(geometry, { tolerance: 1e-7 })).toBe(geometry)
  })

  it('mutates in place and returns the same Feature object', () => {
    const feature = structuredClone(FEATURE)
    expect(simplify(feature, { tolerance: 1e-7 })).toBe(feature)
  })

  it('mutates in place and returns the same FeatureCollection object', () => {
    const fc = structuredClone(FEATURE_COLLECTION)
    expect(simplify(fc, { tolerance: 1e-7 })).toBe(fc)
  })
})
