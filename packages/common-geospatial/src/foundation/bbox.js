import { assert, is, conform, optional } from '@kalisio/common-core'
import { isValidPosition, is3DPosition } from './position.js'

export function isValidBBox (bbox) {
  if (!is.arrayOfLength(bbox, 4) && !is.arrayOfLength(bbox, 6)) return false
  const is2D = bbox.length === 4
  const min = is2D ? [bbox[0], bbox[1]] : [bbox[0], bbox[1], bbox[2]]
  const max = is2D ? [bbox[2], bbox[3]] : [bbox[3], bbox[4], bbox[5]]
  if (!isValidPosition(min)) return false
  if (!isValidPosition(max)) return false
  const [, south] = min
  const [, north] = max
  if (south > north) return false
  if (!is2D && bbox[2] > bbox[5]) return false
  return true
}

export function is3DBBox (bbox) {
  assert.that(bbox, isValidBBox, 'bbox must be a valid bounding-box')
  return is.arrayOfLength(bbox, 6)
}

export function mergeBBox (bbox1, bbox2) {
  assert.all([
    { value: bbox1, validator: isValidBBox, message: 'bbox1 must be a valid bounding-box' },
    { value: bbox2, validator: isValidBBox, message: 'bbox2 must be a valid bounding-box' }
  ])
  if (is3DBBox(bbox1) && is3DBBox(bbox2)) {
    return [
      Math.min(bbox1[0], bbox2[0]),
      Math.min(bbox1[1], bbox2[1]),
      Math.min(bbox1[2], bbox2[2]),
      Math.max(bbox1[3], bbox2[3]),
      Math.max(bbox1[4], bbox2[4]),
      Math.max(bbox1[5], bbox2[5])
    ]
  }
  return [
    Math.min(bbox1[0], bbox2[0]),
    Math.min(bbox1[1], bbox2[1]),
    Math.max(bbox1[2], bbox2[2]),
    Math.max(bbox1[3], bbox2[3])
  ]
}

const COMPUTE_BBOX_OPTIONS_SCHEMA = {
  ignore3D: optional(is.boolean)
}

export function computeBBox (positions, options = {}) {
  assert.all([
    {
      value: positions,
      validator: is.nonEmptyArray,
      message: 'positions must be a non-empty array'
    },
    {
      value: positions,
      validator: (v) => v.every(isValidPosition),
      message: 'positions must be an array of valid positions'
    },
    {
      value: options,
      validator: (v) => conform.schema(v, COMPUTE_BBOX_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  const { ignore3D = false } = options
  const has3D = !ignore3D && positions.some(is3DPosition)
  if (has3D) {
    return positions.reduce((acc, pos) => [
      Math.min(acc[0], pos[0]),
      Math.min(acc[1], pos[1]),
      Math.min(acc[2], pos[2] ?? 0),
      Math.max(acc[3], pos[0]),
      Math.max(acc[4], pos[1]),
      Math.max(acc[5], pos[2] ?? 0)
    ], [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity])
  }
  return positions.reduce((acc, pos) => [
    Math.min(acc[0], pos[0]),
    Math.min(acc[1], pos[1]),
    Math.max(acc[2], pos[0]),
    Math.max(acc[3], pos[1])
  ], [Infinity, Infinity, -Infinity, -Infinity])
}
