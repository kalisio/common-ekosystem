import { is } from '@kalisio/common-core'
import { isWGS84Projection } from '../../foundation/index.js'
import { CRS_TYPES } from '../is-like.js'
import { VALIDATION_CODES } from './codes.js'

export function validateCRS (crs, path = '') {
  if (!is.plainObject(crs)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_CRS_OBJECT, path }],
      warnings: []
    }
  }
  switch (crs.type) {
    case CRS_TYPES.NAME: {
      if (!is.nonEmptyString(crs.properties?.name)) {
        return {
          valid: false,
          errors: [{ code: VALIDATION_CODES.INVALID_CRS_NAME, path }],
          warnings: []
        }
      }
      if (!isWGS84Projection(crs.properties.name)) {
        return {
          valid: false,
          errors: [{ code: VALIDATION_CODES.UNSUPPORTED_CRS, path, params: { name: crs.properties.name } }],
          warnings: []
        }
      }
      return { valid: true, errors: [], warnings: [] }
    }
    case CRS_TYPES.LINK: {
      if (!is.nonEmptyString(crs.properties?.href)) {
        return {
          valid: false,
          errors: [{ code: VALIDATION_CODES.INVALID_CRS_LINK, path }],
          warnings: []
        }
      }
      return { valid: true, errors: [], warnings: [] }
    }
    default:
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_CRS_TYPE, path, params: { type: crs.type } }],
        warnings: []
      }
  }
}
