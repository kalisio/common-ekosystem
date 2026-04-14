import { is } from '@kalisio/check'
import { validateBBox } from './bbox.js'

export function validateOptionalBBox (obj, result, path = '') {
  if (!is.defined(obj.bbox)) return result
  const bboxResult = validateBBox(obj.bbox)
  if (!bboxResult.valid) {
    result.valid = false
    result.errors.push(...bboxResult.errors.map(e => ({ ...e, path: `${path}/bbox` })))
  }
  result.warnings.push(...bboxResult.warnings.map(w => ({ ...w, path: `${path}/bbox` })))
  return result
}

export function validateArray (items, validator, path = '') {
  const response = {
    valid: true,
    errors: [],
    warnings: []
  }
  for (let i = 0; i < items.length; i++) {
    const itemPath = `${path}/${i}`
    const result = validator(items[i], itemPath, i)
    if (!result.valid) {
      response.valid = false
      response.errors = response.errors.concat(result.errors.map(e => ({ ...e, path: e.path || itemPath, index: i })))
      continue
    }
    if (!is.empty(result.warnings)) {
      response.warnings = response.warnings.concat(result.warnings.map(w => ({ ...w, path: w.path || itemPath, index: i })))
    }
  }
  return response
}
