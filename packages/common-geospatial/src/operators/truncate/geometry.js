import truncate from '@turf/truncate'
import { assert, is } from '@kalisio/common-core'
import { isLikeGeometry } from '../is-like'
import { truncateBBox } from './bbox.js'

export function truncateGeometry (geometry, precision = 7) {
  assert.all([
    { value: geometry, validator: isLikeGeometry, message: 'geometry must be a GeoJson geometry' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const result = truncate(geometry, { precision, mutate: true })
  if (result.bbox) truncateBBox(result.bbox, precision)
  return result
}
