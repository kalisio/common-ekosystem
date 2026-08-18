import {
  WGS84,
  fixGeoJson,
  isWGS84Projection,
  reprojectGeoJson,
  validateGeoJson
} from '@kalisio/common-geospatial'

export function parseGeoJson (text) {
  return JSON.parse(text)
}

export function processGeoJson (geoJson) {
  const validation = validateGeoJson(geoJson)
  if (!validation.valid) {
    return {
      geoJson,
      validation
    }
  }
  const sourceCrs = validation.crs
  if (isWGS84Projection(sourceCrs)) {
    return {
      sourceCrs,
      geoJson,
      validation
    }
  }
  const reprojected = structuredClone(geoJson)
  reprojectGeoJson(reprojected, WGS84)
  return {
    sourceCrs,
    geoJson: reprojected,
    validation: validateGeoJson(reprojected)
  }
}

export function fix (geoJson, validation) {
  return fixGeoJson(geoJson, { validation })
}

export function serializeGeoJson (geoJson) {
  return JSON.stringify(geoJson, null, 2)
}
