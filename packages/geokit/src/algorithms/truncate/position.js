import { assert, is } from '@kalisio/check'
import { COORDINATE_TRUNCATION_FACTORS } from '../../foundation'
import { isLikePosition } from '../is-like'

export function truncatePosition (position, precision = 7) {
  assert.all([
    { value: position, validator: isLikePosition, message: 'position must be a position' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = COORDINATE_TRUNCATION_FACTORS[precision]
  for (let i = 0; i < position.length; i++) {
    position[i] = Math.round(position[i] * factor) / factor
  }
  return position
}
