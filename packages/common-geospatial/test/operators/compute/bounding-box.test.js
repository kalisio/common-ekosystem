import { describe, it, expect } from 'vitest'
import { computeGeoJsonBoundingBox } from '../../../src/operators/index.js'
import { points } from '../data/point.fixtures.js'
import { lineStrings } from '../data/linestring.fixtures.js'
import { polygons } from '../data/polygon.fixtures.js'
import { multiPoints } from '../data/multi-point.fixtures.js'
import { multiLineStrings } from '../data/multi-linestring.fixtures.js'
import { multiPolygons } from '../data/multi-polygon.fixtures.js'
import { geometryCollections } from '../data/geometry-collection.fixtures.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('computeGeoJsonBoundingBox', () => {
  // Geometries
  it('computes bbox of a Point', () => {
    expect(computeGeoJsonBoundingBox(points.nyc)).toEqual([-73.985, 40.748, -73.985, 40.748])
  })

  it('computes bbox of a LineString', () => {
    expect(computeGeoJsonBoundingBox(lineStrings.coastline)).toEqual([-73.985, 40.748, -52.707, 47.561])
  })

  it('computes bbox of a Polygon', () => {
    expect(computeGeoJsonBoundingBox(polygons.france)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Polygon with a hole', () => {
    expect(computeGeoJsonBoundingBox(polygons.withHole)).toEqual([-10, -10, 10, 10])
  })

  it('computes bbox of a MultiPoint', () => {
    expect(computeGeoJsonBoundingBox(multiPoints.scattered)).toEqual([-43.172, -22.906, 37.617, 55.755])
  })

  it('computes bbox of a MultiLineString', () => {
    expect(computeGeoJsonBoundingBox(multiLineStrings.roads)).toEqual([-3.704, 39.470, 5.369, 48.864])
  })

  it('computes bbox of a MultiPolygon', () => {
    expect(computeGeoJsonBoundingBox(multiPolygons.countries)).toEqual([-4.795, 43.766, 18.756, 51.089])
  })

  it('computes bbox of a GeometryCollection with mixed types', () => {
    expect(computeGeoJsonBoundingBox(geometryCollections.mixed)).toEqual([-118.243, -5, 55.4, 48.864])
  })

  it('computes 3D bbox when positions have altitude', () => {
    expect(computeGeoJsonBoundingBox(lineStrings.threeD)).toEqual([6.865, 45.074, 250, 7.742, 45.923, 1224])
  })

  it('computes 3D bbox of a Polygon with altitude', () => {
    expect(computeGeoJsonBoundingBox(polygons.threeD)).toEqual([0, 0, 100, 10, 10, 200])
  })

  it('ignores altitude when ignore3D is true', () => {
    expect(computeGeoJsonBoundingBox(lineStrings.threeD, { ignore3D: true })).toEqual([6.865, 45.074, 7.742, 45.923])
  })

  // Features
  it('computes bbox of a Feature with a Polygon', () => {
    expect(computeGeoJsonBoundingBox(features.franceCountry)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Feature with a MultiPolygon', () => {
    expect(computeGeoJsonBoundingBox(features.centralEurope)).toEqual([-4.795, 43.766, 18.756, 51.089])
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeGeoJsonBoundingBox(features.noGeometry)).toBeNull()
  })

  it('computes 3D bbox of a Feature with a 3D LineString', () => {
    expect(computeGeoJsonBoundingBox(features.alpineRoute)).toEqual([6.865, 45.074, 250, 7.742, 45.923, 1224])
  })

  it('ignores altitude on a Feature when ignore3D is true', () => {
    expect(computeGeoJsonBoundingBox(features.alpineRoute, { ignore3D: true })).toEqual([6.865, 45.074, 7.742, 45.923])
  })

  // FeatureCollections
  it('computes bbox of a FeatureCollection of points', () => {
    expect(computeGeoJsonBoundingBox(featureCollections.europeanCities)).toEqual([-3.704, 40.416, 28.979, 59.330])
  })

  it('computes bbox of a FeatureCollection with mixed geometry types', () => {
    expect(computeGeoJsonBoundingBox(featureCollections.mixedGeometries)).toEqual([-4.795, 39.470, 37.617, 55.755])
  })

  it('returns null for an empty FeatureCollection', () => {
    expect(computeGeoJsonBoundingBox(featureCollections.empty)).toBeNull()
  })

  it('computes 3D bbox of a FeatureCollection with 3D geometries', () => {
    expect(computeGeoJsonBoundingBox(featureCollections.threeDPoints)).toEqual([0, 0, 100, 10, 10, 500])
  })

  it('ignores altitude on a FeatureCollection when ignore3D is true', () => {
    expect(computeGeoJsonBoundingBox(featureCollections.threeDPoints, { ignore3D: true })).toEqual([0, 0, 10, 10])
  })

  it('computes bbox of a FeatureCollection ignoring features with no geometry', () => {
    expect(computeGeoJsonBoundingBox(featureCollections.withNullGeometry)).toEqual([2.349, 41.902, 12.496, 48.864])
  })

  // Errors
  it('throws if geoJson is invalid', () => {
    expect(() => computeGeoJsonBoundingBox(null)).toThrow()
    expect(() => computeGeoJsonBoundingBox({ type: 'Invalid' })).toThrow()
    expect(() => computeGeoJsonBoundingBox('not geojson')).toThrow()
  })

  it('throws if options is invalid', () => {
    expect(() => computeGeoJsonBoundingBox(points.nyc, { ignore3D: 'yes' })).toThrow()
  })
})
