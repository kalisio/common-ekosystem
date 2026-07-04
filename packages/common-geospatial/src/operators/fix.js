import buffer from '@turf/buffer'
import { booleanClockwise } from '@turf/boolean-clockwise'
import { is, assert, conform, optional } from '@kalisio/common-core'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from './is-like.js'
import { VALIDATION_CODES } from './validate/codes.js'

const FIXABLE_TYPES = [GEOMETRY_TYPES.POLYGON, GEOMETRY_TYPES.MULTI_POLYGON]
const FIXABLE_CODES = [VALIDATION_CODES.INVALID_WINDING_ORDER, VALIDATION_CODES.SELF_INTERSECTION]
const DEFAULT_PRECISION = 1e-9
const FIX_OPTIONS_SCHEMA = {
  validation: is.nonEmptyObject,
  windingOrder: optional(is.boolean),
  selfIntersection: optional(is.boolean),
  precision: optional(is.number)
}

function fixRingWindingOrder (ring, shouldBeClockwise) {
  if (booleanClockwise(ring) !== shouldBeClockwise) {
    ring.reverse()
    return true
  }
  return false
}

function fixPolygonWindingOrder (coordinates) {
  let corrected = false
  if (fixRingWindingOrder(coordinates[0], false)) corrected = true
  for (let i = 1; i < coordinates.length; i++) {
    if (fixRingWindingOrder(coordinates[i], true)) corrected = true
  }
  return corrected
}

function fixSelfIntersection (geometry, precision) {
  const feature = { type: 'Feature', properties: {}, geometry }
  // Dilate then erode by the same tiny amount: gentler than buffer(0),
  // avoids collapsing small legitimate loops while resolving self-intersections.
  const dilated = buffer(feature, precision, { units: 'degrees' })
  if (!dilated) return false
  const eroded = buffer(dilated, -precision, { units: 'degrees' })
  if (!eroded) return false
  geometry.type = eroded.geometry.type
  geometry.coordinates = eroded.geometry.coordinates
  return true
}

function fixGeometry (geometry, options) {
  const corrections = []
  if (!FIXABLE_TYPES.includes(geometry.type)) {
    return { fixed: geometry, corrections }
  }
  if (options.windingOrder) {
    let corrected = false
    if (geometry.type === GEOMETRY_TYPES.POLYGON) {
      corrected = fixPolygonWindingOrder(geometry.coordinates)
    } else {
      for (const polygonCoordinates of geometry.coordinates) {
        if (fixPolygonWindingOrder(polygonCoordinates)) corrected = true
      }
    }
    if (corrected) corrections.push({ code: VALIDATION_CODES.INVALID_WINDING_ORDER })
  }
  if (options.selfIntersection) {
    if (fixSelfIntersection(geometry, options.precision ?? DEFAULT_PRECISION)) {
      corrections.push({ code: VALIDATION_CODES.SELF_INTERSECTION })
    }
  }
  return { fixed: geometry, corrections }
}

// Issues relevant to a given geometry path (the issue's own path is at or below it).
function issuesAt (issues, path) {
  return issues.filter(issue => issue.path === path || issue.path?.startsWith(`${path}/`))
}

// Attempts a fix for a single geometry, and reports both what was corrected
// and what remained unfixed (option disabled, or the fix attempt failed).
function fixGeometryIssues (geometry, relevantIssues, path, options) {
  const fixOptions = {
    windingOrder: options.windingOrder !== false && relevantIssues.some(i => i.code === VALIDATION_CODES.INVALID_WINDING_ORDER),
    selfIntersection: options.selfIntersection !== false && relevantIssues.some(i => i.code === VALIDATION_CODES.SELF_INTERSECTION),
    precision: options.precision
  }
  const result = (fixOptions.windingOrder || fixOptions.selfIntersection)
    ? fixGeometry(geometry, fixOptions)
    : { corrections: [] }
  const correctedCodes = new Set(result.corrections.map(c => c.code))
  const corrections = result.corrections.map(c => ({ ...c, path }))
  const unfixed = relevantIssues.filter(issue => !correctedCodes.has(issue.code))

  return { corrections, unfixed }
}

export function fixGeoJson (geoJson, options) {
  assert.all([
    { value: geoJson, validator: isLikeGeoJson, message: 'geoJson must be a GeoJson object' },
    { value: options, validator: (v) => conform.schema(v, FIX_OPTIONS_SCHEMA), message: 'options must be a valid options object, with a mandatory validation result' }
  ])
  const allIssues = [...options.validation.errors, ...options.validation.warnings]
  const fixableIssues = allIssues.filter(issue => FIXABLE_CODES.includes(issue.code))
  const unfixed = allIssues.filter(issue => !FIXABLE_CODES.includes(issue.code))
  if (fixableIssues.length === 0) return { fixed: geoJson, corrections: [], unfixed }
  if (geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    const corrections = []
    geoJson.features.forEach((feature, index) => {
      const featurePath = `/features/${index}/geometry`
      const relevant = issuesAt(fixableIssues, featurePath)
      if (relevant.length === 0) return
      const result = fixGeometryIssues(feature.geometry, relevant, featurePath, options)
      corrections.push(...result.corrections)
      unfixed.push(...result.unfixed)
    })
    return { fixed: geoJson, corrections, unfixed }
  }
  if (geoJson.type === FEATURE_TYPES.FEATURE) {
    const relevant = issuesAt(fixableIssues, '/geometry')
    const result = fixGeometryIssues(geoJson.geometry, relevant, '/geometry', options)
    return { fixed: geoJson, corrections: result.corrections, unfixed: [...unfixed, ...result.unfixed] }
  }
  const relevant = issuesAt(fixableIssues, '')
  const result = fixGeometryIssues(geoJson, relevant, '', options)
  return { fixed: geoJson, corrections: result.corrections, unfixed: [...unfixed, ...result.unfixed] }
}
