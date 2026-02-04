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

/**
 * Normalizes geographic coordinates to valid ranges and truncates to specified precision.
 *
 * @param {number} longitude - Longitude value to normalize
 * @param {number} latitude - Latitude value to normalize
 * @param {number} [precision=7] - Number of decimal places (0-8). Default: 7
 * - Precision levels correspond to approximate distances:
 *   - 0: ~111 km (country/region)
 *   - 1: ~11 km (large city)
 *   - 2: ~1.1 km (neighborhood)
 *   - 3: ~110 m (village)
 *   - 4: ~11 m (parcel/field)
 *   - 5: ~1.1 m (street/building)
 *   - 6: ~11 cm (GPS precision)
 *   - 7: ~1.1 cm (geodesy - default)
 *   - 8: ~1.1 mm (topography)
 *
 * @returns {{ longitude: number, latitude: number } | null}  Object with normalized and truncated `longitude` and `latitude` properties, or `null` if validation fails
 *
 * @example
 * // Normalize coordinates within valid ranges
 * normalizeCoordinates(2.3522, 48.8566, 5)
 * // { longitude: 2.3522, latitude: 48.8566 }
 *
 * @example
 * // Normalize longitude > 180
 * normalizeCoordinates(185, 48.8567, 2)
 * // { longitude: -175, latitude: 48.86 }
 *
 * @example
 * // Normalize latitude > 90 (crossing north pole)
 * normalizeCoordinates(10, 95, 2)
 * // { longitude: -170, latitude: 85 }
 *
 * @example
 * // Normalize latitude < -90 (crossing south pole)
 * normalizeCoordinates(10, -100, 2)
 * // { longitude: -170, latitude: -80 }
 *
 * @example
 * // Invalid input returns null
 * normalizeCoordinates('invalid', 48.8566)
 * // null
 *
 * @example
 * // Out of range precision returns null
 * normalizeCoordinates(2.3522, 48.8566, 10)
 * // null
 */
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
  longitude = normalizeLongitude(longitude)
  return truncateCoordinates(longitude, latitude, precision)
}
