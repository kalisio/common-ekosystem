import { assert, is, conform } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from '../is-like'
import { SIMPLIFY_OPTIONS_SCHEMA, simplifyGeometry } from './geometry.js'

function simplifyFeature (feature, options) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) simplifyGeometry(feature.geometry, options)
  } else if (feature.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    for (const feat of feature.features) simplifyFeature(feat, options)
  }
  return feature
}

export function simplifyGeoJson (geoJson, options) {
  assert.all([
    {
      value: geoJson,
      validator: isLikeGeoJson,
      message: 'geoJson must be a GeoJson object'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, SIMPLIFY_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return simplifyGeometry(geoJson, options)
  return simplifyFeature(geoJson, options)
}
