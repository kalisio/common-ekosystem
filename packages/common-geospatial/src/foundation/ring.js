import { assert, is, conform } from '@kalisio/common-core/predicates'
import { math } from '@kalisio/common-core/utilities'
import { DEFAULT_COORDINATE_PRECISION } from './coordinate.js'
import { isSamePosition, isValidPosition, IS_SAME_POSITION_OPTIONS_SCHEMA } from './position.js'

export function deduplicateRingPositions (ring, options = {}) {
  assert.that(options, (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS_SCHEMA), 'options must be a valid options object')
  const { precision = DEFAULT_COORDINATE_PRECISION, consider3D = false } = options
  const result = []
  for (const position of ring) {
    const previous = result[result.length - 1]
    if (!previous || !isSamePosition(position, previous, { precision, consider3D })) {
      result.push(position)
    }
  }
  return result
}

export function isClosedRing (ring, options = {}) {
  assert.that(options, (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS_SCHEMA), 'options must be a valid options object')
  if (!is.arrayOfLengthAtLeast(ring, 1)) return false
  const first = ring[0]
  const last = ring[ring.length - 1]
  return isSamePosition(first, last, options)
}

export function closeRing (ring, options = {}) {
  if (!is.nonEmptyArray(ring) || isClosedRing(ring, options)) return ring
  return [...ring, [...ring[0]]]
}

export function isValidRing (ring, options = {}) {
  if (!is.arrayOfLengthAtLeast(ring, 4)) return false
  if (!ring.every(isValidPosition)) return false
  return isClosedRing(ring, options)
}

export function sphericalRingArea (ring) {
  assert.that(ring, isValidRing, 'ring must be a valid closed ring of at least 4 positions')
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i]
    const [lon2, lat2] = ring[i + 1]
    sum += math.toRadians(lon2 - lon1) * (2 + Math.sin(math.toRadians(lat1)) + Math.sin(math.toRadians(lat2)))
  }
  return -sum / 2
}

export function isClockwiseRing (ring) {
  return sphericalRingArea(ring) < 0
}
