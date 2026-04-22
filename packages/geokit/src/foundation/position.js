import { assert, is } from '@kalisio/kore'
import { AXES } from './axes.js'
import { isWest, isSouth } from './directions.js'
import { guessCoordinateAxis, parseCoordinate } from './coordinate.js'

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
