import { is } from '@kalisio/common-core'
import { validatePosition } from './position.js'
import { VALIDATION_CODES } from './codes.js'

export function validateBBox (bbox, path = '') {
  if (!is.arrayOfLength(bbox, 4) && !is.arrayOfLength(bbox, 6)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_BBOX_LENGTH, path }],
      warnings: []
    }
  }
  const is2D = bbox.length === 4
  const min = is2D ? [bbox[0], bbox[1]] : [bbox[0], bbox[1], bbox[2]]
  const max = is2D ? [bbox[2], bbox[3]] : [bbox[3], bbox[4], bbox[5]]

  const minResult = validatePosition(min, `${path}/min`)
  if (!minResult.valid) {
    return { valid: false, errors: minResult.errors, warnings: [] }
  }
  const maxResult = validatePosition(max, `${path}/max`)
  if (!maxResult.valid) {
    return { valid: false, errors: maxResult.errors, warnings: [] }
  }

  const [west, south] = min
  const [east, north] = max
  if (south > north) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_BBOX_LATITUDE_ORDER, path, params: { south, north } }],
      warnings: []
    }
  }
  if (!is2D) {
    const minAlt = bbox[2]
    const maxAlt = bbox[5]
    if (minAlt > maxAlt) {
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_BBOX_ALTITUDE_ORDER, path, params: { minAlt, maxAlt } }],
        warnings: []
      }
    }
  }

  const response = { valid: true, errors: [], warnings: [] }
  if (west > east) {
    response.warnings.push({ code: VALIDATION_CODES.BBOX_ANTIMERIDIAN_CROSSING, path, params: { west, east } })
  }
  response.warnings.push(...minResult.warnings)
  response.warnings.push(...maxResult.warnings)
  return response
}
