import { is } from '@kalisio/common-core'
import { WGS84, normalizeCrsName } from '../../foundation/index.js'
import { extractGeoJsonNode } from './node.js'

export function extractGeoJsonCRS (geoJson) {
  const crs = extractGeoJsonNode(geoJson, 'crs')
  if (!is.defined(crs)) return WGS84
  const name = crs.properties?.name
  return is.nonEmptyString(name) ? normalizeCrsName(name) : name
}
