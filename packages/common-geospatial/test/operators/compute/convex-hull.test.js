import { describe, it, expect } from 'vitest'
import { computeGeoJsonConvexHull } from '../../../src/operators/index.js'
import {
  pointParis,
  lineStringTwoPoints,
  lineStringCoastline,
  lineStringCollinear,
  lineString3D,
  polygonFrance,
  polygonWithHole,
  multiPointScattered,
  multiPointCollinear,
  multiPointSingleLocation,
  multiLineStringRoads,
  multiPolygonCountries,
  geometryCollectionMixed,
  featurePolygonFrance,
  featureMultiPolygon,
  featureNoGeometry,
  featureCollinear,
  fcEuropeanCities,
  fcMixedGeometries,
  fcEmpty,
  fcNoGeometries,
  fcWithNullGeometry,
  fcCollinear,
  fc3DAlpineRoute
} from './data/fixtures.js'

describe('computeGeoJsonConvexHull', () => {
  // Geometries
  it('returns a Point for a Point geometry', () => {
    const result = computeGeoJsonConvexHull(pointParis)
    expect(result.type).toBe('Point')
    expect(result.coordinates).toEqual([2.349, 48.864])
  })

  it('returns a LineString for a 2-point LineString', () => {
    const result = computeGeoJsonConvexHull(lineStringTwoPoints)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for a MultiPoint with a single unique location', () => {
    const result = computeGeoJsonConvexHull(multiPointSingleLocation)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [2.349, 48.864]])
  })

  it('returns a LineString for collinear MultiPoint', () => {
    const result = computeGeoJsonConvexHull(multiPointCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a LineString for a collinear LineString', () => {
    const result = computeGeoJsonConvexHull(lineStringCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a Polygon for a non-degenerate LineString', () => {
    expect(computeGeoJsonConvexHull(lineStringCoastline).type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon', () => {
    expect(computeGeoJsonConvexHull(polygonFrance).type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon with a hole', () => {
    expect(computeGeoJsonConvexHull(polygonWithHole).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPoint', () => {
    expect(computeGeoJsonConvexHull(multiPointScattered).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiLineString', () => {
    expect(computeGeoJsonConvexHull(multiLineStringRoads).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPolygon', () => {
    expect(computeGeoJsonConvexHull(multiPolygonCountries).type).toBe('Polygon')
  })

  it('returns a Polygon for a GeometryCollection with mixed types', () => {
    expect(computeGeoJsonConvexHull(geometryCollectionMixed).type).toBe('Polygon')
  })

  it('strips altitude — always returns 2D geometry', () => {
    const result = computeGeoJsonConvexHull(lineString3D)
    expect(result.type).toBe('Polygon')
    result.coordinates[0].forEach(pos => expect(pos.length).toBe(2))
  })

  // Features
  it('returns a Polygon for a Feature with a Polygon', () => {
    expect(computeGeoJsonConvexHull(featurePolygonFrance).type).toBe('Polygon')
  })

  it('returns a Polygon for a Feature with a MultiPolygon', () => {
    expect(computeGeoJsonConvexHull(featureMultiPolygon).type).toBe('Polygon')
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeGeoJsonConvexHull(featureNoGeometry)).toBeNull()
  })

  it('returns a LineString for a Feature with collinear geometry', () => {
    const result = computeGeoJsonConvexHull(featureCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  // FeatureCollections
  it('returns a Polygon for a FeatureCollection of points', () => {
    expect(computeGeoJsonConvexHull(fcEuropeanCities).type).toBe('Polygon')
  })

  it('returns a Polygon for a FeatureCollection with mixed geometry types', () => {
    expect(computeGeoJsonConvexHull(fcMixedGeometries).type).toBe('Polygon')
  })

  it('returns null for an empty FeatureCollection', () => {
    expect(computeGeoJsonConvexHull(fcEmpty)).toBeNull()
  })

  it('returns null for a FeatureCollection with only null geometries', () => {
    expect(computeGeoJsonConvexHull(fcNoGeometries)).toBeNull()
  })

  it('returns a LineString for a FeatureCollection ignoring null geometries', () => {
    const result = computeGeoJsonConvexHull(fcWithNullGeometry)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for a FeatureCollection with collinear points', () => {
    const result = computeGeoJsonConvexHull(fcCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [2, 2]])
  })

  it('strips altitude for a 3D FeatureCollection — always returns 2D geometry', () => {
    const result = computeGeoJsonConvexHull(fc3DAlpineRoute)
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
