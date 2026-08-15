import { assert, is } from '@kalisio/common-core'
import { DEFAULT_COORDINATE_PRECISION, WGS84, isWGS84Projection } from '../../foundation/index.js'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../is-like.js'
import { extractGeoJsonCRS } from '../extract/index.js'
import { VALIDATION_CODES } from './codes.js'
import {
  emptyStatistics,
  validateArray,
  validateOptionalBBox,
  validateOptionalCRS
} from './utils.js'
import { validateGeometry } from './geometry.js'

function createValidationContext (geoJson, precision) {
  const crs = isLikeGeoJson(geoJson) ? extractGeoJsonCRS(geoJson) : WGS84
  const geodesic = is.nonEmptyString(crs) ? isWGS84Projection(crs) : false
  return { geodesic, precision }
}

function validateFeature (feature, path = '', context = {}) {
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
      const result = validateGeometry(feature.geometry, `${path}/geometry`, context)
      const bboxResult = validateOptionalBBox(feature, result, path, context)
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
      const result = validateArray(feature.features, (f, p) => validateFeature(f, p, context), `${path}/features`)
      const bboxResult = validateOptionalBBox(feature, result, path, context)
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
  const context = createValidationContext(geoJson, precision)
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) {
    const result = validateGeometry(geoJson, '', context)
    const withBBox = validateOptionalBBox(geoJson, result, '', context)
    const withCRS = validateOptionalCRS(geoJson, withBBox, '')
    return {
      ...withCRS,
      // Geometry counting is owned by validateGeometry.
      statistics: { Feature: 0, FeatureCollection: 0, geometries: { ...result.statistics.geometries } }
    }
  }
  if (geoJson.type === FEATURE_TYPES.FEATURE || geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    return validateFeature(geoJson, '', context)
  }
  return {
    valid: false,
    errors: [{ code: VALIDATION_CODES.UNKNOWN_TYPE, path: '', params: { type: geoJson.type } }],
    warnings: [],
    statistics: emptyStatistics()
  }
}
