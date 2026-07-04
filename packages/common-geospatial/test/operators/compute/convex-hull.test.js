import { describe, it, expect } from 'vitest'
import { computeGeoJsonConvexHull } from '../../../src/operators/index.js'
import { points } from '../data/point.fixtures.js'
import { lineStrings } from '../data/linestring.fixtures.js'
import { polygons } from '../data/polygon.fixtures.js'
import { multiPoints } from '../data/multi-point.fixtures.js'
import { multiLineStrings } from '../data/multi-linestring.fixtures.js'
import { multiPolygons } from '../data/multi-polygon.fixtures.js'
import { geometryCollections } from '../data/geometry-collection.fixtures.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('computeGeoJsonConvexHull', () => {
  // Geometries
  it('returns a Point for a Point geometry', () => {
    const result = computeGeoJsonConvexHull(points.paris)
    expect(result.type).toBe('Point')
    expect(result.coordinates).toEqual([2.349, 48.864])
  })

  it('returns a LineString for a 2-point LineString', () => {
    const result = computeGeoJsonConvexHull(lineStrings.twoPoints)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for a MultiPoint with a single unique location', () => {
    const result = computeGeoJsonConvexHull(multiPoints.singleLocation)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [2.349, 48.864]])
  })

  it('returns a LineString for collinear MultiPoint', () => {
    const result = computeGeoJsonConvexHull(multiPoints.collinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a LineString for a collinear LineString', () => {
    const result = computeGeoJsonConvexHull(lineStrings.collinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a Polygon for a non-degenerate LineString', () => {
    expect(computeGeoJsonConvexHull(lineStrings.coastline).type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon', () => {
    expect(computeGeoJsonConvexHull(polygons.france).type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon with a hole', () => {
    expect(computeGeoJsonConvexHull(polygons.withHole).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPoint', () => {
    expect(computeGeoJsonConvexHull(multiPoints.scattered).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiLineString', () => {
    expect(computeGeoJsonConvexHull(multiLineStrings.roads).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPolygon', () => {
    expect(computeGeoJsonConvexHull(multiPolygons.countries).type).toBe('Polygon')
  })

  it('returns a Polygon for a GeometryCollection with mixed types', () => {
    expect(computeGeoJsonConvexHull(geometryCollections.mixed).type).toBe('Polygon')
  })

  it('strips altitude — always returns 2D geometry', () => {
    const result = computeGeoJsonConvexHull(lineStrings.threeD)
    expect(result.type).toBe('Polygon')
    result.coordinates[0].forEach(pos => expect(pos.length).toBe(2))
  })

  // Features
  it('returns a Polygon for a Feature with a Polygon', () => {
    expect(computeGeoJsonConvexHull(features.franceCountry).type).toBe('Polygon')
  })

  it('returns a Polygon for a Feature with a MultiPolygon', () => {
    expect(computeGeoJsonConvexHull(features.centralEurope).type).toBe('Polygon')
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeGeoJsonConvexHull(features.noGeometry)).toBeNull()
  })

  it('returns a LineString for a Feature with collinear geometry', () => {
    const result = computeGeoJsonConvexHull(features.collinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  // FeatureCollections
  it('returns a Polygon for a FeatureCollection of points', () => {
    expect(computeGeoJsonConvexHull(featureCollections.europeanCities).type).toBe('Polygon')
  })

  it('returns a Polygon for a FeatureCollection with mixed geometry types', () => {
    expect(computeGeoJsonConvexHull(featureCollections.mixedGeometries).type).toBe('Polygon')
  })

  it('returns null for an empty FeatureCollection', () => {
    expect(computeGeoJsonConvexHull(featureCollections.empty)).toBeNull()
  })

  it('returns null for a FeatureCollection with only null geometries', () => {
    expect(computeGeoJsonConvexHull(featureCollections.noGeometries)).toBeNull()
  })

  it('returns a LineString for a FeatureCollection ignoring null geometries', () => {
    const result = computeGeoJsonConvexHull(featureCollections.withNullGeometry)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for a FeatureCollection with collinear points', () => {
    const result = computeGeoJsonConvexHull(featureCollections.collinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [2, 2]])
  })

  it('strips altitude for a 3D FeatureCollection — always returns 2D geometry', () => {
    const result = computeGeoJsonConvexHull(featureCollections.threeDPoints)
    expect(result.type).toBe('Polygon')
    result.coordinates[0].forEach(pos => expect(pos.length).toBe(2))
  })

  // Errors
  it('throws if geoJson is invalid', () => {
    expect(() => computeGeoJsonConvexHull(null)).toThrow()
    expect(() => computeGeoJsonConvexHull({ type: 'Invalid' })).toThrow()
    expect(() => computeGeoJsonConvexHull('not geojson')).toThrow()
  })
})
