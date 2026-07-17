import { assert, is } from '@kalisio/common-core'
import { DEFAULT_COORDINATE_PRECISION } from '../../foundation/index.js'
import { FEATURE_TYPES, GEOMETRY_TYPES } from '../is-like.js'
import { VALIDATION_CODES } from './codes.js'
import { emptyStatistics, validateArray, validateOptionalBBox, validateOptionalCRS } from './utils.js'
import { validateGeometry } from './geometry.js'

function validateFeature (feature, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.nonEmptyObject(feature)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.EMPTY_OBJECT, path }],
      warnings: [],
      statistics: emptyStatistics()
    }
  }
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (is.nonEmptyObject(feature.geometry)) {
      const result = validateGeometry(feature.geometry, `${path}/geometry`, precision)
      const bboxResult = validateOptionalBBox(feature, result, path, precision)
      const crsResult = validateOptionalCRS(feature, bboxResult, path)
      return {
        ...crsResult,
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
      warnings: [{ code: VALIDATION_CODES.MISSING_GEOMETRY, path }],
      statistics: { Feature: 1, FeatureCollection: 0, geometries: {} }
    }
  }
  if (feature.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    if (is.nonEmptyArray(feature.features)) {
      const result = validateArray(feature.features, (f, p) => validateFeature(f, p, precision), `${path}/features`)
      const bboxResult = validateOptionalBBox(feature, result, path, precision)
      const crsResult = validateOptionalCRS(feature, bboxResult, path)
      return {
        ...crsResult,
        statistics: { ...result.statistics, FeatureCollection: result.statistics.FeatureCollection + 1 }
      }
    }
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_FEATURES_ARRAY, path }],
      warnings: [],
      statistics: emptyStatistics()
    }
  }
  return {
    valid: false,
    errors: [{ code: VALIDATION_CODES.UNKNOWN_TYPE, path, params: { type: feature.type } }],
    warnings: [],
    statistics: emptyStatistics()
  }
}

export function validateGeoJson (geoJson, options = {}) {
  assert.that(geoJson, is.nonEmptyObject, 'geojson must be a non empty object')
  const { precision = DEFAULT_COORDINATE_PRECISION } = options
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) {
    const result = validateGeometry(geoJson, '', precision)
    const withBBox = validateOptionalBBox(geoJson, result, '', precision)
    const withCRS = validateOptionalCRS(geoJson, withBBox, '')
    return {
      ...withCRS,
      // Geometry counting is owned by validateGeometry.
      statistics: { Feature: 0, FeatureCollection: 0, geometries: { ...result.statistics.geometries } }
    }
  }
  if (geoJson.type === FEATURE_TYPES.FEATURE || geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    return validateFeature(geoJson, '', precision)
  }
  return {
    valid: false,
    errors: [{ code: VALIDATION_CODES.UNKNOWN_TYPE, path: '', params: { type: geoJson.type } }],
    warnings: [],
    statistics: emptyStatistics()
  }
}
