import { asserts, is } from '@kalisio/check'
import { convertCoordinateFromSexagesimal } from './convert.js'
import { normalizeCoordinates } from './normalize.js'

export function guessCoordinateType (coordinate, dir) {
  // Explicit cases
  const direction = dir ? dir.toUpperCase() : undefined
  if (direction === 'N' || direction === 'S') return 'lat'
  if (direction === 'E' || direction === 'W') return 'lon'
  // Out of lat range → must be lon
  if (Math.abs(coordinate) > 90) return 'lon'
  // Ambiguous case: could be either lat or lon
  return ['lat', 'lon']
}

export function parseCoordinate (pattern) {
  asserts.that(pattern, (v) => is.string(v), 'input must be a string')
  const input = pattern.trim()
  // DMS: 48°30'36"N | 48 30 36 N | 48°30'36.5"
  const dmsRegex = /^(-?\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSEWnsew]?)$/
  const dmsMatch = input.match(dmsRegex)
  if (dmsMatch) {
    const deg = parseFloat(dmsMatch[1])
    const min = parseFloat(dmsMatch[2])
    const sec = parseFloat(dmsMatch[3])
    const dir = dmsMatch[4] || undefined
    const value = convertCoordinateFromSexagesimal(deg, min, sec, dir)
    return {
      value,
      format: 'DMS',
      type: guessCoordinateType(value, dir)
    }
  }
  // DM: 48°30'N | 48 30 N | 48°30.5'
  const dmRegex = /^(-?\d+)[°\s]+(\d+(?:\.\d+)?)['\s]*([NSEWnsew]?)$/
  const dmMatch = input.match(dmRegex)
  if (dmMatch) {
    const deg = parseFloat(dmMatch[1])
    const min = parseFloat(dmMatch[2])
    const dir = dmMatch[3] || undefined
    const value = convertCoordinateFromSexagesimal(deg, min, 0, dir)
    return {
      value,
      format: 'DM',
      type: guessCoordinateType(value, dir)
    }
  }
  // DD: 48.8566 | 48.8566N | -2.3522
  const ddRegex = /^(-?\d+(?:\.\d+)?)\s*([NSEWnsew]?)$/
  const ddMatch = input.match(ddRegex)
  if (ddMatch) {
    const deg = parseFloat(ddMatch[1])
    const dir = ddMatch[2] || undefined
    const value = convertCoordinateFromSexagesimal(deg, 0, 0, dir)
    return {
      value,
      format: 'DD',
      type: guessCoordinateType(value, dir)
    }
  }
  return null
}

export function parseCoordinates (pattern) {
  asserts.that(pattern, (v) => is.string(v), 'pattern must be a string')
  const parts = pattern.split(/[,;|]/)
  if (parts.length !== 2) {
    return null
  }
  // Parse each parts
  const [first, second] = parts.map(parseCoordinate)
  // Both parts should have the same format
  if (first.format !== second.format) {
    return null
  }
  // If both types are explicit
  if (first.type === 'lon' && second.type === 'lat') {
    return normalizeCoordinates(first.value, second.value)
  }
  if (first.type === 'lat' && second.type === 'lon') {
    return normalizeCoordinates(second.value, first.value)
  }
  // If one is explicit, the other is ambiguous
  if (first.type === 'lon' && Array.isArray(second.type)) {
    return normalizeCoordinates(first.value, second.value)
  }
  if (first.type === 'lat' && Array.isArray(second.type)) {
    return normalizeCoordinates(second.value, first.value)
  }
  if (second.type === 'lon' && Array.isArray(first.type)) {
    return normalizeCoordinates(second.value, first.value)
  }
  if (second.type === 'lat' && Array.isArray(first.type)) {
    return normalizeCoordinates(first.value, second.value)
  }
  // If both are ambiguous → assume [lat, lon] order by convention
  if (Array.isArray(first.type) && Array.isArray(second.type)) {
    return [
      normalizeCoordinates(first.value, second.value),
      normalizeCoordinates(second.value, first.value)
    ]
  }
  return null
}
