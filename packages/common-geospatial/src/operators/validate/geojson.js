import { assert, is } from '@kalisio/common-core'
import { DEFAULT_COORDINATE_PRECISION, WGS84, isWGS84Projection } from '../../foundation/index.js'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../is-like.js'
import { extractGeoJsonCRS } from '../extract/index.js'
import { VALIDATION_CODES } from './codes.js'
import { emptyStatistics, validateArray, validateOptionalBBox, validateRootCRS, validateNestedCRS } from './utils.js'
import { validateGeometry } from './geometry.js'

// Resolve the validation context once, at the top of the stack, then propagate
// it down. Only the root CRS is considered: it determines whether geodesic
// (WGS84-only) checks apply. Lower-level validators never re-resolve the CRS.
function createValidationContext (geoJson, precision) {
  const crs = isLikeGeoJson(geoJson) ? extractGeoJsonCRS(geoJson) : WGS84
  const geodesic = is.nonEmptyString(crs) ? isWGS84Projection(crs) : false
  return { geodesic, precision }
}

function validateFeature (feature, path = '', context = {}) {
  // The root object is the only one validated with an empty path; a crs found on
  // any descendant is a nested declaration, which is unsupported.
  const isRoot = path === ''
  if (!is.nonEmptyObject(feature)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.EMPTY_OBJECT, path }],
      warnings: [],
      statistics: emptyStatistics()
    }
  }
  if (feature.type === FEATURE_TYPES.FEATURE) {
    let result
    if (is.nonEmptyObject(feature.geometry)) {
      const geometryResult = validateGeometry(feature.geometry, `${path}/geometry`, context)
      result = {
        valid: geometryResult.valid,
        errors: geometryResult.errors,
        warnings: geometryResult.warnings,
        // Geometry counting is owned by validateGeometry.
        statistics: { Feature: 1, FeatureCollection: 0, geometries: { ...geometryResult.statistics.geometries } }
      }
    } else {
      // A null/absent geometry is a valid unlocated Feature (RFC 7946).
      result = {
        valid: true,
        errors: [],
        warnings: [{ code: VALIDATION_CODES.MISSING_GEOMETRY, path }],
        statistics: { Feature: 1, FeatureCollection: 0, geometries: {} }
      }
    }
    // Optional bbox is validated regardless of the geometry being present.
    const withBBox = validateOptionalBBox(feature, result, path, context)
    return isRoot ? validateRootCRS(feature, withBBox, path) : validateNestedCRS(feature, withBBox, path)
  }
  if (feature.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    let result
    if (is.nonEmptyArray(feature.features)) {
      const arrayResult = validateArray(feature.features, (f, p) => validateFeature(f, p, context), `${path}/features`)
      result = {
        ...arrayResult,
        statistics: { ...arrayResult.statistics, FeatureCollection: arrayResult.statistics.FeatureCollection + 1 }
      }
    } else if (is.array(feature.features)) {
      // An empty FeatureCollection is valid (RFC 7946).
      result = {
        valid: true,
        errors: [],
        warnings: [],
        statistics: { Feature: 0, FeatureCollection: 1, geometries: {} }
      }
    } else {
      result = {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_FEATURES_ARRAY, path }],
        warnings: [],
        statistics: emptyStatistics()
      }
    }
    // Optional bbox is validated even for an empty or invalid features array.
    const withBBox = validateOptionalBBox(feature, result, path, context)
    return isRoot ? validateRootCRS(feature, withBBox, path) : validateNestedCRS(feature, withBBox, path)
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
    const withCRS = validateRootCRS(geoJson, withBBox, '')
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
