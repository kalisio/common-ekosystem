import { is } from '@kalisio/common-core'
import { validatePosition } from './position.js'

export function validateBBox (bbox) {
  // Must be array of 4 (2D) or 6 (3D) numbers
  if (!is.arrayOfLength(bbox, 4) && !is.arrayOfLength(bbox, 6)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid bbox: must be an array of 4 (2D) or 6 (3D) numbers' }],
      warnings: []
    }
  }
  const is2D = bbox.length === 4
  const min = is2D ? [bbox[0], bbox[1]] : [bbox[0], bbox[1], bbox[2]]
  const max = is2D ? [bbox[2], bbox[3]] : [bbox[3], bbox[4], bbox[5]]
  const minResult = validatePosition(min)
  if (!minResult.valid) {
    return {
      valid: false,
      errors: minResult.errors.map(e => ({ ...e, message: `Invalid bbox south-west: ${e.message}` })),
      warnings: []
    }
  }
  const maxResult = validatePosition(max)
  if (!maxResult.valid) {
    return {
      valid: false,
      errors: maxResult.errors.map(e => ({ ...e, message: `Invalid bbox north-east: ${e.message}` })),
      warnings: []
    }
  }
  const [west, south] = min
  const [east, north] = max
  if (south > north) {
    return {
      valid: false,
      errors: [{ message: `Invalid bbox: south (${south}) must be <= north (${north})` }],
      warnings: []
    }
  }
  const response = { valid: true, errors: [], warnings: [] }
  if (west > east) {
    response.warnings.push({ message: `bbox crosses the antimeridian (west: ${west} > east: ${east})` })
  }
  // Retrieve warnings from both points
  response.warnings.push(...minResult.warnings.map(w => ({ ...w, message: `south-west: ${w.message}` })))
  response.warnings.push(...maxResult.warnings.map(w => ({ ...w, message: `north-east: ${w.message}` })))
  return response
}
