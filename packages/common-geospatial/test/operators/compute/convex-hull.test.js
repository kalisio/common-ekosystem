import { describe, it, expect } from 'vitest'
import { computeConvexHull } from '../../../src/operators/index.js'
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
} from './fixtures.js'

describe('computeConvexHull', () => {
  // Geometries
  it('returns a Point for a Point geometry', () => {
    const result = computeConvexHull(pointParis)
    expect(result.type).toBe('Point')
    expect(result.coordinates).toEqual([2.349, 48.864])
  })

  it('returns a LineString for a 2-point LineString', () => {
    const result = computeConvexHull(lineStringTwoPoints)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for a MultiPoint with a single unique location', () => {
    const result = computeConvexHull(multiPointSingleLocation)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [2.349, 48.864]])
  })

  it('returns a LineString for collinear MultiPoint', () => {
    const result = computeConvexHull(multiPointCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a LineString for a collinear LineString', () => {
    const result = computeConvexHull(lineStringCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a Polygon for a non-degenerate LineString', () => {
    expect(computeConvexHull(lineStringCoastline).type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon', () => {
    expect(computeConvexHull(polygonFrance).type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon with a hole', () => {
    expect(computeConvexHull(polygonWithHole).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPoint', () => {
    expect(computeConvexHull(multiPointScattered).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiLineString', () => {
    expect(computeConvexHull(multiLineStringRoads).type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPolygon', () => {
    expect(computeConvexHull(multiPolygonCountries).type).toBe('Polygon')
  })

  it('returns a Polygon for a GeometryCollection with mixed types', () => {
    expect(computeConvexHull(geometryCollectionMixed).type).toBe('Polygon')
  })

  it('strips altitude — always returns 2D geometry', () => {
    const result = computeConvexHull(lineString3D)
    expect(result.type).toBe('Polygon')
    result.coordinates[0].forEach(pos => expect(pos.length).toBe(2))
  })

  // Features
  it('returns a Polygon for a Feature with a Polygon', () => {
    expect(computeConvexHull(featurePolygonFrance).type).toBe('Polygon')
  })

  it('returns a Polygon for a Feature with a MultiPolygon', () => {
    expect(computeConvexHull(featureMultiPolygon).type).toBe('Polygon')
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeConvexHull(featureNoGeometry)).toBeNull()
  })

  it('returns a LineString for a Feature with collinear geometry', () => {
    const result = computeConvexHull(featureCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  // FeatureCollections
  it('returns a Polygon for a FeatureCollection of points', () => {
    expect(computeConvexHull(fcEuropeanCities).type).toBe('Polygon')
  })

  it('returns a Polygon for a FeatureCollection with mixed geometry types', () => {
    expect(computeConvexHull(fcMixedGeometries).type).toBe('Polygon')
  })

  it('returns null for an empty FeatureCollection', () => {
    expect(computeConvexHull(fcEmpty)).toBeNull()
  })

  it('returns null for a FeatureCollection with only null geometries', () => {
    expect(computeConvexHull(fcNoGeometries)).toBeNull()
  })

  it('returns a LineString for a FeatureCollection ignoring null geometries', () => {
    const result = computeConvexHull(fcWithNullGeometry)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for a FeatureCollection with collinear points', () => {
    const result = computeConvexHull(fcCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [2, 2]])
  })

  it('strips altitude for a 3D FeatureCollection — always returns 2D geometry', () => {
    const result = computeConvexHull(fc3DAlpineRoute)
    expect(result.type).toBe('Polygon')
    result.coordinates[0].forEach(pos => expect(pos.length).toBe(2))
  })

  // Errors
  it('throws if geoJson is invalid', () => {
    expect(() => computeConvexHull(null)).toThrow()
    expect(() => computeConvexHull({ type: 'Invalid' })).toThrow()
    expect(() => computeConvexHull('not geojson')).toThrow()
  })
})
