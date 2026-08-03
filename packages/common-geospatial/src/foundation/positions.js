import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import { DEFAULT_COORDINATE_PRECISION } from './coordinate.js'
import {
  isValidPosition,
  isSamePosition,
  IS_SAME_POSITION_OPTIONS_SCHEMA,
  truncatePosition,
  transformPosition
} from './position.js'

export const TRUNCATE_POSITIONS_OPTIONS_SCHEMA = {
  ...IS_SAME_POSITION_OPTIONS_SCHEMA,
  deduplicate: optional(is.boolean)
}

export function isValidPositions (positions) {
  return is.nonEmptyArray(positions) && positions.every(isValidPosition)
}

export function deduplicatePositions (positions, options = {}) {
  assert.that(options, (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS_SCHEMA), 'options must be a valid options object')
  const { precision = DEFAULT_COORDINATE_PRECISION, consider3D = false } = options
  const result = []
  for (const position of positions) {
    const previous = result[result.length - 1]
    if (!previous || !isSamePosition(position, previous, { precision, consider3D })) {
      result.push(position)
    }
  }
  return result
}

export function truncatePositions (positions, options = {}) {
  assert.all([
    {
      value: positions,
      validator: is.nonEmptyArray,
      message: 'positions must be a non-empty array'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, TRUNCATE_POSITIONS_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  const { precision = DEFAULT_COORDINATE_PRECISION, deduplicate = false, consider3D = false } = options
  const truncated = positions.map((position) => truncatePosition(position, precision))
  return deduplicate ? deduplicatePositions(truncated, { precision, consider3D }) : truncated
}

export function transformPositions (positions, from, to) {
  assert.that(positions, is.nonEmptyArray, 'positions must be a non-empty array')
  return positions.map((position) => transformPosition(position, from, to))
}
