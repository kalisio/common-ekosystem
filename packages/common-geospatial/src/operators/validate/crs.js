import { is } from '@kalisio/common-core'
import { WGS84, hasProjection, normalizeCrsName, isWGS84Projection } from '../../foundation/index.js'
import { CRS_TYPES } from '../is-like.js'
import { VALIDATION_CODES } from './codes.js'

const ROOT_CRS_PATH = '/crs'

export function validateOptionalCRS (crs, path = '', context = {}) {
  // CRS is optional; absence defaults to WGS84 and drives geodesic validation.
  if (!is.defined(crs)) {
    if (path === ROOT_CRS_PATH) {
      context.geodesic = true
      return { crs: WGS84, valid: true }
    }
    return { valid: true }
  }
  // A present crs is only supported at the root; anything deeper is nested and
  // rejected regardless of its shape.
  if (path !== ROOT_CRS_PATH) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.UNSUPPORTED_NESTED_CRS, path }],
      warnings: []
    }
  }
  // Check CRS structure
  if (!is.plainObject(crs)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_CRS_OBJECT, path }],
      warnings: []
    }
  }
  // Check CRS type
  switch (crs.type) {
    case CRS_TYPES.NAME: {
      if (!is.nonEmptyString(crs.properties?.name)) {
        return {
          valid: false,
          errors: [{ code: VALIDATION_CODES.INVALID_CRS_NAME, path }],
          warnings: []
        }
      }
      // A named CRS is valid as long as its projection is registered, whatever
      // the datum. URN normalization stays consistent with extractGeoJsonCRS.
      const crsName = normalizeCrsName(crs.properties.name)
      if (!hasProjection(crsName)) {
        return {
          valid: false,
          errors: [{
            code: VALIDATION_CODES.UNSUPPORTED_CRS,
            path,
            params: { name: crs.properties.name }
          }],
          warnings: []
        }
      }
      context.geodesic = isWGS84Projection(crsName)
      return {
        crs: crsName,
        valid: true,
        errors: [],
        warnings: []
      }
    }
    case CRS_TYPES.LINK: {
      if (!is.nonEmptyString(crs.properties?.href)) {
        return {
          valid: false,
          errors: [{ code: VALIDATION_CODES.INVALID_CRS_LINK, path }],
          warnings: []
        }
      }
      // Link CRS stay structurally valid for isLikeGeoJson but cannot be
      // resolved without fetching external resources, so validation rejects them.
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.UNSUPPORTED_LINK_CRS, path }],
        warnings: []
      }
    }
    default:
      return {
        valid: false,
        errors: [{
          code: VALIDATION_CODES.INVALID_CRS_TYPE,
          path,
          params: { type: crs.type }
        }],
        warnings: []
      }
  }
}
