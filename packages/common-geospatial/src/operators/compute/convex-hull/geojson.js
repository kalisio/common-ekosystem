import { coordAll } from '@turf/meta'
import { assert, is } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../../is-like/index.js'
import { computeGeometryConvexHull } from './geometry.js'

function computeFeatureConvexHull (feature) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (!feature.geometry) return null
    return computeGeometryConvexHull(feature.geometry)
  }
  // FEATURE_COLLECTION
  const positions = coordAll(feature).map(p => [p[0], p[1]])
  if (positions.length === 0) return null
  return computeGeometryConvexHull({ type: GEOMETRY_TYPES.MULTI_POINT, coordinates: positions })
}

export function computeGeoJsonConvexHull (geoJson) {
  assert.that(geoJson, isLikeGeoJson, 'geoJson must be a GeoJson object')
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return computeGeometryConvexHull(geoJson)
  return computeFeatureConvexHull(geoJson)
}
