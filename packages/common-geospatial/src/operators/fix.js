import buffer from '@turf/buffer'
import { is, assert, conform, optional } from '@kalisio/common-core'
import { deduplicatePositions, isClockwiseRing, ringSelfIntersections, ringsIntersect, DEFAULT_COORDINATE_PRECISION } from '../foundation'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from './is-like.js'
import { VALIDATION_CODES } from './validate/codes.js'

// Winding order / self-intersection / hole overlap only apply to ring-based geometries.
const RING_TYPES = [GEOMETRY_TYPES.POLYGON, GEOMETRY_TYPES.MULTI_POLYGON]
// Duplicate position removal applies to any coordinate path, ring or line.
const DEDUPABLE_TYPES = [
  GEOMETRY_TYPES.LINESTRING,
  GEOMETRY_TYPES.MULTI_LINESTRING,
  GEOMETRY_TYPES.POLYGON,
  GEOMETRY_TYPES.MULTI_POLYGON
]
const FIXABLE_CODES = [
  VALIDATION_CODES.INVALID_WINDING_ORDER,
  VALIDATION_CODES.SELF_INTERSECTION,
  VALIDATION_CODES.HOLE_INTERSECTS_SHELL,
  VALIDATION_CODES.DUPLICATE_POSITION
]
const FIX_OPTIONS_SCHEMA = {
  validation: is.nonEmptyObject,
  windingOrder: optional(is.boolean),
  selfIntersection: optional(is.boolean),
  holeIntersectsShell: optional(is.boolean),
  duplicatePosition: optional(is.boolean),
  // Coordinate precision (decimal places) used to decide when two positions are
  // the same during deduplication -- the same notion validate uses, so fix and
  // validate stay in lockstep on duplicates.
  precision: optional(is.number)
}

// Winding order is computed spherically (isClockwiseRing), identical to what
// validate uses, so a ring validate flags is exactly one fix will reverse --
// the two stay in lockstep near the antimeridian and the poles.
function fixRingWindingOrder (ring, shouldBeClockwise) {
  if (isClockwiseRing(ring) !== shouldBeClockwise) {
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

// Fixes winding for a Polygon or every polygon of a MultiPolygon.
function fixWindingOrder (geometry) {
  if (geometry.type === GEOMETRY_TYPES.POLYGON) {
    return fixPolygonWindingOrder(geometry.coordinates)
  }
  let corrected = false
  for (const polygonCoordinates of geometry.coordinates) {
    if (fixPolygonWindingOrder(polygonCoordinates)) corrected = true
  }
  return corrected
}

// Rings of a Polygon or MultiPolygon, flattened to a single array either way.
function ringsOf (geometry) {
  return geometry.type === GEOMETRY_TYPES.POLYGON ? geometry.coordinates : geometry.coordinates.flat(1)
}

// Polygons of a Polygon or MultiPolygon, as an array of ring-arrays either way.
function polygonsOf (geometry) {
  return geometry.type === GEOMETRY_TYPES.POLYGON ? [geometry.coordinates] : geometry.coordinates
}

// Self-intersection is detected spherically (ringSelfIntersections), identical
// to validate. The repair below (buffer(0)) stays planar, but detection agrees
// with what flagged the issue in the first place.
function hasSelfIntersection (geometry) {
  return ringsOf(geometry).some(ring => ringSelfIntersections(ring).length > 0)
}

// Hole/shell overlap is detected spherically (ringsIntersect), identical to
// validate: for each polygon, does any hole cross its exterior ring.
function hasHoleIntersectingShell (geometry) {
  return polygonsOf(geometry).some(rings => {
    const shell = rings[0]
    for (let i = 1; i < rings.length; i++) {
      if (ringsIntersect(shell, rings[i])) return true
    }
    return false
  })
}

// buffer(0) rebuilds the geometry as a valid (multi)polygon. It is the classic
// topological repair for both self-intersections and hole/shell overlaps: it
// resolves a wide range of cases, but is planar and more aggressive than a
// dilate/erode pass (it can drop very small legitimate loops). Returns a plain
// { type, coordinates } candidate, or null if turf produced nothing.
function bufferRebuild (geometry) {
  const feature = { type: 'Feature', properties: {}, geometry }
  const repaired = buffer(feature, 0)
  if (!repaired) return null
  return { type: repaired.geometry.type, coordinates: repaired.geometry.coordinates }
}

function fixDuplicatePositions (geometry, precision) {
  let deduped = false
  const dedupeAndTrack = (positions) => {
    const before = positions.length
    const result = deduplicatePositions(positions, { precision })
    if (result.length !== before) deduped = true
    return result
  }

  switch (geometry.type) {
    case GEOMETRY_TYPES.LINESTRING:
      geometry.coordinates = dedupeAndTrack(geometry.coordinates)
      break
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      geometry.coordinates = geometry.coordinates.map(dedupeAndTrack)
      break
    case GEOMETRY_TYPES.POLYGON:
      geometry.coordinates = geometry.coordinates.map(dedupeAndTrack)
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      geometry.coordinates = geometry.coordinates.map(poly => poly.map(dedupeAndTrack))
      break
  }
  return deduped
}

// Self-intersection and hole/shell overlap are both repaired by a single
// buffer(0) topological rebuild, run at most once when either applies. Returns
// the list of correction codes to report; mutates geometry only if the rebuild
// resolves every triggering defect.
function fixTopology (geometry, options) {
  const wantsSelfIntersection = options.selfIntersection
  const wantsHoleIntersectsShell = options.holeIntersectsShell
  if (!wantsSelfIntersection && !wantsHoleIntersectsShell) return []

  // Detect what is still present after the earlier dedupe/winding steps.
  const selfIntersectionPresent = wantsSelfIntersection && hasSelfIntersection(geometry)
  const holeIntersectsShellPresent = wantsHoleIntersectsShell && hasHoleIntersectingShell(geometry)

  // A flagged defect that is already gone -- e.g. a self-intersection resolved
  // as a side effect of dedupe -- is reported corrected without a rebuild.
  const corrected = []
  if (wantsSelfIntersection && !selfIntersectionPresent) corrected.push(VALIDATION_CODES.SELF_INTERSECTION)
  if (wantsHoleIntersectsShell && !holeIntersectsShellPresent) corrected.push(VALIDATION_CODES.HOLE_INTERSECTS_SHELL)

  if (!selfIntersectionPresent && !holeIntersectsShellPresent) return corrected

  // buffer(0) is planar and cannot repair every case (e.g. across the
  // antimeridian). Commit only if every defect that triggered the rebuild is
  // actually gone -- checked with the same spherical tests that flagged them --
  // otherwise leave the original untouched and report them unfixed.
  const candidate = bufferRebuild(geometry)
  if (!candidate) return corrected
  if (selfIntersectionPresent && hasSelfIntersection(candidate)) return corrected
  if (holeIntersectsShellPresent && hasHoleIntersectingShell(candidate)) return corrected

  geometry.type = candidate.type
  geometry.coordinates = candidate.coordinates
  if (selfIntersectionPresent) corrected.push(VALIDATION_CODES.SELF_INTERSECTION)
  if (holeIntersectsShellPresent) corrected.push(VALIDATION_CODES.HOLE_INTERSECTS_SHELL)
  return corrected
}

function fixGeometry (geometry, options) {
  const corrections = []
  const precision = options.precision ?? DEFAULT_COORDINATE_PRECISION

  if (options.duplicatePosition && DEDUPABLE_TYPES.includes(geometry.type)) {
    if (fixDuplicatePositions(geometry, precision)) {
      corrections.push({ code: VALIDATION_CODES.DUPLICATE_POSITION })
    }
  }

  if (!RING_TYPES.includes(geometry.type)) {
    return { fixed: geometry, corrections }
  }

  if (options.windingOrder && fixWindingOrder(geometry)) {
    corrections.push({ code: VALIDATION_CODES.INVALID_WINDING_ORDER })
  }

  for (const code of fixTopology(geometry, options)) {
    corrections.push({ code })
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
    holeIntersectsShell: options.holeIntersectsShell !== false && relevantIssues.some(i => i.code === VALIDATION_CODES.HOLE_INTERSECTS_SHELL),
    duplicatePosition: options.duplicatePosition !== false && relevantIssues.some(i => i.code === VALIDATION_CODES.DUPLICATE_POSITION),
    precision: options.precision
  }

  const result = (fixOptions.windingOrder || fixOptions.selfIntersection || fixOptions.holeIntersectsShell || fixOptions.duplicatePosition)
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
