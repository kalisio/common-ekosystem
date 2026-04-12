import { assert, is } from '@kalisio/check'
import { AXES } from './axes.js'
import { isWest, isSouth } from './directions.js'
import { guessCoordinateAxis, getCoordinatePrecision, parseCoordinate } from './coordinate.js'

export function validatePosition (coordinates) {
  if (!is.arrayOfLengthBetween(coordinates, 2, 3)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid coordinates: must be an array of 2 or 3 coordinates' }],
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

export function parsePosition (pattern) {
  assert.that(pattern, (v) => is.nonEmptyString(v), 'pattern must be a non-empty string')
  const parts = pattern.split(/[,;|]/)
  if (parts.length !== 2) return null
  const [first, second] = parts.map(parseCoordinate)
  if (!first || !second) return null
  const firstDD = first.toDecimal()
  const secondDD = second.toDecimal()
  const firstAxis = guessCoordinateAxis(firstDD.degrees, firstDD.direction)
  const secondAxis = guessCoordinateAxis(secondDD.degrees, secondDD.direction)
  // Apply signedDegrees based on direction
  const signedDegrees = (dd) => {
    const { degrees, direction } = dd
    if (!direction) return degrees
    return (isWest(direction) || isSouth(direction)) ? -degrees : degrees
  }
  if (firstAxis === AXES.LONGITUDE && secondAxis === AXES.LATITUDE) return [signedDegrees(firstDD), signedDegrees(secondDD)]
  if (secondAxis === AXES.LONGITUDE && firstAxis === AXES.LATITUDE) return [signedDegrees(secondDD), signedDegrees(firstDD)]
  if (firstAxis === AXES.LONGITUDE && !secondAxis) return [signedDegrees(firstDD), secondDD]
  if (firstAxis === AXES.LATITUDE && !secondAxis) return [signedDegrees(secondDD), signedDegrees(firstDD)]
  if (secondAxis === AXES.LONGITUDE && !firstAxis) return [signedDegrees(secondDD), signedDegrees(firstDD)]
  if (secondAxis === AXES.LATITUDE && !firstAxis) return [signedDegrees(firstDD), signedDegrees(secondDD)]
  if (!firstAxis && !secondAxis) {
    return [
      [signedDegrees(firstDD), signedDegrees(secondDD)],
      [signedDegrees(secondDD), signedDegrees(firstDD)]
    ]
  }
}
