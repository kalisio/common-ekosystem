import { assert, is, conform } from '@kalisio/common-core/predicates'
import { math } from '@kalisio/common-core/utilities'
import { isSamePosition, isValidPosition, IS_SAME_POSITION_OPTIONS_SCHEMA } from './position.js'
import { truncatePositions } from './positions.js'
import { positionToNVector, crossNVectorArcs } from './nvector.js'

export function isValidRing (ring, options = {}) {
  if (!is.arrayOfLengthAtLeast(ring, 4)) return false
  if (!ring.every(isValidPosition)) return false
  return isClosedRing(ring, options)
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

export function truncateRing (ring, options = {}) {
  const truncated = truncatePositions(ring, { deduplicate: true, ...options })
  return closeRing(truncated, options)
}

export function sphericalRingArea (ring) {
  assert.that(ring, isValidRing, 'ring must be a valid closed ring of at least 4 positions')
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i]
    const [lon2, lat2] = ring[i + 1]
    sum += math.to.radians(lon2 - lon1) * (2 + Math.sin(math.to.radians(lat1)) + Math.sin(math.to.radians(lat2)))
  }
  return -sum / 2
}

export function isClockwiseRing (ring) {
  return sphericalRingArea(ring) < 0
}

export function ringsIntersect (ring1, ring2) {
  assert.all([
    { value: ring1, validator: isValidRing, message: 'ring1 must be a valid closed ring' },
    { value: ring2, validator: isValidRing, message: 'ring2 must be a valid closed ring' }
  ])
  const points1 = ring1.map(positionToNVector)
  const points2 = ring2.map(positionToNVector)
  for (let i = 0; i < points1.length - 1; i++) {
    for (let j = 0; j < points2.length - 1; j++) {
      if (crossNVectorArcs(points1[i], points1[i + 1], points2[j], points2[j + 1])) {
        return true
      }
    }
  }
  return false
}

export function ringSelfIntersections (ring) {
  assert.that(ring, isValidRing, 'ring must be a valid closed ring')
  const points = ring.map(positionToNVector)
  const pairs = []
  const edgeCount = points.length - 1
  for (let i = 0; i < edgeCount; i++) {
    for (let j = i + 1; j < edgeCount; j++) {
      // Skip adjacent edges: they share a vertex by construction, including the
      // wrap-around pair (first edge, last edge) meeting at the closing vertex.
      // Any other shared vertex (a duplicate position) is handled by
      // crossNVectorArcs, whose angular tolerance absorbs the floating-point
      // noise at a coincident vertex -- no explicit shared-position guard needed.
      if (j === i + 1) continue
      if (i === 0 && j === edgeCount - 1) continue
      if (crossNVectorArcs(points[i], points[i + 1], points[j], points[j + 1])) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}
