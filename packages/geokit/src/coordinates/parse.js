import { is } from '@kalisio/check'
import { normalizeCoordinates } from './normalize'

export function parseCoordinates (pattern) {
  if (!is.string(pattern)) {
    return null
  }
  // Remove optional parentheses or brackets
  pattern = pattern.trim().replace(/^[([]|[)\]]$/g, '')

  let longitude, latitude

  // 1. DMS format (Degrees Minutes Seconds): 48°51'24"N 2°21'07"E
  const DMSRegexp = /(\d+)°\s*(\d+)'\s*(\d+(?:\.\d+)?)"\s*([NSEW])[,\s]+(\d+)°\s*(\d+)'\s*(\d+(?:\.\d+)?)"\s*([NSEW])/
  let match = pattern.match(DMSRegexp)
  if (match) {
    const [, deg1, min1, sec1, dir1, deg2, min2, sec2, dir2] = match
    // Convert DMS to DD
    const value1 = parseFloat(deg1) + parseFloat(min1) / 60 + parseFloat(sec1) / 3600
    const value2 = parseFloat(deg2) + parseFloat(min2) / 60 + parseFloat(sec2) / 3600
    if (dir1 === 'N' || dir1 === 'S') {
      latitude = dir1 === 'S' ? -value1 : value1
      longitude = dir2 === 'W' ? -value2 : value2
    } else {
      longitude = dir1 === 'W' ? -value1 : value1
      latitude = dir2 === 'S' ? -value2 : value2
    }
    return normalizeCoordinates(longitude, latitude)
  }

  // 2. DDM format (Degrees Decimal Minutes): 48°51.4'N 2°21.12'E
  const DDMRegexp = /(\d+)°\s*(\d+(?:\.\d+)?)'\s*([NSEW])[,\s]+(\d+)°\s*(\d+(?:\.\d+)?)'\s*([NSEW])/
  match = pattern.match(DDMRegexp)
  if (match) {
    const [, deg1, min1, dir1, deg2, min2, dir2] = match
    // Convert DDM to DD
    const value1 = parseFloat(deg1) + parseFloat(min1) / 60
    const value2 = parseFloat(deg2) + parseFloat(min2) / 60
    if (dir1 === 'N' || dir1 === 'S') {
      latitude = dir1 === 'S' ? -value1 : value1
      longitude = dir2 === 'W' ? -value2 : value2
    } else {
      longitude = dir1 === 'W' ? -value1 : value1
      latitude = dir2 === 'S' ? -value2 : value2
    }
    return normalizeCoordinates(longitude, latitude)
  }

  // 3. DD with degree symbol: 48.8566° N, 2.3522° E
  const DDWithSymbolRegexp = /(-?\d+(?:\.\d+)?)°\s*([NSEW])\s*,?\s*(-?\d+(?:\.\d+)?)°\s*([NSEW])/
  match = pattern.match(DDWithSymbolRegexp)
  if (match) {
    const [, value1, direction1, value2, direction2] = match
    if (direction1 === 'N' || direction1 === 'S') {
      latitude = parseFloat(value1)
      if (direction1 === 'S') latitude = -latitude
      longitude = parseFloat(value2)
      if (direction2 === 'W') longitude = -longitude
    } else {
      longitude = parseFloat(value1)
      if (direction1 === 'W') longitude = -longitude
      latitude = parseFloat(value2)
      if (direction2 === 'S') latitude = -latitude
    }
    return normalizeCoordinates(longitude, latitude)
  }

  // 4. DD without degree symbol: 48.8566 N, 2.3522 E
  const DDWithoutSymbolRegexp = /(-?\d+(?:\.\d+)?)\s*([NSEW])\s*,?\s*(-?\d+(?:\.\d+)?)\s*([NSEW])/
  match = pattern.match(DDWithoutSymbolRegexp)
  if (match) {
    const [, value1, direction1, value2, direction2] = match
    if (direction1 === 'N' || direction1 === 'S') {
      latitude = parseFloat(value1)
      if (direction1 === 'S') latitude = -latitude
      longitude = parseFloat(value2)
      if (direction2 === 'W') longitude = -longitude
    } else {
      longitude = parseFloat(value1)
      if (direction1 === 'W') longitude = -longitude
      latitude = parseFloat(value2)
      if (direction2 === 'S') latitude = -latitude
    }
    return normalizeCoordinates(longitude, latitude)
  }

  // 5. Simple format in standard order: latitude, longitude (e.g., "48.8566, 2.3522")
  const simpleRegexp = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/
  match = pattern.match(simpleRegexp)
  if (match) {
    longitude = parseFloat(match[2])
    latitude = parseFloat(match[1])
    return normalizeCoordinates(longitude, latitude)
  }

  // No match found
  return null
}
