import {
  WGS84,
  extractGeoJsonCRS,
  fixGeoJson,
  isWGS84Projection,
  reprojectGeoJson,
  validateGeoJson
} from '@kalisio/common-geospatial'

export function parseGeoJson (text) {
  return JSON.parse(text)
}

export function processGeoJson (geoJson) {
  const crs = extractGeoJsonCRS(geoJson)
  const validation = validateGeoJson(geoJson)
  if (!validation.valid || isWGS84Projection(crs)) {
    return {
      sourceCrs: crs,
      outputCrs: crs,
      geoJson,
      validation
    }
  }
  const reprojected = structuredClone(geoJson)
  reprojectGeoJson(reprojected, WGS84)
  return {
    sourceCrs: crs,
    outputCrs: WGS84,
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
