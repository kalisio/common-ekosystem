import { is } from '@kalisio/common-core'
import { validateBBox } from './bbox.js'
import { validateCRS } from './crs.js'

export function emptyStatistics () {
  return { Feature: 0, FeatureCollection: 0, geometries: {} }
}

function mergeStatistics (...results) {
  const statistics = emptyStatistics()
  for (const result of results) {
    const s = result.statistics
    if (!s) continue
    statistics.Feature += s.Feature ?? 0
    statistics.FeatureCollection += s.FeatureCollection ?? 0
    for (const [type, count] of Object.entries(s.geometries ?? {})) {
      statistics.geometries[type] = (statistics.geometries[type] ?? 0) + count
    }
  }
  return statistics
}

export function validateArray (items, validator, path = '') {
  const response = {
    valid: true,
    errors: [],
    warnings: [],
    statistics: emptyStatistics()
  }
  for (let i = 0; i < items.length; i++) {
    const itemPath = `${path}/${i}`
    const result = validator(items[i], itemPath, i)

    // Merge statistics before the valid/invalid branch, so invalid items are
    // still counted and the continue below cannot skip the merge.
    if (result.statistics) {
      response.statistics = mergeStatistics(response, result)
    }

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

export function validateOptionalCRS (obj, result) {
  if (!is.defined(obj.crs)) return result
  const crsResult = validateCRS(obj.crs)
  if (!crsResult.valid) {
    result.valid = false
    result.errors.push(...crsResult.errors.map(e => ({ ...e, path: '/crs' })))
  }
  result.warnings.push(...crsResult.warnings.map(w => ({ ...w, path: '/crs' })))
  return result
}

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
