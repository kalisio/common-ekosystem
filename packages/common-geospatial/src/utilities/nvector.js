import { math } from '@kalisio/common-core/utilities'

const DEG_TO_RAD = math.to.radians(1)
const ANGULAR_TOLERANCE = 1e-12

function fromPosition (position) {
  const lon = position[0] * DEG_TO_RAD
  const lat = position[1] * DEG_TO_RAD
  const cosLat = Math.cos(lat)
  return [cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat)]
}

function toPosition (vector) {
  const lon = Math.atan2(vector[1], vector[0])
  const lat = Math.asin(vector[2])
  return [lon / DEG_TO_RAD, lat / DEG_TO_RAD]
}

function dot (v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

function cross (v1, v2) {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ]
}

function add (v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]
}

function scale (vector, scalar) {
  return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar]
}

function norm (vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2])
}

function normalize (vector) {
  const length = norm(vector)
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function angleBetween (v1, v2) {
  return Math.atan2(norm(cross(v1, v2)), dot(v1, v2))
}

// Unit vector pointing north in the tangent plane at origin (origin x east).
function north (origin) {
  return cross(origin, east(origin))
}

// Unit vector pointing east in the tangent plane at origin.
function east (origin) {
  const pole = [0, 0, 1]
  return normalize(cross(pole, origin))
}

function south (origin) {
  return scale(north(origin), -1)
}

function west (origin) {
  return scale(east(origin), -1)
}

function bearing (origin, bearing) {
  const northVector = north(origin)
  const eastVector = east(origin)
  return add(
    scale(northVector, Math.cos(bearing)),
    scale(eastVector, Math.sin(bearing))
  )
}

function destination (origin, bearing, angularDistance) {
  const direction = nvector.bearing(origin, bearing)
  return add(
    scale(origin, Math.cos(angularDistance)),
    scale(direction, Math.sin(angularDistance))
  )
}

function crossArcs (v1, v2, v3, v4, tolerance = ANGULAR_TOLERANCE) {
  const n12 = cross(v1, v2)
  const n34 = cross(v3, v4)
  const length12 = norm(n12)
  const length34 = norm(n34)
  if (length12 <= tolerance || length34 <= tolerance) return false
  const s123 = math.sign(dot(n12, v3) / length12, tolerance)
  const s124 = math.sign(dot(n12, v4) / length12, tolerance)
  if (s123 * s124 !== -1) return false
  const s341 = math.sign(dot(n34, v1) / length34, tolerance)
  const s342 = math.sign(dot(n34, v2) / length34, tolerance)
  return s341 * s342 === -1
}

export const nvector = {
  fromPosition,
  toPosition,
  dot,
  cross,
  add,
  scale,
  norm,
  normalize,
  angleBetween,
  north,
  east,
  south,
  west,
  bearing,
  destination,
  crossArcs
}
