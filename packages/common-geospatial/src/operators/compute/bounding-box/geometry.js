import { coordAll } from '@turf/meta'
import { assert, is, optional, conform } from '@kalisio/common-core'
import { isLikeGeometry } from '../../is-like/index.js'
import { computeBBox } from '../../../foundation/index.js'

export const BOUNDING_BOX_OPTIONS_SCHEMA = {
  ignore3D: optional(is.boolean)
}

export function computeGeometryBoundingBox (geometry, options = {}) {
  assert.all([
    { value: geometry, validator: isLikeGeometry, message: 'geometry must be a Geometry object' },
    { value: options, validator: (v) => conform.schema(v, BOUNDING_BOX_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
  ])
  return computeBBox(coordAll(geometry), options)
}
