import { is } from '@kalisio/check'

export const GEOMETRY_TYPES = {
  POINT: 'Point',
  MULTI_POINT: 'MultiPoint',
  LINESTRING: 'LineString',
  MULTI_LINESTRING: 'MultiLineString',
  POLYGON: 'Polygon',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection'
}

export function isLikeGeometry (object) {
  if (!is.plainObject(object)) return false
  if (!is.oneOf(object.type, Object.values(GEOMETRY_TYPES))) return false
  if (object.type === GEOMETRY_TYPES.GEOMETRY_COLLECTION) {
    return is.array(object.geometries)
  }
  return is.array(object.coordinates)
}
