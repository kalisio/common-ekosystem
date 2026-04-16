import { assert, is } from '@kalisio/check'
import { COORDINATE_TRUNCATION_FACTORS } from '../../foundation'

export function truncateBBox (bbox, precision = 7) {
  assert.all([
    { value: bbox, validator: (v) => is.arrayOfLengthBetween(v, 4) || is.arrayOfLength(v, 6), message: 'bbox must be an array of 4 or 6 numbers' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = COORDINATE_TRUNCATION_FACTORS[precision]
  for (let i = 0; i < bbox.length; i++) {
    bbox[i] = Math.round(bbox[i] * factor) / factor
  }
  return bbox
}
