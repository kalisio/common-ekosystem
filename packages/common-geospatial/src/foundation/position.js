import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import { math } from '@kalisio/common-core/utilities'
import { AXES } from './axes.js'
import { isWest, isSouth } from './directions.js'
import {
  DEFAULT_COORDINATE_PRECISION,
  MAX_COORDINATE_PRECISION,
  guessCoordinateAxis,
  parseCoordinate,
  truncateCoordinate
} from './coordinate.js'
import {
  positionToNVector,
  nVectorToPosition,
  angleBetweenNVectors,
  destinationNVector
} from './nvector.js'
import { reprojectCoordinates, hasProjection } from './projections.js'

export const IS_SAME_POSITION_OPTIONS_SCHEMA = {
  precision: optional(is.number),
  consider3D: optional(is.boolean)
}

export const EARTH_RADIUS = 6371008.8

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

export function isValidCoordinates (coordinates) {
  if (!is.arrayOfLengthBetween(coordinates, 2, 3)) return false
  if (!is.number(coordinates[0]) || !is.number(coordinates[1])) return false
  if (coordinates.length === 3 && !is.number(coordinates[2])) return false
  return true
}

export function isValidPosition (coordinates) {
  if (!isValidCoordinates(coordinates)) return false
  if (!is.inRange(coordinates[0], -180, 180)) return false
  if (!is.inRange(coordinates[1], -90, 90)) return false
  return true
}

export function is3DPosition (position) {
  assert.that(position, isValidPosition, 'position must be a valid position')
  return is.arrayOfLength(position, 3)
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
      validator: (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  const { precision = DEFAULT_COORDINATE_PRECISION, consider3D = false } = options
  const length = consider3D ? Math.max(position1.length, position2.length) : 2
  return Array.from({ length }, (_, i) =>
    (position1[i] ?? 0).toFixed(precision) === (position2[i] ?? 0).toFixed(precision)
  ).every(Boolean)
}

export function truncatePosition (position, precision = DEFAULT_COORDINATE_PRECISION) {
  assert.all([
    {
      value: position,
      validator: isValidPosition,
      message: 'position must be a position'
    },
    {
      value: precision,
      validator: (v) => is.inRange(v, 0, MAX_COORDINATE_PRECISION),
      message: `precision must be in range [0, ${MAX_COORDINATE_PRECISION}]`
    }
  ])
  for (let i = 0; i < position.length; i++) {
    position[i] = truncateCoordinate(position[i], precision)
  }
  return position
}

export function reprojectPosition (position, source, target) {
  assert.all([
    {
      value: position,
      validator: (v) => is.arrayOfLengthBetween(v, 2, 3) && v.every(is.number),
      message: 'position must be a tuple of 2 or 3 numbers'
    },
    {
      value: source,
      validator: hasProjection,
      message: `unknown source projection: ${source}`
    },
    {
      value: target,
      validator: hasProjection,
      message: `unknown target projection: ${target}`
    }
  ])
  return reprojectCoordinates(position, source, target)
}

export function destinationFromPosition (position, bearing, distance) {
  assert.all([
    { value: position, validator: isValidPosition, message: 'position must be a valid position' },
    { value: bearing, validator: is.number, message: 'bearing must be a number' },
    { value: distance, validator: is.number, message: 'distance must be a number' }
  ])
  const destination = destinationNVector(
    positionToNVector(position),
    math.to.radians(bearing),
    distance / EARTH_RADIUS
  )
  return nVectorToPosition(destination)
}

export function distanceBetweenPositions (position1, position2) {
  assert.all([
    { value: position1, validator: isValidPosition, message: 'position1 must be a valid position' },
    { value: position2, validator: isValidPosition, message: 'position2 must be a valid position' }
  ])
  return angleBetweenNVectors(positionToNVector(position1), positionToNVector(position2)) * EARTH_RADIUS
}
