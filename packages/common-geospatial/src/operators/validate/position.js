import { is } from '@kalisio/common-core'
import { getCoordinatePrecision, DEFAULT_COORDINATE_PRECISION } from '../../foundation/index.js'
import { VALIDATION_CODES } from './codes.js'

export function validatePosition (coordinates, path = '', context = {}) {
  const geodesic = context.geodesic
  if (!is.arrayOfLengthBetween(coordinates, 2, 3)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_POSITION_LENGTH, path }],
      warnings: []
    }
  }
  // Finiteness is CRS-independent (is.number rejects NaN/Infinity).
  if (!is.number(coordinates[0]) || !is.number(coordinates[1])) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_POSITION_COORDINATES, path }],
      warnings: []
    }
  }
  // Longitude/latitude ranges only make sense for geographic WGS84 coordinates.
  if (geodesic) {
    if (!is.inRange(coordinates[0], -180, 180)) {
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_LONGITUDE_RANGE, path, params: { value: coordinates[0] } }],
        warnings: []
      }
    }
    if (!is.inRange(coordinates[1], -90, 90)) {
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_LATITUDE_RANGE, path, params: { value: coordinates[1] } }],
        warnings: []
      }
    }
  }
  if (coordinates.length === 3 && !is.number(coordinates[2])) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_ALTITUDE, path }],
      warnings: []
    }
  }
  const response = { valid: true, errors: [], warnings: [] }
  // Precision warnings assume degrees, so they are geodesic-only too.
  if (geodesic) {
    const precision = context.precision ?? DEFAULT_COORDINATE_PRECISION
    const lonPrecision = getCoordinatePrecision(coordinates[0])
    if (lonPrecision > precision) {
      response.warnings.push({ code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION, path, params: { precision: lonPrecision, max: precision } })
    }
    const latPrecision = getCoordinatePrecision(coordinates[1])
    if (latPrecision > precision) {
      response.warnings.push({ code: VALIDATION_CODES.EXCESSIVE_LATITUDE_PRECISION, path, params: { precision: latPrecision, max: precision } })
    }
  }
  return response
}
