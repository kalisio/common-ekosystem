// geojson.test.js
import { describe, it, expect } from 'vitest'
import { simplifyGeoJson } from '../../../src/operators'
import {
  LINESTRING,
  POLYGON,
  POINT,
  FEATURE,
  FEATURE_NULL_GEOMETRY,
  FEATURE_COLLECTION,
  FEATURE_COLLECTION_EMPTY,
  GEOMETRY_COLLECTION
} from './data/fixtures.js'

describe('simplifyGeoJson', () => {
  // --- Validation ---

  it('throws if input is null', () => {
    expect(() => simplifyGeoJson(null)).toThrow()
  })

  it('throws if input is not a GeoJson object', () => {
    expect(() => simplifyGeoJson({ type: 'Invalid' })).toThrow()
  })

  // --- Bare geometry passthrough ---

  it('simplifies a bare LineString', () => {
    const geometry = structuredClone(LINESTRING)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
  })

  it('simplifies a bare Polygon', () => {
    const geometry = structuredClone(POLYGON)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(POLYGON.coordinates[i].length)
    })
  })

  it('does not alter a bare Point', () => {
    const geometry = structuredClone(POINT)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(POINT.coordinates)
  })

  it('simplifies a bare GeometryCollection', () => {
    const geometry = structuredClone(GEOMETRY_COLLECTION)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    const flatResult = geometry.geometries[0].coordinates.flat(Infinity).length
    const flatOriginal = GEOMETRY_COLLECTION.geometries[0].coordinates.flat(Infinity).length
    expect(flatResult).toBeLessThanOrEqual(flatOriginal)
  })

  // --- Feature ---

  it('simplifies the geometry of a Feature', () => {
    const feature = structuredClone(FEATURE)
    simplifyGeoJson(feature, { tolerance: 1e-7 })
    expect(feature.geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
  })

  it('does not throw for a Feature with null geometry', () => {
    const feature = structuredClone(FEATURE_NULL_GEOMETRY)
    expect(() => simplifyGeoJson(feature, { tolerance: 1e-7 })).not.toThrow()
  })

  it('does not alter feature properties', () => {
    const feature = structuredClone(FEATURE)
    simplifyGeoJson(feature, { tolerance: 1e-7 })
    expect(feature.properties).toEqual(FEATURE.properties)
  })

  // --- FeatureCollection ---

  it('simplifies each feature geometry in a FeatureCollection', () => {
    const fc = structuredClone(FEATURE_COLLECTION)
    simplifyGeoJson(fc, { tolerance: 1e-7 })
    fc.features
      .filter(f => f.geometry?.type === 'LineString')
      .forEach(f => {
        expect(f.geometry.coordinates.length).toBeLessThan(LINESTRING.coordinates.length)
      })
  })

  it('does not throw for a Feature with null geometry inside a FeatureCollection', () => {
    const fc = structuredClone(FEATURE_COLLECTION)
    expect(() => simplifyGeoJson(fc, { tolerance: 1e-7 })).not.toThrow()
  })

  it('handles an empty FeatureCollection without throwing', () => {
    expect(() => simplifyGeoJson(structuredClone(FEATURE_COLLECTION_EMPTY), { tolerance: 1e-7 })).not.toThrow()
  })

  // --- Unknown feature type ---

  it('does not throw for an unknown feature type inside a FeatureCollection', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [{ type: 'Unknown', geometry: null, properties: {} }]
    }
    expect(() => simplifyGeoJson(fc, { tolerance: 1e-7 })).not.toThrow()
  })

  // --- Return value ---

  it('mutates in place and returns the same Feature object', () => {
    const feature = structuredClone(FEATURE)
    expect(simplifyGeoJson(feature, { tolerance: 1e-7 })).toBe(feature)
  })

  it('mutates in place and returns the same FeatureCollection object', () => {
    const fc = structuredClone(FEATURE_COLLECTION)
    expect(simplifyGeoJson(fc, { tolerance: 1e-7 })).toBe(fc)
  })
})
