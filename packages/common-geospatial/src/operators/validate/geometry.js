import { is } from '@kalisio/common-core/predicates'
import {
  DEFAULT_COORDINATE_PRECISION,
  isSamePosition,
  ringsIntersect,
  isClockwiseRing,
  isClosedRing,
  ringSelfIntersections
} from '../../foundation/index.js'
import { GEOMETRY_TYPES } from '../is-like.js'
import { VALIDATION_CODES } from './codes.js'
import { validatePosition } from './position.js'
import { validateOptionalCRS } from './crs.js'
import { validateOptionalBBox } from './bbox.js'
import { emptyResult, mergeResult, validateArray } from './utils.js'

function findConsecutiveDuplicateIndex (positions, startAt = 0, precision = DEFAULT_COORDINATE_PRECISION) {
  for (let i = startAt; i < positions.length - 1; i++) {
    if (isSamePosition(positions[i], positions[i + 1], { precision })) return i
  }
  return -1
}

function checkDuplicatePositions (positions, path, warnings, precision = DEFAULT_COORDINATE_PRECISION) {
  let i = findConsecutiveDuplicateIndex(positions, 0, precision)
  while (i !== -1) {
    warnings.push({ code: VALIDATION_CODES.DUPLICATE_POSITION, path: `${path}/${i}` })
    i = findConsecutiveDuplicateIndex(positions, i + 1, precision)
  }
}

function validateCoordinatesArray (coordinates, minimumLength = 0, path = '', context = {}) {
  if (!is.arrayOfLengthAtLeast(coordinates, minimumLength)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_COORDINATES_LENGTH, path, params: { minimumLength } }],
      warnings: []
    }
  }
  // Closure injects context; validateArray would otherwise pass the index as 3rd arg
  return validateArray(coordinates, (pos, p) => validatePosition(pos, p, context), path)
}

function validateLineStringCoordinates (coordinates, path = '', context = {}) {
  const result = validateCoordinatesArray(coordinates, 2, path, context)
  if (!result.valid) return result
  checkDuplicatePositions(coordinates, path, result.warnings, context.precision ?? DEFAULT_COORDINATE_PRECISION)
  // Antimeridian crossings assume geographic longitudes.
  if (context.geodesic ?? true) {
    for (let i = 0; i < coordinates.length - 1; i++) {
      const lon1 = coordinates[i][0]
      const lon2 = coordinates[i + 1][0]
      if (Math.abs(lon2 - lon1) > 180) {
        result.warnings.push({ code: VALIDATION_CODES.ANTIMERIDIAN_CROSSING, path: `${path}/${i}` })
      }
    }
  }
  return result
}

function validateMultiLineStringCoordinates (coordinates, path = '', context = {}) {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_MULTI_LINESTRING_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, (line, p) => validateLineStringCoordinates(line, p, context), path)
}

function validateLinearRing (coordinates, expectedWindingOrder, path = '', context = {}) {
  const precision = context.precision ?? DEFAULT_COORDINATE_PRECISION
  const geodesic = context.geodesic ?? true
  const result = validateCoordinatesArray(coordinates, 4, path, context)
  if (!result.valid) return result
  // Ring closure shares the foundation's notion of "same position"
  // (precision-tolerant), so a ring validate reports as not closed is exactly
  // one fix's closeRing would repair. Keeps validate and fix in lockstep.
  if (!isClosedRing(coordinates, { precision })) {
    result.valid = false
    result.errors.push({ code: VALIDATION_CODES.RING_NOT_CLOSED, path })
    return result
  }
  // Check for duplicate consecutive positions (the intentional closing
  // duplicate is never flagged, since first/last are only equal across the
  // whole array, not adjacent to each other).
  checkDuplicatePositions(coordinates, path, result.warnings, precision)
  // Winding order and self-intersection rely on n-vector/spherical geometry,
  // so they only apply to geographic WGS84 coordinates.
  if (geodesic) {
    // check winding order (spherical, matching what S2/MongoDB use)
    const actualWindingOrder = isClockwiseRing(coordinates) ? 'clockwise' : 'counter-clockwise'
    if (actualWindingOrder !== expectedWindingOrder) {
      result.valid = false
      result.errors.push({
        code: VALIDATION_CODES.INVALID_WINDING_ORDER,
        path,
        params: { expected: expectedWindingOrder, actual: actualWindingOrder }
      })
    }
    // check self-intersection (spherical, matching what S2/MongoDB use)
    const selfIntersections = ringSelfIntersections(coordinates)
    if (selfIntersections.length > 0) {
      result.valid = false
      result.errors.push({
        code: VALIDATION_CODES.SELF_INTERSECTION,
        path,
        params: { count: selfIntersections.length }
      })
    }
  }
  return result
}

function validatePolygonCoordinates (coordinates, path = '', context = {}) {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_POLYGON_COORDINATES, path }],
      warnings: []
    }
  }
  const result = validateArray(coordinates, (ring, p, i) => validateLinearRing(ring, i === 0 ? 'counter-clockwise' : 'clockwise', p, context), path)
  // Hole/shell intersection relies on n-vector geometry, so it is geodesic-only.
  if ((context.geodesic ?? true) && result.valid && coordinates.length > 1) {
    const shell = coordinates[0]
    for (let i = 1; i < coordinates.length; i++) {
      if (ringsIntersect(shell, coordinates[i])) {
        result.valid = false
        result.errors.push({ code: VALIDATION_CODES.HOLE_INTERSECTS_SHELL, path: `${path}/${i}` })
      }
    }
  }
  return result
}

function validateMultiPolygonCoordinates (coordinates, path = '', context = {}) {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_MULTIPOLYGON_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, (c, p) => validatePolygonCoordinates(c, p, context), path)
}

function validateGeometryCollectionGeometries (geometries, path = '', context = {}) {
  if (!is.nonEmptyArray(geometries)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_GEOMETRYCOLLECTION_GEOMETRIES, path }],
      warnings: []
    }
  }
  return validateArray(geometries, (g, p) => validateGeometry(g, p, context), path)
}

export function validateGeometry (geometry, path = '', context = {}) {
  let result = emptyResult()
  // check whether the geometry is a non empty object
  if (!is.nonEmptyObject(geometry)) {
    result.valid = false
    result.errors.push({ code: VALIDATION_CODES.INVALID_GEOMETRY, path })
    return result
  }
  // Handle the CRS first: it poses context.geodesic, which the coordinate
  // checks below read. A nested crs (deeper than root) is rejected inside
  // validateOptionalCRS; its absence is a no-op that leaves geodesic untouched.
  result = mergeResult(result, validateOptionalCRS(geometry.crs, `${path}/crs`, context))
  // handle the bbox
  result = mergeResult(result, validateOptionalBBox(geometry.bbox, `${path}/bbox`, context))
  // handle the coordinates by geometry type
  const coordsPath = `${path}/coordinates`
  switch (geometry.type) {
    case GEOMETRY_TYPES.POINT:
      result = mergeResult(result, validatePosition(geometry.coordinates, coordsPath, context))
      break
    case GEOMETRY_TYPES.MULTI_POINT:
      result = mergeResult(result, validateCoordinatesArray(geometry.coordinates, 0, coordsPath, context))
      break
    case GEOMETRY_TYPES.LINESTRING:
      result = mergeResult(result, validateLineStringCoordinates(geometry.coordinates, coordsPath, context))
      break
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      result = mergeResult(result, validateMultiLineStringCoordinates(geometry.coordinates, coordsPath, context))
      break
    case GEOMETRY_TYPES.POLYGON:
      result = mergeResult(result, validatePolygonCoordinates(geometry.coordinates, coordsPath, context))
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      result = mergeResult(result, validateMultiPolygonCoordinates(geometry.coordinates, coordsPath, context))
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      result = mergeResult(result, validateGeometryCollectionGeometries(geometry.geometries, `${path}/geometries`, context))
      break
    default:
      // Unknown type: report it and do not count it in statistics.
      result.valid = false
      result.errors.push({ code: VALIDATION_CODES.INVALID_GEOMETRY_TYPE, path, params: { type: geometry.type } })
      return result
  }
  // Count this geometry by its own type. A GeometryCollection counts as one and
  // its members are NOT decomposed, so we overwrite any statistics that bubbled
  // up from the members.
  result.statistics = { Feature: 0, FeatureCollection: 0, geometries: { [geometry.type]: 1 } }
  return result
}
