import { gpx } from '@tmcw/togeojson'
import { xml } from '@kalisio/common-core/io'
import { validateGeoJson } from '../operators/index.js'

export async function readGpx (source, options = {}) {
  const document = await xml.read(source, options)
  const geojson = gpx(document)
  return { geojson, ...validateGeoJson(geojson) }
}
