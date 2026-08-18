import { is } from '@kalisio/common-core'

export function emptyStatistics () {
  return { Feature: 0, FeatureCollection: 0, geometries: {} }
}

export function emptyResult () {
  return {
    crs: undefined,
    valid: true,
    errors: [],
    warnings: [],
    statistics: emptyStatistics()
  }
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

export function mergeResult (result, ...others) {
  for (const other of others) {
    result.valid = result.valid && (other.valid ?? true)
    if (other.errors) result.errors.push(...other.errors)
    if (other.warnings) result.warnings.push(...other.warnings)
    if (other.crs !== undefined) result.crs = other.crs
  }
  result.statistics = mergeStatistics(result, ...others)
  return result
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
    if (result.statistics) {
      response.statistics = mergeStatistics(response, result)
    }
    if (!result.valid) {
      response.valid = false
      response.errors = response.errors.concat(result.errors.map(e => ({ ...e, path: e.path || itemPath, index: i })))
    }
    if (!is.empty(result.warnings)) {
      response.warnings = response.warnings.concat(result.warnings.map(w => ({ ...w, path: w.path || itemPath, index: i })))
    }
  }
  return response
}
