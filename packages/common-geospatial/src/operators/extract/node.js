import { assert, object } from '@kalisio/common-core'
import { isLikeGeoJson } from '../is-like.js'

export function extractGeoJsonNode (geoJson, path) {
  assert.that(geoJson, isLikeGeoJson, 'geoJson must be a GeoJson object')
  return object.lookup(geoJson, path)
}
