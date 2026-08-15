import { is } from '@kalisio/common-core'
import { WGS84 } from '../../foundation/index.js'
import { extractNode } from './node.js'

// EPSG URN designations are normalised to their short EPSG:<code> form.
const EPSG_URN = /^urn:ogc:def:crs:EPSG::(\d+)$/i

// Extract the CRS name declared by the GeoJSON, applying the former resolveCrs
// logic: fall back to WGS84 when no crs member is defined, normalise the EPSG
// URN form to its short EPSG:<code> designation, and otherwise return
// crs.properties?.name as-is (which may be undefined when the member is malformed).
export function extractCrs (geoJson) {
  const crs = extractNode(geoJson, 'crs')
  if (!is.defined(crs)) return WGS84
  const name = crs.properties?.name
  const match = name?.match(EPSG_URN)
  return match ? `EPSG:${match[1]}` : name
}
