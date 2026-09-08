import { gpx } from '@tmcw/togeojson'
import { xml } from '@kalisio/common-core/io/xml'
import { validateGeoJson } from '../operators/index.js'

export async function readGpx (source, options = {}) {
  const document = await xml.read(source, {
    ...options,
    output: 'dom'
  })
  const geojson = gpx(document)
  return { geojson, ...validateGeoJson(geojson) }
}
