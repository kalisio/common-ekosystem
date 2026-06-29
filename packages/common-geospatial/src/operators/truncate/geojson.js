import { assert, is } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../is-like'
import { truncateBBox } from './bbox.js'
import { truncateGeometry } from './geometry.js'

function truncateFeature (feature, precision) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) truncateGeometry(feature.geometry, precision)
  } else {
    for (const f of feature.features) truncateFeature(f, precision)
  }
  if (feature.bbox) truncateBBox(feature.bbox, precision)
  return feature
}

export function truncateGeoJson (geoJson, precision = 7) {
  assert.all([
    { value: geoJson, validator: isLikeGeoJson, message: 'geoJson must be a valid GeoJson' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return truncateGeometry(geoJson, precision)
  return truncateFeature(geoJson, precision)
}
