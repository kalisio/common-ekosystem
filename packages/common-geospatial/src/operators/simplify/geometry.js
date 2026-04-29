import { assert } from '@kalisio/common-core'
import { GEOMETRY_TYPES, isLikeGeometry } from '../is-like'
import { simplify } from './visvalingam-whyatt.js'

export function simplifyGeometry (geometry, options) {
  assert.all([
    { value: geometry, validator: isLikeGeometry, message: 'geometry must be a GeoJson geometry' }
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
