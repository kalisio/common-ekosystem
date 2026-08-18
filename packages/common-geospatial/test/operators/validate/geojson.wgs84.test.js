import path from 'node:path'
import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import { validateGeoJson } from '../../../src/operators/index.js'
import { VALIDATION_CODES } from '../../../src/operators/validate/codes.js'
import { points } from '../data/point.fixtures.js'
import { geometryCollections } from '../data/geometry-collection.fixtures.js'
import { features } from '../data/feature.fixtures.js'
import { featureCollections } from '../data/feature-collection.fixtures.js'
import { crsObjects } from '../data/crs.fixtures.js'

describe('validateGeoJson', () => {
  describe('invalid inputs', () => {
    it('should throw for null', () => {
      expect(() => validateGeoJson(null)).toThrow()
    })
    it('should throw for a string', () => {
      expect(() => validateGeoJson('{"type":"Point"}')).toThrow()
    })
    it('should throw for an array', () => {
      expect(() => validateGeoJson([])).toThrow()
    })
    it('should throw for an empty object', () => {
      expect(() => validateGeoJson({})).toThrow()
    })
    it('should return invalid for an unknown type', () => {
      const result = validateGeoJson({ type: 'Unknown' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.UNKNOWN_TYPE)
      expect(result.errors[0].params.type).toBe('Unknown')
    })
  })

  describe('plain geometries', () => {
    it('should accept a valid Point geometry', () => {
      const result = validateGeoJson(points.valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should return invalid for an invalid geometry', () => {
      const result = validateGeoJson(points.invalidLon)
      expect(result.valid).toBe(false)
    })
    it('should accept a valid GeometryCollection', () => {
      const result = validateGeoJson(geometryCollections.valid)
      expect(result.valid).toBe(true)
    })
  })

  describe('Feature', () => {
    it('should accept a valid Feature', () => {
      const result = validateGeoJson(features.valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should warn for a Feature with no geometry (null)', () => {
      const result = validateGeoJson(features.noGeometry)
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === VALIDATION_CODES.MISSING_GEOMETRY)).toBe(true)
    })
    it('should accept a Feature without properties', () => {
      const result = validateGeoJson(features.noProperties)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for a Feature with an invalid geometry', () => {
      const result = validateGeoJson(features.invalidGeometry)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_LONGITUDE_RANGE)
    })
    it('should include the geometry path in the error', () => {
      const result = validateGeoJson(features.invalidGeometry)
      expect(result.errors[0].path).toMatch(/geometry/)
    })
    it('should accept a Feature with a valid bbox', () => {
      const result = validateGeoJson(features.withValidBBox)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for a Feature with an invalid bbox', () => {
      const result = validateGeoJson(features.withInvalidBBox)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path?.match(/bbox/))).toBe(true)
    })
  })

  describe('FeatureCollection', () => {
    it('should accept a valid FeatureCollection', () => {
      const result = validateGeoJson(featureCollections.valid)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should accept an empty FeatureCollection', () => {
      const result = validateGeoJson(featureCollections.empty)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should return invalid if features is not an array', () => {
      const result = validateGeoJson(featureCollections.notAnArray)
      expect(result.valid).toBe(false)
    })
    it('should return invalid if a feature is invalid', () => {
      const result = validateGeoJson(featureCollections.withInvalidFeature)
      expect(result.valid).toBe(false)
    })
    it('should include the index of the invalid feature in errors', () => {
      const result = validateGeoJson(featureCollections.withInvalidFeature)
      expect(result.errors.some(e => e.index === 1)).toBe(true)
    })
    it('should include the path to the invalid feature in errors', () => {
      const result = validateGeoJson(featureCollections.withInvalidFeature)
      expect(result.errors.some(e => e.path?.match(/features\/1/))).toBe(true)
    })
    it('should accept a FeatureCollection with a valid bbox', () => {
      const result = validateGeoJson(featureCollections.withValidBBox)
      expect(result.valid).toBe(true)
    })
  })

  describe('CRS validation', () => {
    it('should accept a FeatureCollection with a valid CRS', () => {
      const result = validateGeoJson(featureCollections.withValidCRS)
      expect(result.valid).toBe(true)
    })
    it('should return invalid for a FeatureCollection with an invalid CRS', () => {
      const result = validateGeoJson(featureCollections.withInvalidCRS)
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(VALIDATION_CODES.INVALID_CRS_TYPE)
    })
    it('should validate the CRS of an empty FeatureCollection', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [],
        crs: crsObjects.validName
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    it('should reject a nested CRS and path it to the inner object', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [{
          type: 'FeatureCollection',
          crs: { type: 'bad' },
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: {}
          }]
        }]
      })
      expect(result.valid).toBe(false)
      const crsError = result.errors.find(e => e.code === VALIDATION_CODES.UNSUPPORTED_NESTED_CRS)
      expect(crsError).toBeDefined()
      expect(crsError.path).toBe('/features/0/crs')
    })
  })

  describe('file-based fixtures', () => {
    it('should reject polygon.geojson (clockwise exterior ring)', () => {
      const filePath = path.resolve(__dirname, '../data/polygon.geojson')
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const result = validateGeoJson(geojson)
      expect(result.valid).toBe(false)
      const windingErrors = result.errors.filter(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER)
      expect(windingErrors).toHaveLength(1)
      expect(windingErrors[0].path).toBe('/geometry/coordinates/0')
      expect(windingErrors[0].params).toEqual({ expected: 'counter-clockwise', actual: 'clockwise' })
    })
    it('should reject collection.geojson (all exterior rings clockwise)', () => {
      const filePath = path.resolve(__dirname, '../data/collection.geojson')
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const result = validateGeoJson(geojson)
      expect(result.valid).toBe(false)
      const windingErrors = result.errors.filter(e => e.code === VALIDATION_CODES.INVALID_WINDING_ORDER)
      expect(windingErrors).toHaveLength(4)
      expect(windingErrors.every(e => /^\/features\/0\/features\/\d+\/geometry\/coordinates\/0$/.test(e.path))).toBe(true)
      // The inner FeatureCollection declares a nested crs, which is unsupported.
      const nestedCrsErrors = result.errors.filter(e => e.code === VALIDATION_CODES.UNSUPPORTED_NESTED_CRS)
      expect(nestedCrsErrors).toHaveLength(1)
      expect(nestedCrsErrors[0].path).toBe('/features/0/crs')
    })
  })
})
