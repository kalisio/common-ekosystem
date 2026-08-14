import { validateGeoJson, fixGeoJson } from '@kalisio/common-geospatial'

export function parseGeoJson (text) {
  return JSON.parse(text)
}

export function validate (geoJson) {
  return validateGeoJson(geoJson)
}

export function fix (geoJson, validation) {
  return fixGeoJson(geoJson, { validation })
}

export function serializeGeoJson (geoJson) {
  return JSON.stringify(geoJson, null, 2)
}
