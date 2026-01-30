import { is } from '@kalisio/check'
import { normalizeCoordinates } from './normalize.js'

// DMS format (Degrees Minutes Seconds): 48°51'24"N 2°21'07"E
function isDMSFormat (pattern) {
  const DMSRegexp = /^(\d+)°\s*(\d+)'\s*(\d+(?:\.\d+)?)"\s*([NSEW])\s*[,\s]+\s*(\d+)°\s*(\d+)'\s*(\d+(?:\.\d+)?)"\s*([NSEW])$/i
  const match = pattern.match(DMSRegexp)
  if (!match) return null
  const [, deg1, min1, sec1, dir1, deg2, min2, sec2, dir2] = match
  // Convert DMS to DD
  const value1 = parseFloat(deg1) + parseFloat(min1) / 60 + parseFloat(sec1) / 3600
  const value2 = parseFloat(deg2) + parseFloat(min2) / 60 + parseFloat(sec2) / 3600
  const dir1Upper = dir1.toUpperCase()
  const dir2Upper = dir2.toUpperCase()
  let longitude, latitude
  if (dir1Upper === 'N' || dir1Upper === 'S') {
    latitude = dir1Upper === 'S' ? -value1 : value1
    longitude = dir2Upper === 'W' ? -value2 : value2
  } else {
    longitude = dir1Upper === 'W' ? -value1 : value1
    latitude = dir2Upper === 'S' ? -value2 : value2
  }
  return normalizeCoordinates(longitude, latitude)
}

// DDM format (Degrees Decimal Minutes): 48°51.4'N 2°21.12'E
function isDDMFormat (pattern) {
  const DDMRegexp = /^(\d+)°\s*(\d+(?:\.\d+)?)'\s*([NSEW])\s*[,\s]+\s*(\d+)°\s*(\d+(?:\.\d+)?)'\s*([NSEW])$/i
  const match = pattern.match(DDMRegexp)
  if (!match) return null
  const [, deg1, min1, dir1, deg2, min2, dir2] = match
  // Convert DDM to DD
  const value1 = parseFloat(deg1) + parseFloat(min1) / 60
  const value2 = parseFloat(deg2) + parseFloat(min2) / 60
  const dir1Upper = dir1.toUpperCase()
  const dir2Upper = dir2.toUpperCase()
  let longitude, latitude
  if (dir1Upper === 'N' || dir1Upper === 'S') {
    latitude = dir1Upper === 'S' ? -value1 : value1
    longitude = dir2Upper === 'W' ? -value2 : value2
  } else {
    longitude = dir1Upper === 'W' ? -value1 : value1
    latitude = dir2Upper === 'S' ? -value2 : value2
  }
  return normalizeCoordinates(longitude, latitude)
}

// DD with degree symbol and cardinal directions: 48.8566° N, 2.3522° E
function isDDWithCardinalDirectionAndDegreeSymbolFormat (pattern) {
  const DDWithSymbolRegexp = /^(\d+(?:\.\d+)?)°\s*([NSEW])\s*[,\s]+\s*(\d+(?:\.\d+)?)°\s*([NSEW])$/i
  const match = pattern.match(DDWithSymbolRegexp)
  if (!match) return null
  const [, value1, direction1, value2, direction2] = match
  const dir1Upper = direction1.toUpperCase()
  const dir2Upper = direction2.toUpperCase()
  let longitude, latitude
  if (dir1Upper === 'N' || dir1Upper === 'S') {
    latitude = parseFloat(value1)
    if (dir1Upper === 'S') latitude = -latitude
    longitude = parseFloat(value2)
    if (dir2Upper === 'W') longitude = -longitude
  } else {
    longitude = parseFloat(value1)
    if (dir1Upper === 'W') longitude = -longitude
    latitude = parseFloat(value2)
    if (dir2Upper === 'S') latitude = -latitude
  }
  return normalizeCoordinates(longitude, latitude)
}

// DD with cardinal directions but no degree symbol: 48.8566 N, 2.3522 E
function isDDWithCardinalDirectionFormat (pattern) {
  const DDWithoutSymbolRegexp = /^(\d+(?:\.\d+)?)\s*([NSEW])\s*[,\s]+\s*(\d+(?:\.\d+)?)\s*([NSEW])$/i
  const match = pattern.match(DDWithoutSymbolRegexp)
  if (!match) return null
  const [, value1, direction1, value2, direction2] = match
  const dir1Upper = direction1.toUpperCase()
  const dir2Upper = direction2.toUpperCase()
  let longitude, latitude
  if (dir1Upper === 'N' || dir1Upper === 'S') {
    latitude = parseFloat(value1)
    if (dir1Upper === 'S') latitude = -latitude
    longitude = parseFloat(value2)
    if (dir2Upper === 'W') longitude = -longitude
  } else {
    longitude = parseFloat(value1)
    if (dir1Upper === 'W') longitude = -longitude
    latitude = parseFloat(value2)
    if (dir2Upper === 'S') latitude = -latitude
  }
  return normalizeCoordinates(longitude, latitude)
}

// Simple DD format with negative values: -48.8566, 2.3522 or 48.8566, -2.3522
// Standard GeoJSON order: longitude, latitude (but often written as lat, lon)
// Try both interpretations based on value ranges
function isSimpleDDFormat (pattern) {
  const simpleRegexp = /^(-?\d+(?:\.\d+)?)\s*[,;\s]+\s*(-?\d+(?:\.\d+)?)$/
  const match = pattern.match(simpleRegexp)
  if (!match) return null
  const value1 = parseFloat(match[1])
  const value2 = parseFloat(match[2])
  let longitude, latitude
  // Heuristic: latitude must be between -90 and 90, longitude between -180 and 180
  // If first value is in latitude range but not typical longitude range, assume lat,lon order
  if (Math.abs(value1) <= 90 && Math.abs(value2) <= 180) {
  // Most common convention in text: latitude, longitude
    latitude = value1
    longitude = value2
  } else if (Math.abs(value2) <= 90 && Math.abs(value1) <= 180) {
    // Reverse order: longitude, latitude
    longitude = value1
    latitude = value2
  } else {
    // Invalid coordinates
    return null
  }
  return normalizeCoordinates(longitude, latitude)
}

const VALIDATORS = [
  isDMSFormat,
  isDDMFormat,
  isDDWithCardinalDirectionAndDegreeSymbolFormat,
  isDDWithCardinalDirectionFormat,
  isSimpleDDFormat
]

export function parseCoordinates (pattern) {
  if (!is.string(pattern)) {
    return null
  }
  // Remove optional parentheses, brackets and extra whitespace
  pattern = pattern.trim().replace(/^[([]|[)\]]$/g, '').trim()
  for (const validator of VALIDATORS) {
    const result = validator(pattern)
    if (result) return result
  }
}
