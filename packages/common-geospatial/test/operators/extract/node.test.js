import { describe, it, expect } from 'vitest'
import { extractGeoJsonNode } from '../../../src/operators/index.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('extractGeoJsonNode', () => {
  it('extracts a top-level node', () => {
    expect(extractGeoJsonNode(features.valid, 'type')).toBe('Feature')
  })
  it('extracts a nested node', () => {
    expect(extractGeoJsonNode(features.valid, 'geometry.type')).toBe('Point')
  })
  it('traverses arrays', () => {
    expect(extractGeoJsonNode(featureCollections.europeanCities, 'features.0.properties.name')).toBe('Paris')
  })
  it('traverses nested arrays', () => {
    expect(extractGeoJsonNode(featureCollections.europeanCities, 'features.0.geometry.coordinates.0')).toBe(2.349)
    expect(extractGeoJsonNode(featureCollections.europeanCities, 'features.0.geometry.coordinates.1')).toBe(48.864)
  })
  it('returns an object node', () => {
    expect(extractGeoJsonNode(features.valid, 'geometry')).toEqual(features.valid.geometry)
  })
  it('returns an array node', () => {
    expect(extractGeoJsonNode(featureCollections.valid, 'features')).toEqual(featureCollections.valid.features)
  })
  it('returns undefined when the path does not exist', () => {
    expect(extractGeoJsonNode(features.valid, 'properties.unknown')).toBeUndefined()
    expect(extractGeoJsonNode(features.valid, 'unknown.value')).toBeUndefined()
  })
  it('throws if geoJson is invalid', () => {
    expect(() => extractGeoJsonNode(null, 'type')).toThrow()
    expect(() => extractGeoJsonNode({ type: 'Invalid' }, 'type')).toThrow()
    expect(() => extractGeoJsonNode('not geojson', 'type')).toThrow()
  })
  it('throws if path is invalid', () => {
    expect(() => extractGeoJsonNode(features.valid, '')).toThrow()
    expect(() => extractGeoJsonNode(features.valid, null)).toThrow()
    expect(() => extractGeoJsonNode(features.valid, 42)).toThrow()
  })
})
