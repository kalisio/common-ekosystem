import { assert, is } from '@kalisio/common-core'
import { COORDINATE_TRUNCATION_FACTORS } from '../../foundation'
import { isLikeBBox } from '../is-like'

export function truncateBBox (bbox, precision = 7) {
  assert.all([
    { value: bbox, validator: isLikeBBox, message: 'bbox must be bounding box' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = COORDINATE_TRUNCATION_FACTORS[precision]
  for (let i = 0; i < bbox.length; i++) {
    bbox[i] = Math.round(bbox[i] * factor) / factor
  }
  return bbox
}
