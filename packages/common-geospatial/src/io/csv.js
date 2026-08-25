import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { csv } from '@kalisio/common-core/io'
import { validateGeoJson } from '../operators/validate/geojson.js'

const READ_OPTIONS_SCHEMA = {
  coordinates: optional({
    longitude: is.nonEmptyString,
    latitude: is.nonEmptyString
  }),
  preserveCoordinates: optional(is.boolean)
}

export async function readCsv (source, options = {}) {
  assert.that(options, (v) => conform.schema(v, READ_OPTIONS_SCHEMA), 'options must be a valid options object')
  const {
    coordinates = {
      longitude: 'longitude',
      latitude: 'latitude'
    },
    preserveCoordinates = true,
    ...csvOptions
  } = options
  const result = await csv.read(source, {
    ...csvOptions,
    header: true,
    skipEmptyLines: true
  })
  const { longitude, latitude } = coordinates
  const geojson = {
    type: 'FeatureCollection',
    features: result.data.map((row) => {
      const properties = { ...row }
      if (!preserveCoordinates) {
        delete properties[longitude]
        delete properties[latitude]
      }
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            Number(row[longitude]),
            Number(row[latitude])
          ]
        },
        properties
      }
    })
  }
  return { geojson, ...validateGeoJson(geojson) }
}
