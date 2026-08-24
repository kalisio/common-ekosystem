import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import { DEFAULT_COORDINATE_PRECISION } from '../../foundation/index.js'
import { FEATURE_TYPES, GEOMETRY_TYPES } from '../is-like.js'
import { VALIDATION_CODES } from './codes.js'
import { validateOptionalCRS } from './crs.js'
import { validateOptionalBBox } from './bbox.js'
import { emptyResult, mergeResult, validateArray } from './utils.js'
import { validateGeometry } from './geometry.js'

const VALIDATE_OPTIONS_SCHEMA = {
  precision: optional(is.positiveInteger)
}

function validateFeature (feature, path, context) {
  let result = emptyResult()
  // check whether the feature is a non empty object
  if (!is.nonEmptyObject(feature)) {
    result.valid = false
    result.errors.push({
      code: VALIDATION_CODES.EMPTY_OBJECT,
      path
    })
    return result
  }
  // handle the CRS
  result = mergeResult(result, validateOptionalCRS(feature.crs, `${path}/crs`, context))
  // handle the bbox
  result = mergeResult(result, validateOptionalBBox(feature.bbox, `${path}/bbox`, context))
  // handle the Feature type
  if (feature.type === FEATURE_TYPES.FEATURE) {
    result.statistics.Feature++
    if (is.nonEmptyObject(feature.geometry)) {
      result = mergeResult(result, validateGeometry(feature.geometry, `${path}/geometry`, context))
    } else {
      result.warnings.push({
        code: VALIDATION_CODES.MISSING_GEOMETRY,
        path
      })
    }
    return result
  }
  // handle the FeatureCollection type
  result.statistics.FeatureCollection++
  if (is.nonEmptyArray(feature.features)) {
    result = mergeResult(result, validateArray(feature.features, (f, p) => validateFeature(f, p, context), `${path}/features`))
  } else if (!is.array(feature.features)) {
    result.valid = false
    result.errors.push({
      code: VALIDATION_CODES.INVALID_FEATURES_ARRAY,
      path
    })
  }
  return result
}

export function validateGeoJson (geoJson, options = {}) {
  assert.that(options, (v) => conform.schema(v, VALIDATE_OPTIONS_SCHEMA), 'options must be a valid options object')
  const { precision = DEFAULT_COORDINATE_PRECISION } = options
  // handle whether the geoJson is an object
  if (!is.plainObject(geoJson)) {
    return {
      ...emptyResult(),
      valid: false,
      errors: [{
        code: VALIDATION_CODES.INVALID_CONTENT,
        path: ''
      }]
    }
  }
  // handle whether the geoJson is a non empty object
  if (is.emptyObject(geoJson)) {
    return {
      ...emptyResult(),
      valid: false,
      errors: [{
        code: VALIDATION_CODES.EMPTY_OBJECT,
        path: ''
      }]
    }
  }
  // handle whether the geoJson is a Feature
  if (geoJson.type === FEATURE_TYPES.FEATURE || geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    return validateFeature(geoJson, '', { precision })
  }
  // handle whether the geoJson is a Geometry
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) {
    return validateGeometry(geoJson, '', { precision })
  }
  // If none, the geoJson is invalid
  return {
    ...emptyResult(),
    valid: false,
    errors: [{
      code: VALIDATION_CODES.UNKNOWN_TYPE,
      path: '',
      params: { type: geoJson.type }
    }]
  }
}
