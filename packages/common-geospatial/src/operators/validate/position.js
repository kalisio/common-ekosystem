import { is } from '@kalisio/common-core'
import { getCoordinatePrecision, isValidPosition, DEFAULT_COORDINATE_PRECISION } from '../../foundation/index.js'
import { VALIDATION_CODES } from './codes.js'

export function validatePosition (coordinates, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!isValidPosition(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_POSITION, path }],
      warnings: []
    }
  }
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
  const response = { valid: true, errors: [], warnings: [] }
  const lonPrecision = getCoordinatePrecision(coordinates[0])
  if (lonPrecision > precision) {
    response.warnings.push({ code: VALIDATION_CODES.EXCESSIVE_LONGITUDE_PRECISION, path, params: { precision: lonPrecision, max: precision } })
  }
  const latPrecision = getCoordinatePrecision(coordinates[1])
  if (latPrecision > precision) {
    response.warnings.push({ code: VALIDATION_CODES.EXCESSIVE_LATITUDE_PRECISION, path, params: { precision: latPrecision, max: precision } })
  }
  return response
}
