import path from 'node:path'
import fs from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import chroma from 'chroma-js'
import { simplifyGeoJson } from '../../src/operators/index.js'
import { lineStrings } from './data/linestring.fixtures.js'
import { polygons } from './data/polygon.fixtures.js'
import { multiLineStrings } from './data/multi-linestring.fixtures.js'
import { multiPolygons } from './data/multi-polygon.fixtures.js'
import { points } from './data/point.fixtures.js'
import { multiPoints } from './data/multi-point.fixtures.js'
import { geometryCollections } from './data/geometry-collection.fixtures.js'
import { features } from './data/feature.fixtures.js'
import { featureCollections } from './data/feature-collection.fixtures.js'

describe('simplify', () => {
  // --- Validation ---

  it('throws if input is null', () => {
    expect(() => simplifyGeoJson(null)).toThrow()
  })

  it('throws if input is not a GeoJson object', () => {
    expect(() => simplifyGeoJson({ type: 'Invalid' })).toThrow()
  })

  // --- LineString ---

  it('reduces the number of points in a LineString', () => {
    const geometry = structuredClone(lineStrings.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates.length).toBeLessThan(lineStrings.simplifiable.coordinates.length)
  })

  it('always preserves the first and last point of a LineString', () => {
    const geometry = structuredClone(lineStrings.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates[0]).toEqual(lineStrings.simplifiable.coordinates[0])
    expect(geometry.coordinates[geometry.coordinates.length - 1]).toEqual(
      lineStrings.simplifiable.coordinates[lineStrings.simplifiable.coordinates.length - 1]
    )
  })

  it('does not simplify a LineString with tolerance = 0', () => {
    const geometry = structuredClone(lineStrings.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 0 })
    expect(geometry.coordinates).toEqual(lineStrings.simplifiable.coordinates)
  })

  // --- Polygon ---

  it('reduces the number of points in each ring of a Polygon', () => {
    const geometry = structuredClone(polygons.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(polygons.simplifiable.coordinates[i].length)
    })
  })

  it('simplifies both the exterior ring and the hole of a Polygon', () => {
    const geometry = structuredClone(polygons.simplifiableWithHole)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toHaveLength(2)
    geometry.coordinates.forEach((ring, i) => {
      expect(ring.length).toBeLessThanOrEqual(polygons.simplifiableWithHole.coordinates[i].length)
    })
  })

  // --- MultiLineString ---

  it('reduces the number of points in each line of a MultiLineString', () => {
    const geometry = structuredClone(multiLineStrings.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((line, i) => {
      expect(line.length).toBeLessThanOrEqual(multiLineStrings.simplifiable.coordinates[i].length)
    })
  })

  // --- MultiPolygon ---

  it('reduces the number of points in each ring of each polygon of a MultiPolygon', () => {
    const geometry = structuredClone(multiPolygons.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    geometry.coordinates.forEach((poly, i) => {
      poly.forEach((ring, j) => {
        expect(ring.length).toBeLessThanOrEqual(multiPolygons.simplifiable.coordinates[i][j].length)
      })
    })
  })

  // --- GeometryCollection ---

  it('simplifies each geometry in a GeometryCollection', () => {
    const geometry = structuredClone(geometryCollections.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    geometry.geometries.forEach((g, i) => {
      const original = geometryCollections.simplifiable.geometries[i]
      if (g.coordinates) {
        expect(g.coordinates.flat(Infinity).length).toBeLessThanOrEqual(original.coordinates.flat(Infinity).length)
      }
    })
  })

  // --- Point / MultiPoint ---

  it('does not alter a Point', () => {
    const geometry = structuredClone(points.valid)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(points.valid.coordinates)
  })

  it('does not alter a MultiPoint', () => {
    const geometry = structuredClone(multiPoints.simplifiable)
    simplifyGeoJson(geometry, { tolerance: 1e-7 })
    expect(geometry.coordinates).toEqual(multiPoints.simplifiable.coordinates)
  })

  // --- Feature ---

  it('simplifies the geometry of a Feature', () => {
    const feature = structuredClone(features.simplifiable)
    simplifyGeoJson(feature, { tolerance: 1e-7 })
    expect(feature.geometry.coordinates.length).toBeLessThan(lineStrings.simplifiable.coordinates.length)
  })

  it('does not throw for a Feature with null geometry', () => {
    const feature = structuredClone(features.noGeometry)
    expect(() => simplifyGeoJson(feature, { tolerance: 1e-7 })).not.toThrow()
  })

  it('does not alter feature properties', () => {
    const feature = structuredClone(features.simplifiable)
    simplifyGeoJson(feature, { tolerance: 1e-7 })
    expect(feature.properties).toEqual(features.simplifiable.properties)
  })

  // --- FeatureCollection ---

  it('simplifies each feature geometry in a FeatureCollection', () => {
    const fc = structuredClone(featureCollections.simplifiable)
    simplifyGeoJson(fc, { tolerance: 1e-7 })
    fc.features
      .filter(f => f.geometry?.type === 'LineString')
      .forEach(f => {
        expect(f.geometry.coordinates.length).toBeLessThan(lineStrings.simplifiable.coordinates.length)
      })
  })

  it('does not throw for a Feature with null geometry inside a FeatureCollection', () => {
    const fc = structuredClone(featureCollections.simplifiable)
    expect(() => simplifyGeoJson(fc, { tolerance: 1e-7 })).not.toThrow()
  })

  it('handles an empty FeatureCollection without throwing', () => {
    expect(() => simplifyGeoJson(structuredClone(featureCollections.empty), { tolerance: 1e-7 })).not.toThrow()
  })

  it('throws for an unknown feature type inside a FeatureCollection', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [{ type: 'Unknown', geometry: null, properties: {} }]
    }
    expect(() => simplifyGeoJson(fc, { tolerance: 1e-7 })).toThrow()
  })

  // --- Return value ---

  it('mutates in place and returns the same object for a geometry', () => {
    const geometry = structuredClone(lineStrings.simplifiable)
    expect(simplifyGeoJson(geometry, { tolerance: 1e-7 })).toBe(geometry)
  })

  it('mutates in place and returns the same Feature object', () => {
    const feature = structuredClone(features.simplifiable)
    expect(simplifyGeoJson(feature, { tolerance: 1e-7 })).toBe(feature)
  })

  it('mutates in place and returns the same FeatureCollection object', () => {
    const fc = structuredClone(featureCollections.simplifiable)
    expect(simplifyGeoJson(fc, { tolerance: 1e-7 })).toBe(fc)
  })

  // --- Vertex weighting ---

  describe('vertex weighting', () => {
    it('preserves a low-area point when its weight is boosted enough to exceed tolerance', () => {
      const coordinates = [[0, 0], [1, 0.0001], [2, 0], [3, 0], [4, 0]]

      const unweighted = { type: 'LineString', coordinates: structuredClone(coordinates) }
      simplifyGeoJson(unweighted, { tolerance: 0.001 })
      expect(unweighted.coordinates).toEqual([[0, 0], [4, 0]])

      const weighted = { type: 'LineString', coordinates: structuredClone(coordinates) }
      simplifyGeoJson(weighted, {
        tolerance: 0.001,
        getWeight: (coord, index) => (index === 1 ? 1000 : 1)
      })
      // The heavily-weighted point at index 1 survives; the other redundant
      // points (2, 3) are still removed since their weight stays at 1.
      expect(weighted.coordinates).toEqual([[0, 0], [1, 0.0001], [4, 0]])
    })

    it('never calls getWeight for the first or last point of a LineString', () => {
      const geometry = {
        type: 'LineString',
        coordinates: [[0, 0], [1, 0.0001], [2, 0], [3, 0], [4, 0]]
      }
      const getWeight = vi.fn(() => 1)
      simplifyGeoJson(geometry, { tolerance: 0.001, getWeight })

      const calledIndices = getWeight.mock.calls.map(call => call[1])
      expect(calledIndices).not.toContain(0)
      expect(calledIndices).not.toContain(4)
    })

    it('calls getWeight with the coordinate matching its index', () => {
      const original = [[0, 0], [1, 0.0001], [2, 0], [3, 0], [4, 0]]
      const geometry = { type: 'LineString', coordinates: structuredClone(original) }
      const getWeight = vi.fn(() => 1)
      simplifyGeoJson(geometry, { tolerance: 0.001, getWeight })

      // getWeight may be called more than once per point (recomputed after a
      // neighbor is removed), so check every call rather than an exact count.
      for (const [coord, index] of getWeight.mock.calls) {
        expect(coord).toEqual(original[index])
      }
    })

    it('passes a ring-local index to getWeight (restarts at 0 for each ring)', () => {
      // A ring is itself a plain zero-indexed coordinate array; getWeight is
      // intentionally called with an index local to whichever ring/line is
      // currently being simplified, not a global index across the whole
      // geometry. Distinct coordinate ranges per ring make it unambiguous
      // which ring each call belongs to.
      const geometry = {
        type: 'Polygon',
        coordinates: [
          [[0, 0], [10, 0.0001], [20, 0], [30, 0], [40, 0], [40, 40], [0, 40], [0, 0]],
          [[1000, 1000], [1010, 1000.0001], [1020, 1000], [1020, 1010], [1010, 1020], [1000, 1020], [1000, 1000]]
        ]
      }
      const indicesByRing = { outer: [], hole: [] }
      const getWeight = (coord, index) => {
        if (coord[0] >= 1000) indicesByRing.hole.push(index)
        else indicesByRing.outer.push(index)
        return 1
      }
      simplifyGeoJson(geometry, { tolerance: 0.001, getWeight })

      expect(Math.min(...indicesByRing.outer)).toBe(1)
      expect(Math.min(...indicesByRing.hole)).toBe(1)
    })
  })

  // --- Heap staleness regression ---

  describe('heap staleness regression', () => {
    // This line is deliberately dense and wiggly: it triggers many cascading
    // recomputes (a node's area is recalculated after a neighbor is removed,
    // while a stale entry for it may still sit in the heap). Before the fix,
    // mutating a node's area in place while it could already be positioned
    // in the heap broke the heap's internal ordering invariant, silently
    // producing a wrong simplification. This exact input/output pair was
    // verified against an independent, deliberately naive O(n^2) reference
    // implementation (no heap involved) that recomputes every area from
    // scratch each iteration -- both agree exactly.
    const HEAP_STRESS_LINE = [[0, 0.0303], [0.1, 0.5782], [0.2, 1.2683], [0.3, 1.7345], [0.4, 2.0408], [0.5, 2.5223], [0.6, 2.7375], [0.7, 3.0512], [0.8, 3.2571], [0.9, 3.2129], [1, 3.1793], [1.1, 3.3831], [1.2, 3.3596], [1.3, 3.2688], [1.4, 3.3165], [1.5, 3.5389], [1.6, 3.7809], [1.7, 3.9962], [1.8, 4.0943], [1.9, 4.5405], [2, 4.962], [2.1, 5.0199], [2.2, 5.4344], [2.3, 5.455], [2.4, 5.6327], [2.5, 5.5841], [2.6, 5.5343], [2.7, 5.5283], [2.8, 5.1774], [2.9, 4.6771], [3, 4.3175], [3.1, 4.0844], [3.2, 3.5377], [3.3, 3.2109], [3.4, 2.6778], [3.5, 2.3823], [3.6, 1.9837], [3.7, 1.774], [3.8, 1.7667], [3.9, 1.6625]]
    const HEAP_STRESS_LINE_SIMPLIFIED = [[0, 0.0303], [0.5, 2.5223], [0.8, 3.2571], [1.4, 3.3165], [2, 4.962], [2.4, 5.6327], [2.7, 5.5283], [3.4, 2.6778], [3.9, 1.6625]]

    it('matches an independently verified reference on a dense, cascading-removal line', () => {
      const geometry = { type: 'LineString', coordinates: structuredClone(HEAP_STRESS_LINE) }
      simplifyGeoJson(geometry, { tolerance: 0.1 })
      expect(geometry.coordinates).toEqual(HEAP_STRESS_LINE_SIMPLIFIED)
    })
  })

  // --- Real-world path (dense LineString with vertex weighting) ---

  describe('path', () => {
    let rawGeojsonPath

    it('loads geoJson path file', () => {
      const filePath = path.resolve(__dirname, './data/path.geojson')
      rawGeojsonPath = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      expect(rawGeojsonPath.geometry.type).toBe('LineString')
      expect(rawGeojsonPath.geometry.coordinates.length).toBe(495)
    })

    it('simplifies the path with a tolerance of 1e-6 without vertex weights', () => {
      const geojsonPath = structuredClone(rawGeojsonPath)
      const simplifiedPath = simplifyGeoJson(geojsonPath, { tolerance: 1e-6 })
      expect(simplifiedPath.geometry.coordinates.length).toBe(390)
    })

    it('simplifies the path with a tolerance of 1e-6 with vertex weights', () => {
      const geojsonPath = structuredClone(rawGeojsonPath)
      const { gradient } = geojsonPath.properties
      const simplifiedPath = simplifyGeoJson(geojsonPath, {
        tolerance: 1e-6,
        getWeight: (coord, index) => {
          if (index === 0 || index === gradient.length - 1) return 1
          const deltaPrev = chroma.deltaE(gradient[index - 1], gradient[index]) / 100
          const deltaNext = chroma.deltaE(gradient[index], gradient[index + 1]) / 100
          return 1 + deltaPrev + deltaNext
        }
      })
      expect(simplifiedPath.geometry.coordinates.length).toBe(390)
    })

    it('simplifies the path with a tolerance of 1e-4 with vertex weights', () => {
      const geojsonPath = structuredClone(rawGeojsonPath)
      const { gradient } = geojsonPath.properties
      const simplifiedPath = simplifyGeoJson(geojsonPath, {
        tolerance: 1e-4,
        getWeight: (coord, index) => {
          if (index === 0 || index === gradient.length - 1) return 1
          const deltaPrev = chroma.deltaE(gradient[index - 1], gradient[index]) / 100
          const deltaNext = chroma.deltaE(gradient[index], gradient[index + 1]) / 100
          return 1 + deltaPrev + deltaNext
        }
      })
      expect(simplifiedPath.geometry.coordinates.length).toBe(168)
    })
  })
})
