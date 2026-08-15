import { describe, it, expect } from 'vitest'
import { extractNode } from '../../../src/operators/index.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('extractNode', () => {
  it('extracts a top-level node', () => {
    expect(extractNode(features.valid, 'type')).toBe('Feature')
  })
  it('extracts a nested node', () => {
    expect(extractNode(features.valid, 'geometry.type')).toBe('Point')
  })
  it('traverses arrays', () => {
    expect(extractNode(featureCollections.europeanCities, 'features.0.properties.name')).toBe('Paris')
  })
  it('traverses nested arrays', () => {
    expect(extractNode(featureCollections.europeanCities, 'features.0.geometry.coordinates.0')).toBe(2.349)
    expect(extractNode(featureCollections.europeanCities, 'features.0.geometry.coordinates.1')).toBe(48.864)
  })
  it('returns an object node', () => {
    expect(extractNode(features.valid, 'geometry')).toEqual(features.valid.geometry)
  })
  it('returns an array node', () => {
    expect(extractNode(featureCollections.valid, 'features')).toEqual(featureCollections.valid.features)
  })
  it('returns undefined when the path does not exist', () => {
    expect(extractNode(features.valid, 'properties.unknown')).toBeUndefined()
    expect(extractNode(features.valid, 'unknown.value')).toBeUndefined()
  })
  it('throws if geoJson is invalid', () => {
    expect(() => extractNode(null, 'type')).toThrow()
    expect(() => extractNode({ type: 'Invalid' }, 'type')).toThrow()
    expect(() => extractNode('not geojson', 'type')).toThrow()
  })
  it('throws if path is invalid', () => {
    expect(() => extractNode(features.valid, '')).toThrow()
    expect(() => extractNode(features.valid, null)).toThrow()
    expect(() => extractNode(features.valid, 42)).toThrow()
  })
})
