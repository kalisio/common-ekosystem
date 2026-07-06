import { describe, it, expect } from 'vitest'
import { truncateGeoJson } from '../../src/operators/index.js'

describe('truncate', () => {
  describe('Geometry', () => {
    it('truncates a Point geometry', () => {
      const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
      const result = truncateGeoJson(geometry)
      expect(result.coordinates).toEqual([10.1234568, 20.9876543])
    })

    it('truncates a LineString geometry', () => {
      const geometry = {
        type: 'LineString',
        coordinates: [
          [10.123456789, 20.987654321],
          [30.111111111, 40.999999999]
        ]
      }
      const result = truncateGeoJson(geometry)
      expect(result.coordinates[0]).toEqual([10.1234568, 20.9876543])
      expect(result.coordinates[1]).toEqual([30.1111111, 41])
    })

    it('truncates a Polygon geometry', () => {
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [0.123456789, 0.987654321],
          [1.123456789, 0.987654321],
          [1.123456789, 1.987654321],
          [0.123456789, 0.987654321]
        ]]
      }
      const result = truncateGeoJson(geometry)
      expect(result.coordinates[0][0]).toEqual([0.1234568, 0.9876543])
    })

    it('truncates a GeometryCollection', () => {
      const geometry = {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Point', coordinates: [10.123456789, 20.987654321] },
          { type: 'Point', coordinates: [30.111111111, 40.999999999] }
        ]
      }
      const result = truncateGeoJson(geometry)
      expect(result.geometries[0].coordinates).toEqual([10.1234568, 20.9876543])
    })

    it('truncates bbox if present', () => {
      const geometry = {
        type: 'Point',
        coordinates: [10.123456789, 20.987654321],
        bbox: [10.123456789, 20.987654321, 10.123456789, 20.987654321]
      }
      const result = truncateGeoJson(geometry)
      expect(result.bbox).toEqual([10.1234568, 20.9876543, 10.1234568, 20.9876543])
    })

    it('mutates the original geometry', () => {
      const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
      const result = truncateGeoJson(geometry)
      expect(result).toBe(geometry)
    })

    it('applies custom precision', () => {
      const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
      const result = truncateGeoJson(geometry, { precision: 3 })
      expect(result.coordinates).toEqual([10.123, 20.988])
    })

    it('throws if geometry is invalid', () => {
      expect(() => truncateGeoJson(null)).toThrow()
      expect(() => truncateGeoJson({ type: 'Invalid' })).toThrow()
      expect(() => truncateGeoJson('not a geometry')).toThrow()
    })

    it('throws if precision is out of range', () => {
      const geometry = { type: 'Point', coordinates: [1, 2] }
      expect(() => truncateGeoJson(geometry, { precision: -1 })).toThrow()
      expect(() => truncateGeoJson(geometry, { precision: 9 })).toThrow()
    })
  })

  describe('Polygon ring deduplication', () => {
    it('removes consecutive positions that collapse after truncation', () => {
      // The middle vertex rounds onto its predecessor at precision 3
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [0, 0],
          [2, 0.0001],
          [2, 0.0002],
          [2, 1],
          [0, 1],
          [0, 0]
        ]]
      }
      const result = truncateGeoJson(geometry, { precision: 3 })
      const ring = result.coordinates[0]
      // [2, 0.0001] and [2, 0.0002] both round to [2, 0] -> one is dropped
      const duplicates = ring.filter(([lon, lat]) => lon === 2 && lat === 0)
      expect(duplicates).toHaveLength(1)
    })

    it('keeps the ring closed after dropping the closing point', () => {
      // The penultimate vertex collapses onto the first after truncation
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [0, 0],
          [2, 0],
          [2, 1],
          [0.0001, 0.0001],
          [0, 0]
        ]]
      }
      const result = truncateGeoJson(geometry, { precision: 3 })
      const ring = result.coordinates[0]
      expect(ring[0]).toEqual(ring[ring.length - 1])
    })

    it('leaves a clean ring untouched', () => {
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [0, 0],
          [2, 0],
          [2, 1],
          [0, 1],
          [0, 0]
        ]]
      }
      const result = truncateGeoJson(geometry, { precision: 3 })
      expect(result.coordinates[0]).toHaveLength(5)
    })

    it('does not deduplicate positions of a LineString', () => {
      // A line may legitimately revisit the same point; it must not be deduplicated
      const geometry = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [0.0001, 0.0001],
          [0.0002, 0.0002],
          [1, 1]
        ]
      }
      const result = truncateGeoJson(geometry, { precision: 3 })
      // All four positions are preserved even though the first three collapse
      expect(result.coordinates).toHaveLength(4)
    })

    it('does not deduplicate positions of a MultiPoint', () => {
      const geometry = {
        type: 'MultiPoint',
        coordinates: [
          [0, 0],
          [0.0001, 0.0001],
          [1, 1]
        ]
      }
      const result = truncateGeoJson(geometry, { precision: 3 })
      expect(result.coordinates).toHaveLength(3)
    })

    it('deduplicates rings within a MultiPolygon', () => {
      const geometry = {
        type: 'MultiPolygon',
        coordinates: [[[
          [0, 0],
          [2, 0.0001],
          [2, 0.0002],
          [2, 1],
          [0, 1],
          [0, 0]
        ]]]
      }
      const result = truncateGeoJson(geometry, { precision: 3 })
      const ring = result.coordinates[0][0]
      const duplicates = ring.filter(([lon, lat]) => lon === 2 && lat === 0)
      expect(duplicates).toHaveLength(1)
    })
  })

  describe('consider3D', () => {
    it('merges positions equal in lon/lat but differing in altitude by default', () => {
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [0, 0, 10],
          [2, 1, 20],
          [2, 1, 50],
          [0, 1, 30],
          [0, 0, 10]
        ]]
      }
      const result = truncateGeoJson(geometry)
      const ring = result.coordinates[0]
      // [2, 1, 20] and [2, 1, 50] share lon/lat -> merged when altitude is ignored
      const atVertex = ring.filter(([lon, lat]) => lon === 2 && lat === 1)
      expect(atVertex).toHaveLength(1)
    })

    it('keeps altitude-differing positions when consider3D is true', () => {
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          [0, 0, 10],
          [2, 1, 20],
          [2, 1, 50],
          [0, 1, 30],
          [0, 0, 10]
        ]]
      }
      const result = truncateGeoJson(geometry, { consider3D: true })
      const ring = result.coordinates[0]
      const atVertex = ring.filter(([lon, lat]) => lon === 2 && lat === 1)
      expect(atVertex).toHaveLength(2)
    })
  })

  describe('Feature', () => {
    it('truncates a Feature geometry', () => {
      const geoJson = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] },
        properties: {}
      }
      const result = truncateGeoJson(geoJson)
      expect(result.geometry.coordinates).toEqual([10.1234568, 20.9876543])
    })

    it('truncates Feature bbox', () => {
      const geoJson = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] },
        properties: {},
        bbox: [10.123456789, 20.987654321, 10.123456789, 20.987654321]
      }
      const result = truncateGeoJson(geoJson)
      expect(result.bbox).toEqual([10.1234568, 20.9876543, 10.1234568, 20.9876543])
    })

    it('handles Feature with null geometry', () => {
      const geoJson = { type: 'Feature', geometry: null, properties: {} }
      expect(() => truncateGeoJson(geoJson)).not.toThrow()
    })
  })

  describe('FeatureCollection', () => {
    it('truncates all features in a FeatureCollection', () => {
      const geoJson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] }, properties: {} },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [30.111111111, 40.999999999] }, properties: {} }
        ]
      }
      const result = truncateGeoJson(geoJson)
      expect(result.features[0].geometry.coordinates).toEqual([10.1234568, 20.9876543])
      expect(result.features[1].geometry.coordinates).toEqual([30.1111111, 41])
    })

    it('truncates FeatureCollection bbox', () => {
      const geoJson = {
        type: 'FeatureCollection',
        features: [],
        bbox: [10.123456789, 20.987654321, 30.111111111, 40.999999999]
      }
      const result = truncateGeoJson(geoJson)
      expect(result.bbox).toEqual([10.1234568, 20.9876543, 30.1111111, 41])
    })

    it('truncates each Feature bbox in a FeatureCollection', () => {
      const geoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] },
            properties: {},
            bbox: [10.123456789, 20.987654321, 10.123456789, 20.987654321]
          }
        ]
      }
      const result = truncateGeoJson(geoJson)
      expect(result.features[0].bbox).toEqual([10.1234568, 20.9876543, 10.1234568, 20.9876543])
    })
  })

  it('mutates the original object', () => {
    const geoJson = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] },
      properties: {}
    }
    const result = truncateGeoJson(geoJson)
    expect(result).toBe(geoJson)
  })

  it('applies custom precision', () => {
    const geoJson = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] },
      properties: {}
    }
    const result = truncateGeoJson(geoJson, { precision: 3 })
    expect(result.geometry.coordinates).toEqual([10.123, 20.988])
  })

  it('throws if geoJson is invalid', () => {
    expect(() => truncateGeoJson(null)).toThrow()
    expect(() => truncateGeoJson('not a geojson')).toThrow()
    expect(() => truncateGeoJson({ type: 'Invalid' })).toThrow()
  })

  it('throws if precision is out of range', () => {
    const geoJson = { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} }
    expect(() => truncateGeoJson(geoJson, { precision: -1 })).toThrow()
    expect(() => truncateGeoJson(geoJson, { precision: 9 })).toThrow()
  })
})
