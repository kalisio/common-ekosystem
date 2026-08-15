import { describe, it, expect } from 'vitest'
import { extractBBox } from '../../../src/operators/index.js'
import { geometries } from '../data/geometry.fixtures.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('extractBBox', () => {
  it('extracts the bbox from a geometry', () => {
    expect(extractBBox(geometries.withValidBBox)).toEqual([-5, 41, 9, 51])
  })
  it('extracts the bbox from a feature', () => {
    expect(extractBBox(features.withValidBBox)).toEqual([-5, 41, 9, 51])
  })
  it('extracts the bbox from a feature collection', () => {
    expect(extractBBox(featureCollections.withValidBBox)).toEqual([-5, -5, 5, 5])
  })
  it('returns undefined when no bbox is declared', () => {
    expect(extractBBox(features.valid)).toBeUndefined()
    expect(extractBBox(featureCollections.valid)).toBeUndefined()
  })
  it('does not compute a bbox', () => {
    expect(extractBBox(features.franceCountry)).toBeUndefined()
  })
  it('throws if geoJson is invalid', () => {
    expect(() => extractBBox(null)).toThrow()
    expect(() => extractBBox({ type: 'Invalid' })).toThrow()
    expect(() => extractBBox('not geojson')).toThrow()
  })
})
