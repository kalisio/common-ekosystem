import { extractNode } from './node.js'

export function extractBBox (geoJson) {
  return extractNode(geoJson, 'bbox')
}
