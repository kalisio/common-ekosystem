import { describe, it, expect } from 'vitest'
import { computeGeometryBoundingBox } from '../../../../src/operators/index.js'
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
  polygonWith3DRing
} from '../fixtures.js'

describe('computeGeometryBoundingBox', () => {
  it('computes bbox of a Point', () => {
    expect(computeGeometryBoundingBox(pointNYC)).toEqual([-73.985, 40.748, -73.985, 40.748])
  })

  it('computes bbox of a LineString', () => {
    expect(computeGeometryBoundingBox(lineStringCoastline)).toEqual([-73.985, 40.748, -52.707, 47.561])
  })

  it('computes bbox of a Polygon', () => {
    expect(computeGeometryBoundingBox(polygonFrance)).toEqual([-4.795, 42.428, 8.233, 51.089])
  })

  it('computes bbox of a Polygon with a hole', () => {
    expect(computeGeometryBoundingBox(polygonWithHole)).toEqual([-10, -10, 10, 10])
  })

  it('computes bbox of a MultiPoint', () => {
    expect(computeGeometryBoundingBox(multiPointScattered)).toEqual([-43.172, -22.906, 37.617, 55.755])
  })

  it('computes bbox of a MultiLineString', () => {
    expect(computeGeometryBoundingBox(multiLineStringRoads)).toEqual([-3.704, 39.470, 5.369, 48.864])
  })

  it('computes bbox of a MultiPolygon', () => {
    expect(computeGeometryBoundingBox(multiPolygonCountries)).toEqual([-4.795, 43.766, 18.756, 51.089])
  })

  it('computes bbox of a GeometryCollection with mixed types', () => {
    expect(computeGeometryBoundingBox(geometryCollectionMixed)).toEqual([-118.243, -5, 55.4, 48.864])
  })

  it('computes 3D bbox when positions have altitude', () => {
    expect(computeGeometryBoundingBox(lineString3D)).toEqual([6.865, 45.074, 250, 7.742, 45.923, 1224])
  })

  it('computes 3D bbox of a Polygon with altitude', () => {
    expect(computeGeometryBoundingBox(polygonWith3DRing)).toEqual([0, 0, 100, 10, 10, 200])
  })

  it('ignores altitude when ignore3D is true', () => {
    expect(computeGeometryBoundingBox(lineString3D, { ignore3D: true })).toEqual([6.865, 45.074, 7.742, 45.923])
  })

  it('throws if geometry is invalid', () => {
    expect(() => computeGeometryBoundingBox(null)).toThrow()
    expect(() => computeGeometryBoundingBox({ type: 'Invalid' })).toThrow()
    expect(() => computeGeometryBoundingBox('not a geometry')).toThrow()
  })

  it('throws if options is invalid', () => {
    expect(() => computeGeometryBoundingBox(pointNYC, { ignore3D: 'yes' })).toThrow()
  })
})
