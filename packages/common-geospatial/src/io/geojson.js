import { json } from '@kalisio/common-core/io'
import { validateGeoJson } from '../operators/index.js'

export async function readGeoJson (source, options = {}) {
  const geojson = await json.read(source, options)
  return { geojson, ...validateGeoJson(geojson) }
}
