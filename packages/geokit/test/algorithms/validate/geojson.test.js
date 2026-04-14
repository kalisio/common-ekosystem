import path from 'node:path'
import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import { validateGeoJson } from '../../../src/algorithms/validate'

describe('validateGeoJson', () => {
  describe('invalid inputs', () => {
    it('should throw for null', () => {
      expect(() => validateGeoJson(null)).toThrow()
    })

    it('should throw for empty object', () => {
      expect(() => validateGeoJson({})).toThrow()
    })

    it('should return invalid for unknown type', () => {
      const result = validateGeoJson({ type: 'Unknown' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/unknown type/)
    })
  })

  describe('Feature', () => {
    it('should accept a valid Feature', () => {
      const result = validateGeoJson({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
        properties: {}
      })
      expect(result.valid).toBe(true)
    })

    it('should warn for Feature with no geometry', () => {
      const result = validateGeoJson({ type: 'Feature', geometry: null, properties: {} })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.message.match(/no geometry/))).toBe(true)
    })

    it('should return invalid for Feature with invalid geometry', () => {
      const result = validateGeoJson({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [200, 0] },
        properties: {}
      })
      expect(result.valid).toBe(false)
    })

    it('should validate bbox on Feature', () => {
      const result = validateGeoJson({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2, 48] },
        properties: {},
        bbox: [-5, 41, 9, 51]
      })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for Feature with invalid bbox', () => {
      const result = validateGeoJson({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2, 48] },
        properties: {},
        bbox: [0, 10, 0, 5]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path.match(/bbox/))).toBe(true)
    })
  })

  describe('FeatureCollection', () => {
    it('should accept a valid FeatureCollection', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} }
        ]
      })
      expect(result.valid).toBe(true)
    })

    it('should return invalid for empty features array', () => {
      const result = validateGeoJson({ type: 'FeatureCollection', features: [] })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toMatch(/non empty array/)
    })

    it('should return invalid if a feature is invalid', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
        ]
      })
      expect(result.valid).toBe(false)
    })

    it('should include the index of the invalid feature in errors', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
        ]
      })
      expect(result.errors.some(e => e.index === 1)).toBe(true)
    })

    it('should validate bbox on FeatureCollection', () => {
      const result = validateGeoJson({
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }
        ],
        bbox: [-5, -5, 5, 5]
      })
      expect(result.valid).toBe(true)
    })

    it('should validate a Feature file', () => {
      const filePath = path.resolve(__dirname, './data/polygon.geojson')
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const result = validateGeoJson(geojson)
      expect(result.valid).toBe(true)
    })

    it('should validate a FeatureCollection file', () => {
      const filePath = path.resolve(__dirname, './data/collection.geojson')
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const result = validateGeoJson(geojson)
      expect(result.valid).toBe(true)
    })
  })
})
