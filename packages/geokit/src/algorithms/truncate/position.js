import { assert, is } from '@kalisio/check'
import { COORDINATE_TRUNCATION_FACTORS } from '../../foundation'

export function truncatePosition (coordinates, precision = 7) {
  assert.all([
    { value: coordinates, validator: (v) => is.arrayOfLengthBetween(v, 2, 3), message: 'coordinates must be an array of 2 or 3 numbers' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = COORDINATE_TRUNCATION_FACTORS[precision]
  for (let i = 0; i < coordinates.length; i++) {
    coordinates[i] = Math.round(coordinates[i] * factor) / factor
  }
  return coordinates
}
