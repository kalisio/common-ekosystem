import { describe, it, expect } from 'vitest'
import { reprojectGeoJson } from '../../src/operators/index.js'

// hasProjection must accept both. Fixtures use Paris-area coordinates so they
// stay valid under Web Mercator (EPSG:3857) and Lambert-93 (EPSG:2154) alike.
const SOURCE = 'EPSG:4326'
const TARGET = 'EPSG:3857'

// proj4-verified absolute values for SOURCE -> TARGET.
const ABSOLUTE = {
  input: [2.35, 48.85],
  expected: [261600.8034, 6249447.7528]
}

function expectCoordsClose (actual, expected, digits = 6) {
  if (typeof expected[0] === 'number') {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], digits))
  } else {
    expect(actual).toHaveLength(expected.length)
    actual.forEach((child, i) => expectCoordsClose(child, expected[i], digits))
  }
}

const geometries = {
  Point: [2.35, 48.85],
  MultiPoint: [[2.35, 48.85], [2.40, 48.90]],
  LineString: [[2.35, 48.85], [2.40, 48.90]],
  MultiLineString: [[[2.35, 48.85], [2.40, 48.90]], [[2.30, 48.80], [2.32, 48.82]]],
  // Polygon with a hole (outer ring + inner ring)
  Polygon: [
    [[2.30, 48.80], [2.45, 48.80], [2.45, 48.95], [2.30, 48.95], [2.30, 48.80]],
    [[2.35, 48.85], [2.40, 48.85], [2.40, 48.90], [2.35, 48.90], [2.35, 48.85]]
  ],
  // MultiPolygon whose first polygon has a hole
  MultiPolygon: [
    [
      [[2.30, 48.80], [2.45, 48.80], [2.45, 48.95], [2.30, 48.95], [2.30, 48.80]],
      [[2.35, 48.85], [2.40, 48.85], [2.40, 48.90], [2.35, 48.90], [2.35, 48.85]]
    ],
    [[[2.10, 48.60], [2.12, 48.60], [2.12, 48.62], [2.10, 48.62], [2.10, 48.60]]]
  ]
}

function makeGeometry (type) {
  return { type, coordinates: structuredClone(geometries[type]) }
}

describe('reprojectGeoJson', () => {
  describe('absolute correctness', () => {
    it('reprojects a Point to the expected projected coordinates', () => {
      const geoJson = { type: 'Point', coordinates: [...ABSOLUTE.input] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect(geoJson.coordinates[0]).toBeCloseTo(ABSOLUTE.expected[0], 3)
      expect(geoJson.coordinates[1]).toBeCloseTo(ABSOLUTE.expected[1], 3)
    })

    it('maps longitude to x and latitude to y (no axis swap)', () => {
      const geoJson = { type: 'Point', coordinates: [...ABSOLUTE.input] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      // x tracks longitude, y tracks latitude; both grow with their input here
      expect(geoJson.coordinates[0]).toBeGreaterThan(0)
      expect(geoJson.coordinates[1]).toBeGreaterThan(geoJson.coordinates[0])
    })

    it('is a no-op when source equals target', () => {
      const geoJson = { type: 'Point', coordinates: [...ABSOLUTE.input] }
      reprojectGeoJson(geoJson, SOURCE, SOURCE)
      expectCoordsClose(geoJson.coordinates, ABSOLUTE.input, 9)
    })
  })

  describe('round-trip per geometry type', () => {
    it.each(Object.keys(geometries))('reprojects %s in place and round-trips back', (type) => {
      const geoJson = makeGeometry(type)
      const original = structuredClone(geoJson.coordinates)
      const result = reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect(result).toBe(geoJson)
      expect(result.coordinates).not.toEqual(original)
      reprojectGeoJson(result, TARGET, SOURCE)
      expectCoordsClose(result.coordinates, original)
    })
  })

  describe('nesting', () => {
    it('reprojects a flat GeometryCollection', () => {
      const geoJson = {
        type: 'GeometryCollection',
        geometries: [makeGeometry('Point'), makeGeometry('LineString')]
      }
      const original = geoJson.geometries.map((g) => structuredClone(g.coordinates))
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      reprojectGeoJson(geoJson, TARGET, SOURCE)
      geoJson.geometries.forEach((g, i) => expectCoordsClose(g.coordinates, original[i]))
    })

    it('reprojects a nested GeometryCollection', () => {
      const inner = { type: 'GeometryCollection', geometries: [makeGeometry('Point')] }
      const geoJson = { type: 'GeometryCollection', geometries: [makeGeometry('LineString'), inner] }
      const original = structuredClone(geoJson.geometries[1].geometries[0].coordinates)
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      reprojectGeoJson(geoJson, TARGET, SOURCE)
      expectCoordsClose(geoJson.geometries[1].geometries[0].coordinates, original)
    })

    it('reprojects a Feature', () => {
      const feature = { type: 'Feature', properties: {}, geometry: makeGeometry('Point') }
      const original = structuredClone(feature.geometry.coordinates)
      const result = reprojectGeoJson(feature, SOURCE, TARGET)
      expect(result).toBe(feature)
      reprojectGeoJson(result, TARGET, SOURCE)
      expectCoordsClose(result.geometry.coordinates, original)
    })

    it('reprojects a Feature whose geometry is a GeometryCollection', () => {
      const feature = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'GeometryCollection', geometries: [makeGeometry('Point')] }
      }
      const original = structuredClone(feature.geometry.geometries[0].coordinates)
      reprojectGeoJson(feature, SOURCE, TARGET)
      reprojectGeoJson(feature, TARGET, SOURCE)
      expectCoordsClose(feature.geometry.geometries[0].coordinates, original)
    })

    it('reprojects a FeatureCollection', () => {
      const collection = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: {}, geometry: makeGeometry('Point') },
          { type: 'Feature', properties: {}, geometry: makeGeometry('Polygon') }
        ]
      }
      const original = collection.features.map((f) => structuredClone(f.geometry.coordinates))
      reprojectGeoJson(collection, SOURCE, TARGET)
      reprojectGeoJson(collection, TARGET, SOURCE)
      collection.features.forEach((f, i) => expectCoordsClose(f.geometry.coordinates, original[i]))
    })
  })

  describe('z component', () => {
    it('preserves a positive z', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85, 100] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      reprojectGeoJson(geoJson, TARGET, SOURCE)
      expect(geoJson.coordinates).toHaveLength(3)
      expect(geoJson.coordinates[2]).toBeCloseTo(100, 6)
    })

    it('preserves a negative z', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85, -42.5] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect(geoJson.coordinates[2]).toBeCloseTo(-42.5, 6)
    })

    it('does not add a z when the input is 2D', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect(geoJson.coordinates).toHaveLength(2)
    })
  })

  describe('metadata preservation', () => {
    it('leaves feature id, properties and foreign members untouched', () => {
      const feature = {
        type: 'Feature',
        id: 'abc',
        properties: { name: 'Paris', pop: 2000000 },
        title: 'foreign',
        geometry: makeGeometry('Point')
      }
      reprojectGeoJson(feature, SOURCE, TARGET)
      expect(feature.id).toBe('abc')
      expect(feature.properties).toEqual({ name: 'Paris', pop: 2000000 })
      expect(feature.title).toBe('foreign')
    })

    it('leaves geometry foreign members untouched', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85], note: 'keep me' }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect(geoJson.note).toBe('keep me')
    })
  })

  describe('bbox handling', () => {
    it('strips a stale bbox from a geometry', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85], bbox: [2.35, 48.85, 2.35, 48.85] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect('bbox' in geoJson).toBe(false)
    })

    it('strips stale bboxes at every level', () => {
      const collection = {
        type: 'FeatureCollection',
        bbox: [2.30, 48.80, 2.40, 48.90],
        features: [{
          type: 'Feature',
          bbox: [2.35, 48.85, 2.35, 48.85],
          properties: {},
          geometry: { type: 'Point', coordinates: [2.35, 48.85], bbox: [2.35, 48.85, 2.35, 48.85] }
        }]
      }
      reprojectGeoJson(collection, SOURCE, TARGET)
      expect('bbox' in collection).toBe(false)
      expect('bbox' in collection.features[0]).toBe(false)
      expect('bbox' in collection.features[0].geometry).toBe(false)
    })

    it('does not add a bbox when none was present', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85] }
      reprojectGeoJson(geoJson, SOURCE, TARGET)
      expect('bbox' in geoJson).toBe(false)
    })
  })

  describe('empty geometries', () => {
    // Contingent on dropping is.nonEmptyArray from reprojectPositions.
    // If that assert is kept, MultiPoint/LineString with [] and any empty ring throw instead.
    it.each([
      ['MultiPoint', []],
      ['LineString', []],
      ['MultiLineString', []],
      ['Polygon', []],
      ['MultiPolygon', []]
    ])('passes an empty %s through unchanged', (type, coordinates) => {
      const geoJson = { type, coordinates }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).not.toThrow()
      expect(geoJson.coordinates).toEqual(coordinates)
    })

    it('passes an empty GeometryCollection through', () => {
      const geoJson = { type: 'GeometryCollection', geometries: [] }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).not.toThrow()
    })

    it('passes an empty FeatureCollection through', () => {
      const geoJson = { type: 'FeatureCollection', features: [] }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).not.toThrow()
    })

    it('passes a Feature with null geometry through', () => {
      const feature = { type: 'Feature', properties: {}, geometry: null }
      expect(() => reprojectGeoJson(feature, SOURCE, TARGET)).not.toThrow()
    })
  })

  describe('leaf coordinate validation propagates through the walk', () => {
    it('rejects a non-finite coordinate', () => {
      const geoJson = { type: 'LineString', coordinates: [[2.35, 48.85], [NaN, 48.90]] }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).toThrow(/number/)
    })

    it('rejects a non-number coordinate', () => {
      const geoJson = { type: 'Point', coordinates: ['2.35', '48.85'] }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).toThrow(/number/)
    })

    it('rejects a coordinate tuple that is too short', () => {
      const geoJson = { type: 'Point', coordinates: [2.35] }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).toThrow(/number/)
    })

    it('rejects a coordinate tuple that is too long', () => {
      const geoJson = { type: 'Point', coordinates: [2.35, 48.85, 100, 7] }
      expect(() => reprojectGeoJson(geoJson, SOURCE, TARGET)).toThrow(/number/)
    })
  })

  describe('argument validation', () => {
    const point = () => ({ type: 'Point', coordinates: [2.35, 48.85] })

    it('rejects a non-GeoJson value', () => {
      expect(() => reprojectGeoJson({ type: 'Nope' }, SOURCE, TARGET)).toThrow(/valid GeoJson/)
    })

    it('rejects an unknown source projection', () => {
      expect(() => reprojectGeoJson(point(), 'NOT_A_CRS', TARGET)).toThrow(/source projection/)
    })

    it('rejects an unknown target projection', () => {
      expect(() => reprojectGeoJson(point(), SOURCE, 'NOT_A_CRS')).toThrow(/target projection/)
    })

    it('fails fast on bad projection even for an empty collection', () => {
      const geoJson = { type: 'FeatureCollection', features: [] }
      expect(() => reprojectGeoJson(geoJson, 'NOT_A_CRS', TARGET)).toThrow(/source projection/)
    })
  })
})
