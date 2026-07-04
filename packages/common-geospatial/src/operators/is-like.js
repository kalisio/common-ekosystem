import { is } from '@kalisio/common-core'

export const CRS_TYPES = {
  NAME: 'name',
  LINK: 'link'
}

export const GEOMETRY_TYPES = {
  POINT: 'Point',
  MULTI_POINT: 'MultiPoint',
  LINESTRING: 'LineString',
  MULTI_LINESTRING: 'MultiLineString',
  POLYGON: 'Polygon',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection'
}

export const FEATURE_TYPES = {
  FEATURE: 'Feature',
  FEATURE_COLLECTION: 'FeatureCollection'
}

export function isLikeCRS (object) {
  if (!is.plainObject(object)) return false
  if (object.type === CRS_TYPES.NAME) {
    return is.nonEmptyString(object.properties?.name)
  }
  if (object.type === CRS_TYPES.LINK) {
    return is.nonEmptyString(object.properties?.href)
  }
  return false
}

export function isLikePosition (object) {
  if (!is.arrayOfLengthBetween(object, 2, 3)) return false
  return object.every(is.number)
}

export function isLikeBBox (object) {
  if (!is.arrayOfLength(object, 4) && !is.arrayOfLength(object, 6)) return false
  return object.every(is.number)
}

export function isLikeGeometry (object) {
  if (!is.plainObject(object)) return false
  if (!is.oneOf(object.type, Object.values(GEOMETRY_TYPES))) return false
  if (object.type === GEOMETRY_TYPES.GEOMETRY_COLLECTION) {
    return is.array(object.geometries)
  }
  return is.array(object.coordinates)
}

export function isLikeFeature (object) {
  return is.plainObject(object) &&
    object.type === FEATURE_TYPES.FEATURE
}

export function isLikeFeatureCollection (object) {
  return is.plainObject(object) &&
    object.type === FEATURE_TYPES.FEATURE_COLLECTION &&
    is.array(object.features)
}

export function isLikeFeatureOrFeatureCollection (object) {
  return isLikeFeature(object) || isLikeFeatureCollection(object)
}

export function isLikeGeoJson (object) {
  return isLikeFeatureOrFeatureCollection(object) || isLikeGeometry(object)
}
