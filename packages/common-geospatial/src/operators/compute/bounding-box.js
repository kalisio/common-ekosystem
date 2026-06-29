import { coordAll } from '@turf/meta'
import { assert, is, optional, conform } from '@kalisio/common-core'
import { FEATURE_TYPES, isLikeGeoJson } from '../is-like.js'
import { computeBBox } from '../../../src/foundation/index.js'

const BOUNDING_BOX_OPTIONS_SCHEMA = {
  ignore3D: optional(is.boolean)
}

export function computeGeoJsonBoundingBox (geoJson, options = {}) {
  assert.all([
    { value: geoJson, validator: isLikeGeoJson, message: 'geoJson must be a GeoJson object' },
    { value: options, validator: (v) => conform.schema(v, BOUNDING_BOX_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
  ])
  if (geoJson.type === FEATURE_TYPES.FEATURE) {
    if (!geoJson.geometry) return null
    return computeBBox(coordAll(geoJson.geometry), options)
  }
  if (geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    const positions = coordAll(geoJson)
    if (!positions.length) return null
    return computeBBox(positions, options)
  }
  // Geometry
  return computeBBox(coordAll(geoJson), options)
}
