import { describe, it, expect } from 'vitest'
import {
  isLikePosition,
  isLikeBBox,
  CRS_TYPES, isLikeCRS,
  GEOMETRY_TYPES, isLikeGeometry,
  FEATURE_TYPES, isLikeFeature, isLikeFeatureCollection,
  isLikeFeatureOrFeatureCollection, isLikeGeoJson
} from '../../src/operators'
import { positions } from './data/position.fixtures.js'
import { bboxes } from './data/bbox.fixtures.js'
import { crsObjects } from './data/crs.fixtures.js'
import { polygons } from './data/polygon.fixtures.js'
import { geometryCollections } from './data/geometry-collection.fixtures.js'
import { featureCollections } from './data/feature-collection.fixtures.js'
import { features } from './data/feature.fixtures.js'

// isLikeBBox
describe('isLikeBBox', () => {
  it('returns true for a valid 2D bbox', () => {
    expect(isLikeBBox([0, 0, 1, 1])).toBe(true)
  })

  it('returns true for a valid 3D bbox', () => {
    expect(isLikeBBox([0, 0, 0, 1, 1, 1])).toBe(true)
  })

  it('returns false for wrong length', () => {
    expect(isLikeBBox([])).toBe(false)
    expect(isLikeBBox(bboxes.wrongLength3)).toBe(false)
    expect(isLikeBBox(bboxes.wrongLength5)).toBe(false)
    expect(isLikeBBox(bboxes.wrongLength7)).toBe(false)
  })

  it('returns false if any element is not a number', () => {
    expect(isLikeBBox([0, 0, 1, '1'])).toBe(false)
    expect(isLikeBBox([0, null, 1, 1])).toBe(false)
    expect(isLikeBBox([0, 0, 1, undefined])).toBe(false)
  })

  it('returns false for non-array', () => {
    expect(isLikeBBox(null)).toBe(false)
    expect(isLikeBBox({})).toBe(false)
    expect(isLikeBBox('0,0,1,1')).toBe(false)
  })
})

// isLikeCRS
describe('CRS_TYPES', () => {
  it('has expected values', () => {
    expect(CRS_TYPES.NAME).toBe('name')
    expect(CRS_TYPES.LINK).toBe('link')
  })
})

describe('isLikeCRS', () => {
  it('returns true for a named crs', () => {
    expect(isLikeCRS(crsObjects.validName)).toBe(true)
  })

  it('returns true for a linked crs', () => {
    expect(isLikeCRS({ type: 'link', properties: { href: 'http://example.com/crs' } })).toBe(true)
  })

  it('returns false for named crs without properties.name', () => {
    expect(isLikeCRS(crsObjects.nameEmptyProperties)).toBe(false)
    expect(isLikeCRS(crsObjects.nameEmptyString)).toBe(false)
    expect(isLikeCRS(crsObjects.nameMissingProperties)).toBe(false)
  })

  it('returns false for linked crs without properties.href', () => {
    expect(isLikeCRS(crsObjects.linkMissingHref)).toBe(false)
    expect(isLikeCRS(crsObjects.linkEmptyHref)).toBe(false)
    expect(isLikeCRS(crsObjects.linkMissingProperties)).toBe(false)
  })

  it('returns false for unknown type', () => {
    expect(isLikeCRS(crsObjects.unknownType)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isLikeCRS(null)).toBe(false)
    expect(isLikeCRS('name')).toBe(false)
    expect(isLikeCRS([])).toBe(false)
  })
})

// isLikePosition
describe('isLikePosition', () => {
  it('returns true for a 2D position', () => {
    expect(isLikePosition([1.5, 48.8])).toBe(true)
  })

  it('returns true for a 3D position', () => {
    expect(isLikePosition([1.5, 48.8, 100])).toBe(true)
  })

  it('does not validate coordinate ranges', () => {
    expect(isLikePosition([999, -999])).toBe(true)
  })

  it('returns false for wrong length', () => {
    expect(isLikePosition(positions.empty)).toBe(false)
    expect(isLikePosition(positions.tooShort)).toBe(false)
    expect(isLikePosition(positions.tooLong)).toBe(false)
  })

  it('returns false if any element is not a number', () => {
    expect(isLikePosition([1.5, '48.8'])).toBe(false)
    expect(isLikePosition([null, 48.8])).toBe(false)
  })

  it('returns false for non-array', () => {
    expect(isLikePosition(null)).toBe(false)
    expect(isLikePosition({})).toBe(false)
  })
})

// GEOMETRY_TYPES
describe('GEOMETRY_TYPES', () => {
  it('has all 7 geometry types', () => {
    expect(Object.values(GEOMETRY_TYPES)).toHaveLength(7)
    expect(GEOMETRY_TYPES.POINT).toBe('Point')
    expect(GEOMETRY_TYPES.MULTI_POINT).toBe('MultiPoint')
    expect(GEOMETRY_TYPES.LINESTRING).toBe('LineString')
    expect(GEOMETRY_TYPES.MULTI_LINESTRING).toBe('MultiLineString')
    expect(GEOMETRY_TYPES.POLYGON).toBe('Polygon')
    expect(GEOMETRY_TYPES.MULTI_POLYGON).toBe('MultiPolygon')
    expect(GEOMETRY_TYPES.GEOMETRY_COLLECTION).toBe('GeometryCollection')
  })
})

// isLikeGeometry
describe('isLikeGeometry', () => {
  it('returns true for geometries with coordinates', () => {
    // Kept as a uniform inline loop across all 6 coordinate-based types:
    // no single fixture file covers "empty coordinates" for every type consistently.
    const types = [
      GEOMETRY_TYPES.POINT,
      GEOMETRY_TYPES.MULTI_POINT,
      GEOMETRY_TYPES.LINESTRING,
      GEOMETRY_TYPES.MULTI_LINESTRING,
      GEOMETRY_TYPES.POLYGON,
      GEOMETRY_TYPES.MULTI_POLYGON
    ]
    types.forEach(type => {
      expect(isLikeGeometry({ type, coordinates: [] })).toBe(true)
    })
  })

  it('returns true for a GeometryCollection with geometries array', () => {
    expect(isLikeGeometry(geometryCollections.empty)).toBe(true)
  })

  it('returns false for GeometryCollection without geometries', () => {
    expect(isLikeGeometry({ type: 'GeometryCollection' })).toBe(false)
    expect(isLikeGeometry({ type: 'GeometryCollection', coordinates: [] })).toBe(false)
  })

  it('returns false for geometry without coordinates', () => {
    expect(isLikeGeometry({ type: 'Point' })).toBe(false)
    expect(isLikeGeometry({ type: 'Polygon', coordinates: 'invalid' })).toBe(false)
  })

  it('does not validate coordinates content', () => {
    expect(isLikeGeometry({ type: 'Point', coordinates: ['not', 'numbers'] })).toBe(true)
  })

  it('returns false for Feature or FeatureCollection', () => {
    expect(isLikeGeometry({ type: 'Feature' })).toBe(false)
    expect(isLikeGeometry({ type: 'FeatureCollection' })).toBe(false)
  })

  it('returns false for unknown type', () => {
    expect(isLikeGeometry({ type: 'Unknown', coordinates: [] })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isLikeGeometry(null)).toBe(false)
    expect(isLikeGeometry('Point')).toBe(false)
    expect(isLikeGeometry([])).toBe(false)
  })
})

// FEATURE_TYPES
describe('FEATURE_TYPES', () => {
  it('has expected values', () => {
    expect(FEATURE_TYPES.FEATURE).toBe('Feature')
    expect(FEATURE_TYPES.FEATURE_COLLECTION).toBe('FeatureCollection')
  })
})

// isLikeFeature
describe('isLikeFeature', () => {
  it('returns true for a minimal Feature', () => {
    expect(isLikeFeature({ type: 'Feature' })).toBe(true)
  })

  it('returns true for a Feature with geometry', () => {
    expect(isLikeFeature(features.valid)).toBe(true)
  })

  it('returns true for a Feature with null geometry (spec allows it)', () => {
    expect(isLikeFeature(features.noGeometry)).toBe(true)
  })

  it('returns false for FeatureCollection', () => {
    expect(isLikeFeature(featureCollections.empty)).toBe(false)
  })

  it('returns false for a geometry type', () => {
    expect(isLikeFeature({ type: 'Point', coordinates: [0, 0] })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isLikeFeature(null)).toBe(false)
    expect(isLikeFeature('Feature')).toBe(false)
    expect(isLikeFeature([])).toBe(false)
  })
})

// isLikeFeatureCollection
describe('isLikeFeatureCollection', () => {
  it('returns true for a FeatureCollection with empty features array', () => {
    expect(isLikeFeatureCollection(featureCollections.empty)).toBe(true)
  })

  it('returns true for a FeatureCollection with non-empty features', () => {
    expect(isLikeFeatureCollection(featureCollections.valid)).toBe(true)
  })

  it('does not validate features content', () => {
    expect(isLikeFeatureCollection({ type: 'FeatureCollection', features: ['invalid'] })).toBe(true)
  })

  it('returns false without features property', () => {
    expect(isLikeFeatureCollection({ type: 'FeatureCollection' })).toBe(false)
  })

  it('returns false when features is not an array', () => {
    expect(isLikeFeatureCollection(featureCollections.notAnArray)).toBe(false)
  })

  it('returns false for Feature', () => {
    expect(isLikeFeatureCollection({ type: 'Feature' })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isLikeFeatureCollection(null)).toBe(false)
    expect(isLikeFeatureCollection('FeatureCollection')).toBe(false)
  })
})

// isLikeFeatureOrFeatureCollection
describe('isLikeFeatureOrFeatureCollection', () => {
  it('returns true for a Feature', () => {
    expect(isLikeFeatureOrFeatureCollection({ type: 'Feature' })).toBe(true)
  })

  it('returns true for a FeatureCollection', () => {
    expect(isLikeFeatureOrFeatureCollection(featureCollections.empty)).toBe(true)
  })

  it('returns false for a Geometry', () => {
    expect(isLikeFeatureOrFeatureCollection(polygons.empty)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isLikeFeatureOrFeatureCollection(null)).toBe(false)
    expect(isLikeFeatureOrFeatureCollection('Feature')).toBe(false)
    expect(isLikeFeatureOrFeatureCollection([])).toBe(false)
  })
})

// isLikeGeoJson
describe('isLikeGeoJson', () => {
  it('returns true for a Feature', () => {
    expect(isLikeGeoJson({ type: 'Feature' })).toBe(true)
  })

  it('returns true for a FeatureCollection', () => {
    expect(isLikeGeoJson(featureCollections.empty)).toBe(true)
  })

  it('returns true for any geometry type', () => {
    // Kept as a uniform inline loop, same reasoning as isLikeGeometry above.
    const geometries = [
      { type: 'Point', coordinates: [] },
      { type: 'MultiPoint', coordinates: [] },
      { type: 'LineString', coordinates: [] },
      { type: 'MultiLineString', coordinates: [] },
      { type: 'Polygon', coordinates: [] },
      { type: 'MultiPolygon', coordinates: [] },
      { type: 'GeometryCollection', geometries: [] }
    ]
    geometries.forEach(g => expect(isLikeGeoJson(g)).toBe(true))
  })

  it('returns false for unknown type', () => {
    expect(isLikeGeoJson({ type: 'Unknown' })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isLikeGeoJson(null)).toBe(false)
    expect(isLikeGeoJson('Feature')).toBe(false)
    expect(isLikeGeoJson([])).toBe(false)
  })
})
