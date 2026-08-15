import { describe, it, expect } from 'vitest'
import { reprojectGeoJson } from '../../src/operators/index.js'
import { points } from './data/point.fixtures.js'
import { multiPoints } from './data/multi-point.fixtures.js'
import { lineStrings } from './data/linestring.fixtures.js'
import { multiLineStrings } from './data/multi-linestring.fixtures.js'
import { polygons } from './data/polygon.fixtures.js'
import { multiPolygons } from './data/multi-polygon.fixtures.js'
import { geometryCollections } from './data/geometry-collection.fixtures.js'
import { geometries } from './data/geometry.fixtures.js'
import { features } from './data/feature.fixtures.js'
import { featureCollections } from './data/feature-collection.fixtures.js'

const TARGET = 'EPSG:3857'
const WGS84 = 'EPSG:4326'

function expectCoordsClose (actual, expected, precision = 6) {
  if (typeof expected[0] === 'number') {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], precision))
  } else {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((child, i) => expectCoordsClose(child, expected[i], precision))
  }
}

function expectRoundTrip (fixture) {
  const geoJson = structuredClone(fixture)
  const original = structuredClone(geoJson.coordinates)
  const result = reprojectGeoJson(geoJson, TARGET)
  expect(result).toBe(geoJson)
  expect(result.coordinates).not.toEqual(original)
  expect(result.crs).toEqual({
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:EPSG::3857' }
  })
  reprojectGeoJson(result, WGS84)
  expectCoordsClose(result.coordinates, original)
  expect(result.crs).toBeUndefined()
}

describe('reprojectGeoJson', () => {
  describe('geometry types', () => {
    it('reprojects a Point', () => {
      expectRoundTrip(points.valid)
    })
    it('reprojects a MultiPoint', () => {
      expectRoundTrip(multiPoints.valid)
    })
    it('reprojects a LineString', () => {
      expectRoundTrip(lineStrings.valid)
    })
    it('reprojects a MultiLineString', () => {
      expectRoundTrip(multiLineStrings.valid)
    })
    it('reprojects a Polygon', () => {
      expectRoundTrip(polygons.valid)
    })
    it('reprojects a Polygon with a hole', () => {
      expectRoundTrip(polygons.withHole)
    })
    it('reprojects a MultiPolygon', () => {
      expectRoundTrip(multiPolygons.valid)
    })
    it('reprojects a GeometryCollection', () => {
      const geoJson = structuredClone(geometryCollections.valid)
      const original = structuredClone(geoJson)
      const result = reprojectGeoJson(geoJson, TARGET)
      expect(result).toBe(geoJson)
      expect(result.geometries).not.toEqual(original.geometries)
      expect(result.crs).toEqual({
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:EPSG::3857' }
      })
      reprojectGeoJson(result, WGS84)
      for (let i = 0; i < result.geometries.length; i++) {
        expectCoordsClose(result.geometries[i].coordinates, original.geometries[i].coordinates)
      }
    })
  })
  describe('absolute correctness', () => {
    it('reprojects known WGS84 coordinates to Web Mercator', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [2.35, 48.85]
      }
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates[0]).toBeCloseTo(261600.8034, 3)
      expect(geoJson.coordinates[1]).toBeCloseTo(6249447.7528, 3)
    })
    it('does not swap longitude and latitude axes', () => {
      const geoJson = structuredClone(points.paris)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates[0]).toBeGreaterThan(0)
      expect(geoJson.coordinates[1]).toBeGreaterThan(geoJson.coordinates[0])
    })
    it('preserves coordinates when source and target are WGS84', () => {
      const geoJson = structuredClone(points.valid)
      const original = structuredClone(geoJson.coordinates)
      reprojectGeoJson(geoJson, WGS84)
      expectCoordsClose(geoJson.coordinates, original, 9)
      expect(geoJson.crs).toBeUndefined()
    })
  })
  describe('source CRS', () => {
    it('uses WGS84 when no CRS is declared', () => {
      const geoJson = structuredClone(points.paris)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates[0]).toBeCloseTo(261489.81, 0)
      expect(geoJson.crs.properties.name).toBe('urn:ogc:def:crs:EPSG::3857')
    })
    it('uses a declared EPSG CRS', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: {
          type: 'name',
          properties: { name: 'EPSG:3857' }
        }
      }
      reprojectGeoJson(geoJson, WGS84)
      expect(geoJson.coordinates[0]).toBeCloseTo(2.35, 6)
      expect(geoJson.coordinates[1]).toBeCloseTo(48.85, 6)
      expect(geoJson.crs).toBeUndefined()
    })
    it('uses a declared EPSG URN CRS', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: {
          type: 'name',
          properties: { name: 'urn:ogc:def:crs:EPSG::3857' }
        }
      }
      reprojectGeoJson(geoJson, WGS84)
      expect(geoJson.coordinates[0]).toBeCloseTo(2.35, 6)
      expect(geoJson.coordinates[1]).toBeCloseTo(48.85, 6)
    })
    it('uses an OGC WGS84 CRS alias', () => {
      const geoJson = structuredClone(features.withCRS)
      const original = structuredClone(geoJson.geometry.coordinates)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.geometry.coordinates).not.toEqual(original)
      reprojectGeoJson(geoJson, WGS84)
      expectCoordsClose(geoJson.geometry.coordinates, original)
    })
  })
  describe('target CRS', () => {
    it('writes an EPSG target CRS as an OGC URN', () => {
      const geoJson = structuredClone(points.valid)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.crs).toEqual({
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:EPSG::3857' }
      })
    })
    it('removes the CRS when the target is WGS84', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: {
          type: 'name',
          properties: { name: 'EPSG:3857' }
        }
      }
      reprojectGeoJson(geoJson, WGS84)
      expect(geoJson.crs).toBeUndefined()
    })
    it('removes the CRS when the target is an equivalent WGS84 projection', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: {
          type: 'name',
          properties: { name: 'EPSG:3857' }
        }
      }
      reprojectGeoJson(geoJson, 'CRS:84')
      expect(geoJson.crs).toBeUndefined()
    })
  })
  describe('features', () => {
    it('reprojects a Feature', () => {
      const geoJson = structuredClone(features.valid)
      const original = structuredClone(geoJson.geometry.coordinates)
      const result = reprojectGeoJson(geoJson, TARGET)
      expect(result).toBe(geoJson)
      expect(geoJson.geometry.coordinates).not.toEqual(original)
    })
    it('preserves Feature properties', () => {
      const geoJson = structuredClone(features.franceCountry)
      const properties = structuredClone(geoJson.properties)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.properties).toEqual(properties)
    })
    it('preserves a Feature with null geometry', () => {
      const geoJson = structuredClone(features.noGeometry)
      const result = reprojectGeoJson(geoJson, TARGET)
      expect(result).toBe(geoJson)
      expect(geoJson.geometry).toBeNull()
    })
    it('reprojects a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.europeanCities)
      const original = geoJson.features.map(feature => structuredClone(feature.geometry.coordinates))
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features).toHaveLength(original.length)
      geoJson.features.forEach((feature, i) => {
        expect(feature.geometry.coordinates).not.toEqual(original[i])
      })
    })
    it('reprojects mixed geometries in a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.mixedGeometries)
      const original = structuredClone(geoJson)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features[0].geometry.coordinates).not.toEqual(original.features[0].geometry.coordinates)
      expect(geoJson.features[1].geometry.coordinates).not.toEqual(original.features[1].geometry.coordinates)
      expect(geoJson.features[2].geometry.coordinates).not.toEqual(original.features[2].geometry.coordinates)
    })
    it('ignores null geometries in a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.withNullGeometry)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features[0].geometry.coordinates).not.toEqual(featureCollections.withNullGeometry.features[0].geometry.coordinates)
      expect(geoJson.features[1].geometry).toBeNull()
      expect(geoJson.features[2].geometry.coordinates).not.toEqual(featureCollections.withNullGeometry.features[2].geometry.coordinates)
    })
    it('preserves a FeatureCollection containing only null geometries', () => {
      const geoJson = structuredClone(featureCollections.noGeometries)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features.every(feature => feature.geometry === null)).toBe(true)
    })
    it('preserves an empty FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.empty)
      const result = reprojectGeoJson(geoJson, TARGET)
      expect(result).toBe(geoJson)
      expect(geoJson.features).toEqual([])
    })
  })
  describe('3D coordinates', () => {
    it('preserves altitude on a Point', () => {
      const geoJson = structuredClone(points.valid3D)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates).toHaveLength(3)
      expect(geoJson.coordinates[2]).toBe(35)
    })
    it('preserves altitude on a LineString', () => {
      const geoJson = structuredClone(lineStrings.threeD)
      const altitudes = geoJson.coordinates.map(position => position[2])
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates.map(position => position[2])).toEqual(altitudes)
    })
    it('preserves altitude on a Polygon', () => {
      const geoJson = structuredClone(polygons.threeD)
      const altitudes = geoJson.coordinates[0].map(position => position[2])
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates[0].map(position => position[2])).toEqual(altitudes)
    })
    it('does not add altitude to 2D coordinates', () => {
      const geoJson = structuredClone(points.valid)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates).toHaveLength(2)
    })
  })
  describe('bbox', () => {
    it('removes a bbox from a geometry', () => {
      const geoJson = structuredClone(geometries.withValidBBox)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.bbox).toBeUndefined()
    })
    it('removes a bbox from a Feature', () => {
      const geoJson = structuredClone(features.withValidBBox)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.bbox).toBeUndefined()
    })
    it('removes a bbox from a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.withValidBBox)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.bbox).toBeUndefined()
    })
    it('removes nested stale bboxes', () => {
      const geoJson = {
        type: 'FeatureCollection',
        bbox: [-5, 41, 9, 51],
        features: [{
          type: 'Feature',
          bbox: [-5, 41, 9, 51],
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [2, 48],
            bbox: [-5, 41, 9, 51]
          }
        }]
      }
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.bbox).toBeUndefined()
      expect(geoJson.features[0].bbox).toBeUndefined()
      expect(geoJson.features[0].geometry.bbox).toBeUndefined()
    })
    it('does not add a bbox when none exists', () => {
      const geoJson = structuredClone(points.valid)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.bbox).toBeUndefined()
    })
  })
  describe('mutation and metadata', () => {
    it('reprojects in place', () => {
      const geoJson = structuredClone(points.valid)
      const result = reprojectGeoJson(geoJson, TARGET)
      expect(result).toBe(geoJson)
    })
    it('preserves Feature properties', () => {
      const geoJson = {
        ...structuredClone(features.valid),
        id: 'paris',
        properties: { name: 'Paris', population: 2000000 },
        custom: 'value'
      }
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.id).toBe('paris')
      expect(geoJson.properties).toEqual({ name: 'Paris', population: 2000000 })
      expect(geoJson.custom).toBe('value')
    })
    it('preserves geometry foreign members', () => {
      const geoJson = {
        ...structuredClone(points.valid),
        custom: 'value'
      }
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.custom).toBe('value')
    })
  })
  describe('empty geometries', () => {
    it('preserves an empty MultiPoint', () => {
      const geoJson = structuredClone(multiPoints.empty)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates).toEqual([])
    })
    it('preserves an empty MultiLineString', () => {
      const geoJson = structuredClone(multiLineStrings.empty)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates).toEqual([])
    })
    it('preserves an empty Polygon', () => {
      const geoJson = structuredClone(polygons.empty)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates).toEqual([])
    })
    it('preserves an empty MultiPolygon', () => {
      const geoJson = structuredClone(multiPolygons.empty)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.coordinates).toEqual([])
    })
    it('preserves an empty GeometryCollection', () => {
      const geoJson = structuredClone(geometryCollections.empty)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.geometries).toEqual([])
    })
  })
  describe('argument validation', () => {
    it('throws for null', () => {
      expect(() => reprojectGeoJson(null, TARGET)).toThrow()
    })
    it('throws for an invalid GeoJSON type', () => {
      expect(() => reprojectGeoJson(geometries.unknownType, TARGET)).toThrow()
    })
    it('throws for a GeoJSON with no type', () => {
      expect(() => reprojectGeoJson(geometries.missingType, TARGET)).toThrow()
    })
    it('throws for an unknown target projection', () => {
      expect(() => reprojectGeoJson(structuredClone(points.valid), 'UNKNOWN')).toThrow(/unknown target projection/)
    })
    it('throws for an unknown source projection', () => {
      const geoJson = {
        ...structuredClone(points.valid),
        crs: {
          type: 'name',
          properties: { name: 'UNKNOWN' }
        }
      }
      expect(() => reprojectGeoJson(geoJson, TARGET)).toThrow(/unknown source projection/)
    })
    it('validates the target projection even for an empty FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.empty)
      expect(() => reprojectGeoJson(geoJson, 'UNKNOWN')).toThrow(/unknown target projection/)
    })
  })
})
