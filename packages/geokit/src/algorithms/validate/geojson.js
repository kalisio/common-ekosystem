import { assert, is } from '@kalisio/check'
import { validateOptionalBBox, validateArray } from './utils.js'
import { validateGeometry } from './geometry.js'

function validateFeature (feature, path = '') {
  if (!is.nonEmptyObject(feature)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid feature: feature must be a non empty object', path }],
      warnings: []
    }
  }
  switch (feature.type) {
    case 'Feature': {
      if (is.nonEmptyObject(feature.geometry)) {
        const result = validateGeometry(feature.geometry, `${path}/geometry`)
        return validateOptionalBBox(feature, result, path)
      }
      return {
        valid: true,
        errors: [],
        warnings: [{ message: 'Feature has no geometry', path }]
      }
    }
    case 'FeatureCollection': {
      if (is.nonEmptyArray(feature.features)) {
        const result = validateArray(feature.features, validateFeature, `${path}/features`)
        return validateOptionalBBox(feature, result, path)
      }
      return {
        valid: false,
        errors: [{ message: 'Invalid FeatureCollection: features must be a non empty array', path }],
        warnings: []
      }
    }
    default:
      return {
        valid: false,
        errors: [{ message: `Invalid feature: unknown type: ${feature.type}`, path }],
        warnings: []
      }
  }
}

export function validateGeoJson (geoJson) {
  assert.that(geoJson, is.nonEmptyObject, 'geojson must be a non empty object')
  return validateFeature(geoJson, '')
}
