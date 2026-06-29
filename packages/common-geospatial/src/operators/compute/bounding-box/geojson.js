import { coordAll } from '@turf/meta'
import { assert, is, conform } from '@kalisio/common-core'
import { computeBBox } from '../../../foundation/index.js'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../../is-like/index.js'
import { BOUNDING_BOX_OPTIONS_SCHEMA, computeGeometryBoundingBox } from './geometry.js'

function computeFeatureBoundingBox (feature, options) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (!feature.geometry) return null
    return computeGeometryBoundingBox(feature.geometry, options)
  }
  // FEATURE_COLLECTION
  const positions = coordAll(feature)
  if (!positions.length) return null
  return computeBBox(positions, options)
}

export function computeGeoJsonBoundingBox (geoJson, options = {}) {
  assert.all([
    {
      value: geoJson,
      validator: isLikeGeoJson,
      message: 'geoJson must be a GeoJson object'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, BOUNDING_BOX_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return computeGeometryBoundingBox(geoJson, options)
  return computeFeatureBoundingBox(geoJson, options)
}
