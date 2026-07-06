import { assert, is } from '@kalisio/common-core'
import { truncateBBox } from '../foundation/index.js'
import { truncatePosition, isSamePosition } from '../foundation/position.js'
import { DEFAULT_COORDINATE_PRECISION, MAX_COORDINATE_PRECISION } from '../foundation/coordinate.js'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from './is-like.js'

// Truncate every position of a ring, then drop positions that collapsed onto their
// predecessor after rounding (S2/MongoDB rejects duplicate consecutive positions).
// Re-close the ring if the closing point was among those dropped.
function truncateRing (ring, precision, consider3D) {
  const result = []
  for (const position of ring) {
    truncatePosition(position, precision)
    const previous = result[result.length - 1]
    if (!previous || !isSamePosition(position, previous, { precision, consider3D })) {
      result.push(position)
    }
  }
  const first = result[0]
  const last = result[result.length - 1]
  if (first && last && !isSamePosition(first, last, { precision, consider3D })) {
    result.push([...first])
  }
  return result
}

function truncateLine (line, precision) {
  for (const position of line) truncatePosition(position, precision)
  return line
}

function truncateGeometry (geometry, precision, consider3D) {
  switch (geometry.type) {
    case GEOMETRY_TYPES.POINT:
      truncatePosition(geometry.coordinates, precision)
      break
    case GEOMETRY_TYPES.MULTI_POINT:
    case GEOMETRY_TYPES.LINESTRING:
      truncateLine(geometry.coordinates, precision)
      break
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      for (const line of geometry.coordinates) truncateLine(line, precision)
      break
    case GEOMETRY_TYPES.POLYGON:
      geometry.coordinates = geometry.coordinates.map((ring) => truncateRing(ring, precision, consider3D))
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      geometry.coordinates = geometry.coordinates.map((polygon) =>
        polygon.map((ring) => truncateRing(ring, precision, consider3D))
      )
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      for (const g of geometry.geometries) truncateGeometry(g, precision, consider3D)
      break
  }
  if (geometry.bbox) truncateBBox(geometry.bbox, precision)
  return geometry
}

function truncateFeature (feature, precision, consider3D) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) truncateGeometry(feature.geometry, precision, consider3D)
  } else {
    for (const f of feature.features) truncateFeature(f, precision, consider3D)
  }
  if (feature.bbox) truncateBBox(feature.bbox, precision)
  return feature
}

export function truncateGeoJson (geoJson, options = {}) {
  const { precision = DEFAULT_COORDINATE_PRECISION, consider3D = false } = options
  assert.all([
    {
      value: geoJson,
      validator: isLikeGeoJson,
      message: 'geoJson must be a valid GeoJson'
    },
    {
      value: precision,
      validator: (v) => is.inRange(v, 0, MAX_COORDINATE_PRECISION),
      message: `precision must be in range [0, ${MAX_COORDINATE_PRECISION}]`
    }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return truncateGeometry(geoJson, precision, consider3D)
  return truncateFeature(geoJson, precision, consider3D)
}
