import { assert, is, conform, optional } from '@kalisio/common-core'
import { AXES } from './axes.js'
import { isWest, isSouth } from './directions.js'
import { guessCoordinateAxis, parseCoordinate, COORDINATE_TRUNCATION_FACTORS } from './coordinate.js'

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

export function isValidPosition (coordinates) {
  if (!is.arrayOfLengthBetween(coordinates, 2, 3)) return false
  if (!is.number(coordinates[0]) || !is.number(coordinates[1])) return false
  if (!is.inRange(coordinates[0], -180, 180)) return false
  if (!is.inRange(coordinates[1], -90, 90)) return false
  if (coordinates.length === 3 && !is.number(coordinates[2])) return false
  return true
}

export function is3DPosition (position) {
  assert.that(position, isValidPosition, 'position must be a valid position')
  return is.arrayOfLength(position, 3)
}

const IS_SAME_POSITION_OPTIONS = {
  precision: optional(is.number),
  consider3D: optional(is.boolean)
}

export function isSamePosition (position1, position2, options = {}) {
  assert.all([
    {
      value: position1,
      validator: isValidPosition,
      message: 'position1 must be a valid position'
    },
    {
      value: position2,
      validator: isValidPosition,
      message: 'position2 must be a valid position'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS),
      message: 'options must be a valid options object'
    }
  ])
  const { precision = 10, consider3D = false } = options
  const length = consider3D ? Math.max(position1.length, position2.length) : 2
  return Array.from({ length }, (_, i) =>
    (position1[i] ?? 0).toFixed(precision) === (position2[i] ?? 0).toFixed(precision)
  ).every(Boolean)
}

export function truncatePosition (position, precision = 7) {
  assert.all([
    { value: position, validator: isValidPosition, message: 'position must be a position' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = COORDINATE_TRUNCATION_FACTORS[precision]
  for (let i = 0; i < position.length; i++) {
    position[i] = Math.round(position[i] * factor) / factor
  }
  return position
}
