import { getLogger } from '@logtape/logtape'
import { assert, is } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../is-like'
import { simplifyGeometry } from './geometry.js'

const logger = getLogger(['common-ekosystem', 'simplify', 'geojson'])

function simplifyFeature (feature, options) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) simplifyGeometry(feature.geometry, options)
  } else if (feature.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    for (const feat of feature.features) simplifyFeature(feat, options)
  } else {
    logger.warn('Unknown feature type "{type}", skipping.', { type: feature.type })
  }
  return feature
}

export function simplifyGeoJson (geoJson, options) {
  assert.all([
    { value: geoJson, validator: isLikeGeoJson, message: 'geoJson must be a GeoJson object' }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return simplifyGeometry(geoJson, options)
  return simplifyFeature(geoJson, options)
}
