import { describe, it, expect } from 'vitest'
import { computeGeoJsonBoundingBox } from '../../../../src/operators/index.js'
import {
  polygonFrance,
  featurePolygonFrance,
  featureMultiPolygon,
  featureNoGeometry,
  featureLineString3D,
  fcEuropeanCities,
  fcMixedGeometries,
  fcEmpty,
  fc3DAlpineRoute,
  fcWithNullGeometry
} from '../fixtures.js'

describe('computeGeoJsonBoundingBox', () => {
  it('computes bbox of a Geometry directly', () => {
    expect(computeGeoJsonBoundingBox(polygonFrance)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Feature with a Polygon', () => {
    expect(computeGeoJsonBoundingBox(featurePolygonFrance)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Feature with a MultiPolygon', () => {
    expect(computeGeoJsonBoundingBox(featureMultiPolygon)).toEqual([-4.795, 43.766, 18.756, 51.089])
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeGeoJsonBoundingBox(featureNoGeometry)).toBeNull()
  })

  it('computes 3D bbox of a Feature with a 3D LineString', () => {
    expect(computeGeoJsonBoundingBox(featureLineString3D)).toEqual([6.865, 45.074, 250, 7.742, 45.923, 1224])
  })

  it('ignores altitude on a Feature when ignore3D is true', () => {
    expect(computeGeoJsonBoundingBox(featureLineString3D, { ignore3D: true })).toEqual([6.865, 45.074, 7.742, 45.923])
  })

  it('computes bbox of a FeatureCollection of points', () => {
    expect(computeGeoJsonBoundingBox(fcEuropeanCities)).toEqual([-3.704, 40.416, 28.979, 59.330])
  })

  it('returns null for an empty FeatureCollection', () => {
    expect(computeGeoJsonBoundingBox(fcEmpty)).toBeNull()
  })

  it('computes 3D bbox of a FeatureCollection with 3D geometries', () => {
    expect(computeGeoJsonBoundingBox(fc3DAlpineRoute)).toEqual([0, 0, 100, 10, 10, 500])
  })

  it('ignores altitude on a FeatureCollection when ignore3D is true', () => {
    expect(computeGeoJsonBoundingBox(fc3DAlpineRoute, { ignore3D: true })).toEqual([0, 0, 10, 10])
  })

  it('computes bbox of a FeatureCollection with mixed geometry types', () => {
    expect(computeGeoJsonBoundingBox(fcMixedGeometries)).toEqual([-4.795, 39.470, 37.617, 55.755])
  })

  it('computes bbox of a FeatureCollection ignoring features with no geometry', () => {
    expect(computeGeoJsonBoundingBox(fcWithNullGeometry)).toEqual([2.349, 41.902, 12.496, 48.864])
  })

  it('throws if geoJson is invalid', () => {
    expect(() => computeGeoJsonBoundingBox(null)).toThrow()
    expect(() => computeGeoJsonBoundingBox({ type: 'Invalid' })).toThrow()
    expect(() => computeGeoJsonBoundingBox('not geojson')).toThrow()
  })

  it('throws if options is invalid', () => {
    expect(() => computeGeoJsonBoundingBox(polygonFrance, { ignore3D: 'yes' })).toThrow()
  })
})
