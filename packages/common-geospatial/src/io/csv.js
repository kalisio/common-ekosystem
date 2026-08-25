import { assert, conform, is, optional } from '@kalisio/common-core/predicates'
import { csv } from '@kalisio/common-core/io'
import { validateGeoJson } from '../operators/validate/geojson.js'

const COORDINATES_SCHEMA = {
  longitude: is.nonEmptyString,
  latitude: is.nonEmptyString
}

const READ_OPTIONS_SCHEMA = {
  header: optional((value) =>
    value === true ||
    (
      is.nonEmptyArray(value) &&
      value.every(is.nonEmptyString) &&
      new Set(value).size === value.length
    )
  ),
  parser: optional(is.plainObject),
  rowSchema: optional(is.plainObject),
  coordinates: optional((value) => conform.schema(value, COORDINATES_SCHEMA)),
  preserveCoordinates: optional(is.boolean)
}

export async function readCsv (source, options = {}) {
  assert.that(
    options,
    (value) => conform.schema(value, READ_OPTIONS_SCHEMA),
    'options must be a valid options object'
  )
  const {
    header = true,
    parser = {},
    rowSchema,
    coordinates = {
      longitude: 'longitude',
      latitude: 'latitude'
    },
    preserveCoordinates = true
  } = options
  const { longitude, latitude } = coordinates
  const coordinateSchema = {
    type: 'object',
    properties: {
      [longitude]: { type: 'number' },
      [latitude]: { type: 'number' }
    },
    required: [longitude, latitude]
  }
  const effectiveSchema = rowSchema
    ? {
        allOf: [
          coordinateSchema,
          rowSchema
        ]
      }
    : coordinateSchema
  const {
    data,
    parseErrors,
    parseMeta,
    validationErrors
  } = await csv.read(source, {
    header,
    parser,
    rowSchema: effectiveSchema
  })
  const geojson = {
    type: 'FeatureCollection',
    features: data.map((row) => {
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
            row[longitude],
            row[latitude]
          ]
        },
        properties
      }
    })
  }
  return {
    geojson,
    parseErrors,
    parseMeta,
    validationErrors,
    ...validateGeoJson(geojson)
  }
}
