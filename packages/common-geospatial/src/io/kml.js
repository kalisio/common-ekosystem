import { kml } from '@tmcw/togeojson'
import { xml } from '@kalisio/common-core/io'
import { validateGeoJson } from '../operators/validate/geojson.js'

export async function readKml (source, options = {}) {
  const document = await xml.read(source, options)
  const geojson = kml(document)
  return { geojson, ...validateGeoJson(geojson) }
}
