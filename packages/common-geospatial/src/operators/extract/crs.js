import { is } from '@kalisio/common-core'
import { WGS84 } from '../../foundation/index.js'
import { extractGeoJsonNode } from './node.js'

const EPSG_URN_PATTERN = /^urn:ogc:def:crs:EPSG::(\d+)$/i

export function extractGeoJsonCRS (geoJson) {
  const crs = extractGeoJsonNode(geoJson, 'crs')
  if (!is.defined(crs)) return WGS84
  const name = crs.properties?.name
  const match = name?.match(EPSG_URN_PATTERN)
  return match ? `EPSG:${match[1]}` : name
}
