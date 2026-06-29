import { truncate as turfTruncate } from '@turf/truncate'
import { assert, is } from '@kalisio/common-core'
import { truncateBBox } from '../foundation/index.js'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from './is-like.js'

function truncateGeometry (geometry, precision = 7) {
  const result = turfTruncate(geometry, { precision, mutate: true })
  if (result.bbox) truncateBBox(result.bbox, precision)
  return result
}

function truncateFeature (feature, precision) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) truncateGeometry(feature.geometry, precision)
  } else {
    for (const f of feature.features) truncateFeature(f, precision)
  }
  if (feature.bbox) truncateBBox(feature.bbox, precision)
  return feature
}

export function truncate (geoJson, precision = 7) {
  assert.all([
    { value: geoJson, validator: isLikeGeoJson, message: 'geoJson must be a valid GeoJson' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return truncateGeometry(geoJson, precision)
  return truncateFeature(geoJson, precision)
}
