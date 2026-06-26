import path from 'node:path'
import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import { validateGeoJson } from '../../../src/operators'
import { features, featureCollections, geometries, crsObjects } from './data/fixtures.js'

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
      expect(result.errors[0].message).toMatch(/Invalid GeoJson/)
    })
  })

  describe('plain geometries', () => {
    it('should accept a valid Point geometry', () => {
      const result = validateGeoJson(geometries.validPoint)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for an invalid geometry', () => {
      const result = validateGeoJson(geometries.invalidPointLon)
      expect(result.valid).toBe(false)
    })

    it('should accept a valid GeometryCollection', () => {
      const result = validateGeoJson(geometries.validGeometryCollection)
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
      expect(result.warnings.some(w => w.message.match(/no geometry/))).toBe(true)
    })

    it('should accept a Feature without properties', () => {
      const result = validateGeoJson(features.noProperties)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for a Feature with an invalid geometry', () => {
      const result = validateGeoJson(features.invalidGeometry)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/longitude/)
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

    it('should return invalid for an empty features array', () => {
      const result = validateGeoJson(featureCollections.empty)
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty array/)
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
      expect(result.errors[0].message).toMatch(/unknown type/)
    })

    it('should return invalid for a FeatureCollection with an empty features array and a valid CRS', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [],
        crs: crsObjects.validName
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty array/)
    })
  })

  describe('file-based fixtures', () => {
    it('should validate a Feature from polygon.geojson', () => {
      const filePath = path.resolve(__dirname, './data/polygon.geojson')
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const result = validateGeoJson(geojson)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate a FeatureCollection from collection.geojson', () => {
      const filePath = path.resolve(__dirname, './data/collection.geojson')
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const result = validateGeoJson(geojson)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
