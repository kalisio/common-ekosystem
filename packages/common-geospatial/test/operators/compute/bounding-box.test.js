import { describe, it, expect } from 'vitest'
import { computeBoundingBox } from '../../../src/operators/index.js'
import {
  pointNYC,
  lineStringCoastline,
  polygonFrance,
  polygonWithHole,
  multiPointScattered,
  multiLineStringRoads,
  multiPolygonCountries,
  geometryCollectionMixed,
  lineString3D,
  polygonWith3DRing,
  featurePolygonFrance,
  featureMultiPolygon,
  featureNoGeometry,
  featureLineString3D,
  fcEuropeanCities,
  fcMixedGeometries,
  fcEmpty,
  fc3DAlpineRoute,
  fcWithNullGeometry
} from './fixtures.js'

describe('computeBoundingBox', () => {
  // Geometries
  it('computes bbox of a Point', () => {
    expect(computeBoundingBox(pointNYC)).toEqual([-73.985, 40.748, -73.985, 40.748])
  })

  it('computes bbox of a LineString', () => {
    expect(computeBoundingBox(lineStringCoastline)).toEqual([-73.985, 40.748, -52.707, 47.561])
  })

  it('computes bbox of a Polygon', () => {
    expect(computeBoundingBox(polygonFrance)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Polygon with a hole', () => {
    expect(computeBoundingBox(polygonWithHole)).toEqual([-10, -10, 10, 10])
  })

  it('computes bbox of a MultiPoint', () => {
    expect(computeBoundingBox(multiPointScattered)).toEqual([-43.172, -22.906, 37.617, 55.755])
  })

  it('computes bbox of a MultiLineString', () => {
    expect(computeBoundingBox(multiLineStringRoads)).toEqual([-3.704, 39.470, 5.369, 48.864])
  })

  it('computes bbox of a MultiPolygon', () => {
    expect(computeBoundingBox(multiPolygonCountries)).toEqual([-4.795, 43.766, 18.756, 51.089])
  })

  it('computes bbox of a GeometryCollection with mixed types', () => {
    expect(computeBoundingBox(geometryCollectionMixed)).toEqual([-118.243, -5, 55.4, 48.864])
  })

  it('computes 3D bbox when positions have altitude', () => {
    expect(computeBoundingBox(lineString3D)).toEqual([6.865, 45.074, 250, 7.742, 45.923, 1224])
  })

  it('computes 3D bbox of a Polygon with altitude', () => {
    expect(computeBoundingBox(polygonWith3DRing)).toEqual([0, 0, 100, 10, 10, 200])
  })

  it('ignores altitude when ignore3D is true', () => {
    expect(computeBoundingBox(lineString3D, { ignore3D: true })).toEqual([6.865, 45.074, 7.742, 45.923])
  })

  // Features
  it('computes bbox of a Feature with a Polygon', () => {
    expect(computeBoundingBox(featurePolygonFrance)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Feature with a MultiPolygon', () => {
    expect(computeBoundingBox(featureMultiPolygon)).toEqual([-4.795, 43.766, 18.756, 51.089])
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeBoundingBox(featureNoGeometry)).toBeNull()
  })

  it('computes 3D bbox of a Feature with a 3D LineString', () => {
    expect(computeBoundingBox(featureLineString3D)).toEqual([6.865, 45.074, 250, 7.742, 45.923, 1224])
  })

  it('ignores altitude on a Feature when ignore3D is true', () => {
    expect(computeBoundingBox(featureLineString3D, { ignore3D: true })).toEqual([6.865, 45.074, 7.742, 45.923])
  })

  // FeatureCollections
  it('computes bbox of a FeatureCollection of points', () => {
    expect(computeBoundingBox(fcEuropeanCities)).toEqual([-3.704, 40.416, 28.979, 59.330])
  })

  it('computes bbox of a FeatureCollection with mixed geometry types', () => {
    expect(computeBoundingBox(fcMixedGeometries)).toEqual([-4.795, 39.470, 37.617, 55.755])
  })

  it('returns null for an empty FeatureCollection', () => {
    expect(computeBoundingBox(fcEmpty)).toBeNull()
  })

  it('computes 3D bbox of a FeatureCollection with 3D geometries', () => {
    expect(computeBoundingBox(fc3DAlpineRoute)).toEqual([0, 0, 100, 10, 10, 500])
  })

  it('ignores altitude on a FeatureCollection when ignore3D is true', () => {
    expect(computeBoundingBox(fc3DAlpineRoute, { ignore3D: true })).toEqual([0, 0, 10, 10])
  })

  it('computes bbox of a FeatureCollection ignoring features with no geometry', () => {
    expect(computeBoundingBox(fcWithNullGeometry)).toEqual([2.349, 41.902, 12.496, 48.864])
  })

  // Errors
  it('throws if geoJson is invalid', () => {
    expect(() => computeBoundingBox(null)).toThrow()
    expect(() => computeBoundingBox({ type: 'Invalid' })).toThrow()
    expect(() => computeBoundingBox('not geojson')).toThrow()
  })

  it('throws if options is invalid', () => {
    expect(() => computeBoundingBox(pointNYC, { ignore3D: 'yes' })).toThrow()
  })
})
