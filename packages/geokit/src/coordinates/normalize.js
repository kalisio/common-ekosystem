import { is } from '@kalisio/check'
import { truncateCoordinates } from './truncate.js'

function normalizeLongitude (longitude) {
  if (longitude < -180 || longitude > 180) {
    longitude = longitude % 360
    if (longitude > 180) longitude -= 360
    else if (longitude < -180) longitude += 360
  }
  if (Object.is(longitude, -0)) longitude = 0
  return longitude
}

export function normalizeCoordinates (longitude, latitude, precision = 7) {
  if (!is.number(longitude) || !is.number(latitude)) {
    return null
  }
  if (!is.integer(precision) || !is.inRange(precision, 0, 8)) {
    return null
  }
  // Normalize latitude to [-90, 90]
  while (latitude < -90 || latitude > 90) {
    if (latitude > 90) {
      latitude = 180 - latitude
      longitude = normalizeLongitude(longitude + 180)
    } else if (latitude < -90) {
      latitude = -180 - latitude
      longitude = normalizeLongitude(longitude + 180)
    }
  }
  // Normalize longitude ONCE, at the end
  /* if (longitude < -180 || longitude > 180) {
    longitude = ((longitude + 180) % 360 + 360) % 360 - 180
  } */
  longitude = normalizeLongitude(longitude)
  return truncateCoordinates(longitude, latitude, precision)
}
