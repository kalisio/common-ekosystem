import { assert, is } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES } from '../is-like/index.js'
import { emptyStatistics, validateArray, validateOptionalBBox, validateOptionalCRS } from './utils.js'
import { validateGeometry } from './geometry.js'

function validateFeature (feature, path = '') {
  if (!is.nonEmptyObject(feature)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid feature: must be a non empty object', path }],
      warnings: [],
      statistics: emptyStatistics()
    }
  }
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (is.nonEmptyObject(feature.geometry)) {
      const result = validateGeometry(feature.geometry, `${path}/geometry`)
      const bboxResult = validateOptionalBBox(feature, result, path)
      return {
        ...bboxResult,
        statistics: {
          Feature: 1,
          FeatureCollection: 0,
          // Geometry counting is owned by validateGeometry.
          geometries: { ...result.statistics.geometries }
        }
      }
    }
    return {
      valid: true,
      errors: [],
      warnings: [{ message: 'Feature has no geometry', path }],
      statistics: { Feature: 1, FeatureCollection: 0, geometries: {} }
    }
  }
  if (feature.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    if (is.nonEmptyArray(feature.features)) {
      const result = validateArray(feature.features, validateFeature, `${path}/features`)
      const bboxResult = validateOptionalBBox(feature, result, path)
      return {
        ...bboxResult,
        statistics: { ...result.statistics, FeatureCollection: result.statistics.FeatureCollection + 1 }
      }
    }
    return {
      valid: false,
      errors: [{ message: 'Invalid FeatureCollection: features must be a non empty array', path }],
      warnings: [],
      statistics: emptyStatistics()
    }
  }
  return {
    valid: false,
    errors: [{ message: `Invalid feature: unknown type: ${feature.type}`, path }],
    warnings: [],
    statistics: emptyStatistics()
  }
}

export function validateGeoJson (geoJson) {
  assert.that(geoJson, is.nonEmptyObject, 'geojson must be a non empty object')
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) {
    const result = validateGeometry(geoJson, '')
    const withBBox = validateOptionalBBox(geoJson, result, '')
    const withCRS = validateOptionalCRS(geoJson, withBBox)
    return {
      ...withCRS,
      // Geometry counting is owned by validateGeometry.
      statistics: { Feature: 0, FeatureCollection: 0, geometries: { ...result.statistics.geometries } }
    }
  }
  if (geoJson.type === FEATURE_TYPES.FEATURE || geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    const result = validateFeature(geoJson, '')
    return validateOptionalCRS(geoJson, result)
  }
  return {
    valid: false,
    errors: [{ message: 'Invalid GeoJson: type must be either a Geometry, a Feature or a FeatureCollection', path: '' }],
    warnings: [],
    statistics: emptyStatistics()
  }
}
