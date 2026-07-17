import { assert, is, conform } from '@kalisio/common-core/predicates'
import { math } from '@kalisio/common-core/utilities'
import { DEFAULT_COORDINATE_PRECISION } from './coordinate.js'
import { isSamePosition, isValidPosition, IS_SAME_POSITION_OPTIONS_SCHEMA } from './position.js'

export function deduplicatePositions (positions, options = {}) {
  assert.that(options, (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS_SCHEMA), 'options must be a valid options object')
  const { precision = DEFAULT_COORDINATE_PRECISION, consider3D = false } = options
  const result = []
  for (const position of positions) {
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

function toUnitVector ([lon, lat]) {
  const lonRad = math.toRadians(lon)
  const latRad = math.toRadians(lat)
  const cosLat = Math.cos(latRad)
  return [cosLat * Math.cos(lonRad), cosLat * Math.sin(lonRad), Math.sin(latRad)]
}

function cross (a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function dot (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function orientation (a, b, c) {
  return dot(cross(a, b), c)
}

function edgesCross (a, b, c, d) {
  return orientation(a, b, c) * orientation(a, b, d) < 0 &&
    orientation(c, d, a) * orientation(c, d, b) < 0
}

export function ringsIntersect (ring1, ring2) {
  assert.all([
    { value: ring1, validator: isValidRing, message: 'ring1 must be a valid closed ring' },
    { value: ring2, validator: isValidRing, message: 'ring2 must be a valid closed ring' }
  ])
  const points1 = ring1.map(toUnitVector)
  const points2 = ring2.map(toUnitVector)
  for (let i = 0; i < points1.length - 1; i++) {
    for (let j = 0; j < points2.length - 1; j++) {
      if (edgesCross(points1[i], points1[i + 1], points2[j], points2[j + 1])) {
        return true
      }
    }
  }
  return false
}

function edgesSharePosition (ring, i, j) {
  const a = ring[i]
  const b = ring[i + 1]
  const c = ring[j]
  const d = ring[j + 1]
  return isSamePosition(a, c) || isSamePosition(a, d) || isSamePosition(b, c) || isSamePosition(b, d)
}

export function ringSelfIntersections (ring) {
  assert.that(ring, isValidRing, 'ring must be a valid closed ring')
  const points = ring.map(toUnitVector)
  const pairs = []
  const edgeCount = points.length - 1
  for (let i = 0; i < edgeCount; i++) {
    for (let j = i + 1; j < edgeCount; j++) {
      // Skip adjacent edges: they share a vertex by construction. This includes
      // the wrap-around pair (first edge, last edge) which meet at the closing
      // position of the ring.
      if (j === i + 1) continue
      if (i === 0 && j === edgeCount - 1) continue
      // Skip any other edge pair that shares a vertex: touching edges do not
      // cross, and the orientation test is numerically unstable at a shared
      // vertex -- one orientation is mathematically zero but computes to signed
      // floating-point noise, which the strict < 0 test would misread as a
      // crossing. Non-adjacent edges only share a vertex when the ring carries a
      // duplicate position, a defect reported separately as DUPLICATE_POSITION.
      if (edgesSharePosition(ring, i, j)) continue
      if (edgesCross(points[i], points[i + 1], points[j], points[j + 1])) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}
