import { describe, it, expect } from 'vitest'
import { computeGeometryConvexHull } from '../../../../src/operators/index.js'
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
  geometryCollectionMixed
} from '../fixtures.js'

describe('computeGeometryConvexHull', () => {
  it('returns a Point for a Point geometry', () => {
    const result = computeGeometryConvexHull(pointParis)
    expect(result.type).toBe('Point')
    expect(result.coordinates).toEqual([2.349, 48.864])
  })

  it('returns a LineString for a MultiPoint with a single unique location', () => {
    const result = computeGeometryConvexHull(multiPointSingleLocation)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [2.349, 48.864]])
  })

  it('returns a LineString for a 2-point LineString', () => {
    const result = computeGeometryConvexHull(lineStringTwoPoints)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[2.349, 48.864], [12.496, 41.902]])
  })

  it('returns a LineString for collinear MultiPoint', () => {
    const result = computeGeometryConvexHull(multiPointCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a LineString for a collinear LineString', () => {
    const result = computeGeometryConvexHull(lineStringCollinear)
    expect(result.type).toBe('LineString')
    expect(result.coordinates).toEqual([[0, 0], [3, 3]])
  })

  it('returns a Polygon for a non-degenerate LineString', () => {
    const result = computeGeometryConvexHull(lineStringCoastline)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon', () => {
    const result = computeGeometryConvexHull(polygonFrance)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a Polygon with a hole', () => {
    const result = computeGeometryConvexHull(polygonWithHole)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPoint', () => {
    const result = computeGeometryConvexHull(multiPointScattered)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiLineString', () => {
    const result = computeGeometryConvexHull(multiLineStringRoads)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a MultiPolygon', () => {
    const result = computeGeometryConvexHull(multiPolygonCountries)
    expect(result.type).toBe('Polygon')
  })

  it('returns a Polygon for a GeometryCollection with mixed types', () => {
    const result = computeGeometryConvexHull(geometryCollectionMixed)
    expect(result.type).toBe('Polygon')
  })

  it('strips altitude — always returns 2D geometry', () => {
    const result = computeGeometryConvexHull(lineString3D)
    expect(result.type).toBe('Polygon')
    result.coordinates[0].forEach(pos => expect(pos.length).toBe(2))
  })

  it('throws if geometry is invalid', () => {
    expect(() => computeGeometryConvexHull(null)).toThrow()
    expect(() => computeGeometryConvexHull({ type: 'Invalid' })).toThrow()
    expect(() => computeGeometryConvexHull('not a geometry')).toThrow()
  })
})
