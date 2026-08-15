import { describe, it, expect } from 'vitest'
import { extractGeoJsonBBox } from '../../../src/operators/index.js'
import { geometries } from '../data/geometry.fixtures.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'

describe('extractGeoJsonBBox', () => {
  it('extracts the bbox from a geometry', () => {
    expect(extractGeoJsonBBox(geometries.withValidBBox)).toEqual([-5, 41, 9, 51])
  })
  it('extracts the bbox from a feature', () => {
    expect(extractGeoJsonBBox(features.withValidBBox)).toEqual([-5, 41, 9, 51])
  })
  it('extracts the bbox from a feature collection', () => {
    expect(extractGeoJsonBBox(featureCollections.withValidBBox)).toEqual([-5, -5, 5, 5])
  })
  it('returns undefined when no bbox is declared', () => {
    expect(extractGeoJsonBBox(features.valid)).toBeUndefined()
    expect(extractGeoJsonBBox(featureCollections.valid)).toBeUndefined()
  })
  it('does not compute a bbox', () => {
    expect(extractGeoJsonBBox(features.franceCountry)).toBeUndefined()
  })
  it('throws if geoJson is invalid', () => {
    expect(() => extractGeoJsonBBox(null)).toThrow()
    expect(() => extractGeoJsonBBox({ type: 'Invalid' })).toThrow()
    expect(() => extractGeoJsonBBox('not geojson')).toThrow()
  })
})
