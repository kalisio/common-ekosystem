import { describe, it, expect } from 'vitest'
import { WGS84 } from '../../../src/foundation/index.js'
import { extractGeoJsonCRS } from '../../../src/operators/index.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('extractGeoJsonCRS', () => {
  it('returns WGS84 when no CRS is declared', () => {
    expect(extractGeoJsonCRS(features.valid)).toBe(WGS84)
    expect(extractGeoJsonCRS(featureCollections.valid)).toBe(WGS84)
  })
  it('extracts the declared CRS from a feature', () => {
    expect(extractGeoJsonCRS(features.withCRS)).toBe('urn:ogc:def:crs:OGC:1.3:CRS84')
  })
  it('extracts the declared CRS from a feature collection', () => {
    expect(extractGeoJsonCRS(featureCollections.withValidCRS)).toBe('urn:ogc:def:crs:OGC:1.3:CRS84')
  })
  it('normalizes an EPSG URN', () => {
    const geoJson = {
      ...features.valid,
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::2154' } }
    }
    expect(extractGeoJsonCRS(geoJson)).toBe('EPSG:2154')
  })
  it('normalizes an EPSG URN case-insensitively', () => {
    const geoJson = {
      ...features.valid,
      crs: { type: 'name', properties: { name: 'URN:OGC:DEF:CRS:EPSG::3857' } }
    }
    expect(extractGeoJsonCRS(geoJson)).toBe('EPSG:3857')
  })
  it('keeps non-EPSG CRS names unchanged', () => {
    expect(extractGeoJsonCRS(features.withCRS)).toBe('urn:ogc:def:crs:OGC:1.3:CRS84')
  })
  it('throws if geoJson is invalid', () => {
    expect(() => extractGeoJsonCRS(null)).toThrow()
    expect(() => extractGeoJsonCRS({ type: 'Invalid' })).toThrow()
    expect(() => extractGeoJsonCRS('not geojson')).toThrow()
  })
})
