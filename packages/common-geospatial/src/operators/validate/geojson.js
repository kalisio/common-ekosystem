import { assert, is } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES } from '../is-like/index.js'
import { validateOptionalBBox, validateArray, validateOptionalCRS } from './utils.js'
import { validateGeometry } from './geometry.js'

function validateFeature (feature, path = '') {
  if (!is.nonEmptyObject(feature)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid feature: must be a non empty object', path }],
      warnings: []
    }
  }
  if (feature.type === FEATURE_TYPES.FEATURE) {
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
  if (feature.type === FEATURE_TYPES.FEATURE_COLLECTION) {
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
  return {
    valid: false,
    errors: [{ message: `Invalid feature: unknown type: ${feature.type}`, path }],
    warnings: []
  }
}

export function validateGeoJson (geoJson) {
  assert.that(geoJson, is.nonEmptyObject, 'geojson must be a non empty object')
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return validateGeometry(geoJson, '')
  if (geoJson.type === FEATURE_TYPES.FEATURE || geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    const result = validateFeature(geoJson, '')
    return validateOptionalCRS(geoJson, result)
  }
  return {
    valid: false,
    errors: [{ message: 'Invalid GeoJson: type must be either a Geometry, a Feature or a FeatureCollection' }],
    warnings: []
  }
}
