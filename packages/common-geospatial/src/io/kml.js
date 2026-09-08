import { kml } from '@tmcw/togeojson'
import { xml } from '@kalisio/common-core/io/xml'
import { validateGeoJson } from '../operators/index.js'

export async function readKml (source, options = {}) {
  const document = await xml.read(source, {
    ...options,
    output: 'dom'
  })
  const geojson = kml(document)
  return { geojson, ...validateGeoJson(geojson) }
}
