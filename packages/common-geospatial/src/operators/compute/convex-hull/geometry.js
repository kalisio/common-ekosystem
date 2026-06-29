import { convex } from '@turf/convex'
import { coordAll } from '@turf/meta'
import { featureCollection, feature } from '@turf/helpers'
import { assert } from '@kalisio/common-core'
import { isLikeGeometry } from '../../is-like/index.js'

export function computeGeometryConvexHull (geometry) {
  assert.that(geometry, isLikeGeometry, 'geometry must be a Geometry object')
  const positions = coordAll(geometry).map(p => [p[0], p[1]])
  if (positions.length === 0) return null
  if (positions.length === 1) return { type: 'Point', coordinates: positions[0] }
  if (positions.length === 2) return { type: 'LineString', coordinates: [positions[0], positions[1]] }
  const result = convex(featureCollection(positions.map(p => feature({ type: 'Point', coordinates: p }))))
  if (!result) return { type: 'LineString', coordinates: [positions[0], positions[positions.length - 1]] }
  return result.geometry
}
