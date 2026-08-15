import { describe, it, expect } from 'vitest'
import { reprojectGeoJson } from '../../src/operators/index.js'
import { points } from './data/point.fixtures.js'
import { multiPoints } from './data/multi-point.fixtures.js'
import { lineStrings } from './data/linestring.fixtures.js'
import { multiLineStrings } from './data/multi-linestring.fixtures.js'
import { polygons } from './data/polygon.fixtures.js'
import { multiPolygons } from './data/multi-polygon.fixtures.js'
import { geometryCollections } from './data/geometry-collection.fixtures.js'
import { features } from './data/feature.fixtures.js'
import { featureCollections } from './data/feature-collection.fixtures.js'

const TARGET = 'EPSG:3857'
const WGS84 = 'EPSG:4326'

function expectCoordsClose (actual, expected, digits = 6) {
  if (typeof expected[0] === 'number') {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], digits))
  } else {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((child, i) => expectCoordsClose(child, expected[i], digits))
  }
}

function expectGeometryRoundTrip (fixture) {
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
  describe('absolute correctness', () => {
    it('reprojects a Point to expected Web Mercator coordinates', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85] }
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
    it('preserves coordinates when target is WGS84', () => {
      const geoJson = structuredClone(points.valid)
      const original = structuredClone(geoJson.coordinates)
      reprojectGeoJson(geoJson, WGS84)
      expectCoordsClose(geoJson.coordinates, original, 9)
      expect(geoJson.crs).toBeUndefined()
    })
  })
  describe('geometry types', () => {
    it('reprojects a Point', () => {
      expectGeometryRoundTrip(points.valid)
    })
    it('reprojects a MultiPoint', () => {
      expectGeometryRoundTrip(multiPoints.valid)
    })
    it('reprojects a LineString', () => {
      expectGeometryRoundTrip(lineStrings.valid)
    })
    it('reprojects a MultiLineString', () => {
      expectGeometryRoundTrip(multiLineStrings.valid)
    })
    it('reprojects a Polygon', () => {
      expectGeometryRoundTrip(polygons.valid)
    })
    it('reprojects a Polygon with a hole', () => {
      expectGeometryRoundTrip(polygons.withHole)
    })
    it('reprojects a MultiPolygon', () => {
      expectGeometryRoundTrip(multiPolygons.valid)
    })
    it('reprojects a GeometryCollection', () => {
      const geoJson = structuredClone(geometryCollections.valid)
      const original = structuredClone(geoJson)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.geometries).not.toEqual(original.geometries)
      reprojectGeoJson(geoJson, WGS84)
      geoJson.geometries.forEach((geometry, i) => {
        expectCoordsClose(geometry.coordinates, original.geometries[i].coordinates)
      })
    })
  })
  describe('source CRS', () => {
    it('uses WGS84 when no CRS is declared', () => {
      const geoJson = structuredClone(points.valid)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.crs.properties.name).toBe('urn:ogc:def:crs:EPSG::3857')
    })
    it('uses a declared EPSG CRS', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: { type: 'name', properties: { name: 'EPSG:3857' } }
      }
      reprojectGeoJson(geoJson, WGS84)
      expect(geoJson.coordinates[0]).toBeCloseTo(2.35, 6)
      expect(geoJson.coordinates[1]).toBeCloseTo(48.85, 6)
    })
    it('uses a declared EPSG URN CRS', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::3857' } }
      }
      reprojectGeoJson(geoJson, WGS84)
      expect(geoJson.coordinates[0]).toBeCloseTo(2.35, 6)
      expect(geoJson.coordinates[1]).toBeCloseTo(48.85, 6)
    })
    it('uses a registered WGS84 alias', () => {
      const geoJson = structuredClone(features.withCRS)
      const original = structuredClone(geoJson.geometry.coordinates)
      reprojectGeoJson(geoJson, TARGET)
      reprojectGeoJson(geoJson, WGS84)
      expectCoordsClose(geoJson.geometry.coordinates, original)
    })
  })
  describe('target CRS', () => {
    it('stores an EPSG target CRS as an OGC URN', () => {
      const geoJson = structuredClone(points.valid)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.crs).toEqual({
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:EPSG::3857' }
      })
    })
    it('removes the CRS when target is WGS84', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: { type: 'name', properties: { name: 'EPSG:3857' } }
      }
      reprojectGeoJson(geoJson, WGS84)
      expect(geoJson.crs).toBeUndefined()
    })
    it('removes the CRS when target is an equivalent WGS84 alias', () => {
      const geoJson = {
        type: 'Point',
        coordinates: [261600.8034, 6249447.7528],
        crs: { type: 'name', properties: { name: 'EPSG:3857' } }
      }
      reprojectGeoJson(geoJson, 'CRS:84')
      expect(geoJson.crs).toBeUndefined()
    })
  })
  describe('features', () => {
    it('reprojects a Feature', () => {
      const geoJson = structuredClone(features.valid)
      const original = structuredClone(geoJson.geometry.coordinates)
      expect(reprojectGeoJson(geoJson, TARGET)).toBe(geoJson)
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
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.geometry).toBeNull()
    })
    it('reprojects a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.europeanCities)
      const original = geoJson.features.map(feature => structuredClone(feature.geometry.coordinates))
      reprojectGeoJson(geoJson, TARGET)
      geoJson.features.forEach((feature, i) => {
        expect(feature.geometry.coordinates).not.toEqual(original[i])
      })
    })
    it('reprojects mixed geometries in a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.mixedGeometries)
      const original = structuredClone(geoJson)
      reprojectGeoJson(geoJson, TARGET)
      geoJson.features.forEach((feature, i) => {
        expect(feature.geometry.coordinates).not.toEqual(original.features[i].geometry.coordinates)
      })
    })
    it('ignores null geometries in a FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.withNullGeometry)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features[1].geometry).toBeNull()
    })
    it('preserves a FeatureCollection containing only null geometries', () => {
      const geoJson = structuredClone(featureCollections.noGeometries)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features.every(feature => feature.geometry === null)).toBe(true)
    })
    it('preserves an empty FeatureCollection', () => {
      const geoJson = structuredClone(featureCollections.empty)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.features).toEqual([])
    })
  })
  describe('3D coordinates', () => {
    it('preserves altitude on a Point', () => {
      const geoJson = structuredClone(points.valid3D)
      reprojectGeoJson(geoJson, TARGET)
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
    it('does not add a bbox when none is present', () => {
      const geoJson = structuredClone(points.valid)
      reprojectGeoJson(geoJson, TARGET)
      expect(geoJson.bbox).toBeUndefined()
    })
  })
  describe('mutation and metadata', () => {
    it('reprojects in place', () => {
      const geoJson = structuredClone(points.valid)
      expect(reprojectGeoJson(geoJson, TARGET)).toBe(geoJson)
    })
    it('preserves Feature metadata and foreign members', () => {
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
      const geoJson = { ...structuredClone(points.valid), custom: 'value' }
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
    it('rejects an invalid GeoJSON object', () => {
      expect(() => reprojectGeoJson({ type: 'Nope' }, TARGET)).toThrow(/GeoJson/)
    })
    it('rejects an unknown target projection', () => {
      expect(() => reprojectGeoJson(structuredClone(points.valid), 'NOT_A_CRS')).toThrow(/target projection/)
    })
    it('rejects an unknown source projection', () => {
      const geoJson = {
        ...structuredClone(points.valid),
        crs: { type: 'name', properties: { name: 'NOT_A_CRS' } }
      }
      expect(() => reprojectGeoJson(geoJson, TARGET)).toThrow(/source projection/)
    })
    it('validates projections before walking an empty FeatureCollection', () => {
      const geoJson = {
        ...structuredClone(featureCollections.empty),
        crs: { type: 'name', properties: { name: 'NOT_A_CRS' } }
      }
      expect(() => reprojectGeoJson(geoJson, TARGET)).toThrow(/source projection/)
    })
  })
})
