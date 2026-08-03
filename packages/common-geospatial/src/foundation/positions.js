import { assert, is, conform } from '@kalisio/common-core/predicates'
import { DEFAULT_COORDINATE_PRECISION } from './coordinate.js'
import {
  isValidPosition,
  isSamePosition,
  IS_SAME_POSITION_OPTIONS_SCHEMA,
  truncatePosition,
  transformPosition
} from './position.js'

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

export function truncatePositions (positions, precision = DEFAULT_COORDINATE_PRECISION) {
  assert.that(positions, is.nonEmptyArray, 'positions must be a non-empty array')
  return positions.map((position) => truncatePosition(position, precision))
}

export function transformPositions (positions, from, to) {
  assert.that(positions, is.nonEmptyArray, 'positions must be a non-empty array')
  return positions.map((position) => transformPosition(position, from, to))
}
