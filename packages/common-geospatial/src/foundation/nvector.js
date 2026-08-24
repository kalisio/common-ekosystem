import { math } from '@kalisio/common-core/utilities'

const DEG_TO_RAD = math.to.radians(1)

const ANGULAR_TOLERANCE = 1e-12

export function positionToNVector (position) {
  const lon = position[0] * DEG_TO_RAD
  const lat = position[1] * DEG_TO_RAD
  const cosLat = Math.cos(lat)
  return [cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat)]
}

export function nVectorToPosition (vector) {
  const lon = Math.atan2(vector[1], vector[0])
  const lat = Math.asin(vector[2])
  return [lon / DEG_TO_RAD, lat / DEG_TO_RAD]
}

export function dotNVectors (v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

export function crossNVectors (v1, v2) {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ]
}

export function addNVectors (v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]
}

export function scaleNVector (vector, scalar) {
  return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar]
}

export function getNVectorNorm (vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2])
}

export function normalizeNVector (vector) {
  const norm = getNVectorNorm(vector)
  return [vector[0] / norm, vector[1] / norm, vector[2] / norm]
}

export function angleBetweenNVectors (v1, v2) {
  return Math.atan2(getNVectorNorm(crossNVectors(v1, v2)), dotNVectors(v1, v2))
}

// Unit vector pointing north in the tangent plane at origin (origin x east).
export function northNVector (origin) {
  return crossNVectors(origin, eastNVector(origin))
}

// Unit vector pointing east in the tangent plane at origin.
export function eastNVector (origin) {
  const pole = [0, 0, 1]
  return normalizeNVector(crossNVectors(pole, origin))
}

export function southNVector (origin) {
  return scaleNVector(northNVector(origin), -1)
}

export function westNVector (origin) {
  return scaleNVector(eastNVector(origin), -1)
}

export function bearingNVector (origin, bearing) {
  const north = northNVector(origin)
  const east = eastNVector(origin)
  return addNVectors(
    scaleNVector(north, Math.cos(bearing)),
    scaleNVector(east, Math.sin(bearing))
  )
}

export function destinationNVector (origin, bearing, angularDistance) {
  const direction = bearingNVector(origin, bearing)
  return addNVectors(
    scaleNVector(origin, Math.cos(angularDistance)),
    scaleNVector(direction, Math.sin(angularDistance))
  )
}

export function crossNVectorArcs (v1, v2, v3, v4, tolerance = ANGULAR_TOLERANCE) {
  const n12 = crossNVectors(v1, v2)
  const n34 = crossNVectors(v3, v4)
  const length12 = getNVectorNorm(n12)
  const length34 = getNVectorNorm(n34)
  if (length12 <= tolerance || length34 <= tolerance) return false
  const s123 = math.sign(dotNVectors(n12, v3) / length12, tolerance)
  const s124 = math.sign(dotNVectors(n12, v4) / length12, tolerance)
  if (s123 * s124 !== -1) return false
  const s341 = math.sign(dotNVectors(n34, v1) / length34, tolerance)
  const s342 = math.sign(dotNVectors(n34, v2) / length34, tolerance)
  return s341 * s342 === -1
}
