import { convex } from '@turf/convex'
import { coordAll } from '@turf/meta'
import { featureCollection, feature } from '@turf/helpers'
import { assert } from '@kalisio/common-core'
import { FEATURE_TYPES, isLikeGeoJson } from '../is-like/index.js'

function computeConvexHullFromPositions (positions) {
  if (positions.length === 0) return null
  if (positions.length === 1) return { type: 'Point', coordinates: positions[0] }
  if (positions.length === 2) return { type: 'LineString', coordinates: [positions[0], positions[1]] }
  const result = convex(featureCollection(positions.map(p => feature({ type: 'Point', coordinates: p }))))
  if (!result) return { type: 'LineString', coordinates: [positions[0], positions[positions.length - 1]] }
  return result.geometry
}

export function computeConvexHull (geoJson) {
  assert.that(geoJson, isLikeGeoJson, 'geoJson must be a GeoJson object')
  if (geoJson.type === FEATURE_TYPES.FEATURE) {
    if (!geoJson.geometry) return null
    return computeConvexHull(geoJson.geometry)
  }
  const positions = coordAll(geoJson).map(p => [p[0], p[1]])
  return computeConvexHullFromPositions(positions)
}
