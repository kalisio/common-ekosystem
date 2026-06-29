import { assert, is, optional, conform } from '@kalisio/common-core'
import { GEOMETRY_TYPES, isLikeGeometry } from '../is-like'
import { simplify } from './visvalingam-whyatt.js'

export const SIMPLIFY_OPTIONS_SCHEMA = {
  tolerance: optional(is.number),
  getWeight: optional(is.function)
}

export function simplifyGeometry (geometry, options) {
  assert.all([
    {
      value: geometry,
      validator: isLikeGeometry,
      message: 'geometry must be a GeoJson geometry'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, SIMPLIFY_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  switch (geometry.type) {
    case GEOMETRY_TYPES.LINESTRING:
      geometry.coordinates = simplify(geometry.coordinates, options)
      break
    case GEOMETRY_TYPES.POLYGON:
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      geometry.coordinates = geometry.coordinates.map(ring => simplify(ring, options))
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      geometry.coordinates = geometry.coordinates.map(poly => poly.map(ring => simplify(ring, options)))
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      geometry.geometries.forEach(g => simplifyGeometry(g, options))
      break
  }
  return geometry
}
