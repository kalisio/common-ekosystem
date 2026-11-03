import { assert, is, conform, optional } from '@kalisio/common-core/predicates'
import { object } from '@kalisio/common-core/utilities'
import { hasProjection, WGS84 } from './projections.js'
import {
  isValidPosition,
  isSamePosition,
  IS_SAME_POSITION_DEFAULTS,
  IS_SAME_POSITION_OPTIONS_SCHEMA,
  truncatePosition,
  reprojectPosition
} from './position.js'

export const TRUNCATE_POSITIONS_OPTIONS_SCHEMA = {
  ...IS_SAME_POSITION_OPTIONS_SCHEMA,
  deduplicate: optional(is.boolean)
}

export const TRUNCATE_POSITIONS_DEFAULTS = {
  ...IS_SAME_POSITION_DEFAULTS,
  deduplicate: false
}

export function isValidPositions (positions) {
  return is.array(positions) && positions.every(isValidPosition)
}

export function deduplicatePositions (positions, options) {
  const settings = object.defaults(IS_SAME_POSITION_DEFAULTS, options)
  assert.all([
    {
      value: positions,
      validator: is.array,
      message: 'positions must be an array'
    },
    {
      value: settings,
      validator: (v) => conform.schema(v, IS_SAME_POSITION_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  const result = []
  for (const position of positions) {
    const previous = result[result.length - 1]
    if (!previous || !isSamePosition(position, previous, settings)) {
      result.push(position)
    }
  }
  return result
}

export function truncatePositions (positions, options) {
  const settings = object.defaults(TRUNCATE_POSITIONS_DEFAULTS, options)
  assert.all([
    {
      value: positions,
      validator: is.array,
      message: 'positions must be an array'
    },
    {
      value: settings,
      validator: (v) => conform.schema(v, TRUNCATE_POSITIONS_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  const { precision, deduplicate, consider3D } = settings
  const truncated = positions.map((position) => truncatePosition(position, precision))
  return deduplicate ? deduplicatePositions(truncated, { precision, consider3D }) : truncated
}

export function reprojectPositions (positions, source, target = WGS84) {
  assert.all([
    { value: positions, validator: is.array, message: 'positions must be an array' },
    { value: source, validator: hasProjection, message: `unknown source projection: ${source}` },
    { value: target, validator: hasProjection, message: `unknown target projection: ${target}` }
  ])
  if (source === target) return positions.map(position => [...position])
  return positions.map(position => reprojectPosition(position, source, target))
}
