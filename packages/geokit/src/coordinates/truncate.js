import { asserts, is } from '@kalisio/check'

// Precompute factors to speedup processing
const FACTORS = Array.from({ length: 9 }, (_, i) => 10 ** i)

/**
 * Truncates geographic coordinates to a specified decimal precision.
 *
 * @param {number} longitude - Longitude value to truncate
 * @param {number} latitude - Latitude value to truncate
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
 * @returns {{ longitude: number, latitude: number } | null} Object with `longitude` and `latitude` properties rounded to specified precision, or `null` if validation fails
 *
 * @example
 * // Truncate to default precision (7 decimal places)
 * truncateCoordinates(2.35222229876, 48.85666669432)
 * // { longitude: 2.3522223, latitude: 48.8566667 }
 *
 * @example
 * // Truncate to neighborhood level (2 decimal places)
 * truncateCoordinates(2.35222229876, 48.85666669432, 2)
 * // { longitude: 2.35, latitude: 48.86 }
 *
 * @example
 * // Truncate to GPS precision (6 decimal places)
 * truncateCoordinates(-74.0060, 40.7128, 6)
 * // { longitude: -74.006, latitude: 40.7128 }
 *
 * @example
 * // Invalid input returns null
 * truncateCoordinates('invalid', 48.8566)
 * // null
 *
 * @example
 * // Out of range precision returns null
 * truncateCoordinates(2.3522, 48.8566, 10)
 * // null
 */
export function truncateCoordinates (longitude, latitude, precision = 7) {
  asserts.all([
    { value: longitude, validator: is.number, message: 'longitude must be a number' },
    { value: latitude, validator: is.number, message: 'latitude must be a number' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = FACTORS[precision]
  return {
    longitude: Math.round(longitude * factor) / factor,
    latitude: Math.round(latitude * factor) / factor
  }
}

/* export function truncateCoordinates (coordinates, precision = 7) {
  asserts.all([
    { value: coordinates, validator: (v) => has.key(v, 'longitude'), message: 'coordinates must have a longitude property' },
    { value: coordinates, validator: (v) => has.key(v, 'latitude'), message: 'coordinates must have a latitude property' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' },
  ])
  return truncateCoordinates(coordinates.longitude, coordinates.latitude)
} */
