import { describe, it, expect } from 'vitest'
import { computeGeoJsonConvexHull } from '../../../../src/operators/index.js'
import {
  polygonFrance,
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
} from '../fixtures.js'

describe('computeGeoJsonConvexHull', () => {
  it('returns a Polygon for a Geometry directly', () => {
    const result = computeGeoJsonConvexHull(polygonFrance)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a Feature with a Polygon', () => {
    const result = computeGeoJsonConvexHull(featurePolygonFrance)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a Feature with a MultiPolygon', () => {
    const result = computeGeoJsonConvexHull(featureMultiPolygon)
    expect(result.type).toBe('Polygon')
  })

  it('returns null for a Feature with no geometry', () => {
    expect(computeGeoJsonConvexHull(featureNoGeometry)).toBeNull()
  })

  it('returns a LineString for a Feature with collinear geometry', () => {
    const result = computeGeoJsonConvexHull(featureCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a Polygon for a FeatureCollection of points', () => {
    const result = computeGeoJsonConvexHull(fcEuropeanCities)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a FeatureCollection with mixed geometry types', () => {
    const result = computeGeoJsonConvexHull(fcMixedGeometries)
    expect(result.type).toBe('Polygon')
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

  it('throws if geoJson is invalid', () => {
    expect(() => computeGeoJsonConvexHull(null)).toThrow()
    expect(() => computeGeoJsonConvexHull({ type: 'Invalid' })).toThrow()
    expect(() => computeGeoJsonConvexHull('not geojson')).toThrow()
  })
})
