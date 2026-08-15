import { extractGeoJsonNode } from './node.js'

export function extractGeoJsonBBox (geoJson) {
  return extractGeoJsonNode(geoJson, 'bbox')
}
