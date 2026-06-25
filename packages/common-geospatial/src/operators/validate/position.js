import { is } from '@kalisio/common-core'
import { getCoordinatePrecision } from '../../foundation'

export function validatePosition (coordinates) {
  if (!is.arrayOfLengthBetween(coordinates, 2, 3)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid coordinates: must be an array of 2 or 3 coordinates' }],
      warnings: []
    }
  }
  if (!is.number(coordinates[0]) || !is.number(coordinates[1])) {
    return {
      valid: false,
      errors: [{ message: 'Invalid coordinates: longitude and latitude must be numbers' }],
      warnings: []
    }
  }
  if (!is.inRange(coordinates[0], -180, 180)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid coordinates: longitude must be in the range -180 to 180' }],
      warnings: []
    }
  }
  if (!is.inRange(coordinates[1], -90, 90)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid coordinates: latitude must be in the range -90 to 90' }],
      warnings: []
    }
  }
  if (coordinates.length === 3 && !is.number(coordinates[2])) {
    return {
      valid: false,
      errors: [{ message: 'Invalid coordinates: altitude must be a number' }],
      warnings: []
    }
  }
  const response = { valid: true, errors: [], warnings: [] }
  const lonPrecision = getCoordinatePrecision(coordinates[0])
  if (lonPrecision > 6) {
    response.warnings.push({ message: `longitude precision is high (${lonPrecision} decimals, max recommended: 6)` })
  }
  const latPrecision = getCoordinatePrecision(coordinates[1])
  if (latPrecision > 6) {
    response.warnings.push({ message: `latitude precision is high (${latPrecision} decimals, max recommended: 6)` })
  }
  return response
}
