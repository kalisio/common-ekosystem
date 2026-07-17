import { is } from '@kalisio/common-core'
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
import { validateOptionalBBox, validateArray } from './utils.js'

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

function validateCoordinatesArray (coordinates, minimumLength = 0, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.arrayOfLengthAtLeast(coordinates, minimumLength)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_COORDINATES_LENGTH, path, params: { minimumLength } }],
      warnings: []
    }
  }
  // Closure injects precision; validateArray would otherwise pass the index as 3rd arg
  return validateArray(coordinates, (pos, p) => validatePosition(pos, p, precision), path)
}

function validateLineStringCoordinates (coordinates, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  const result = validateCoordinatesArray(coordinates, 2, path, precision)
  if (!result.valid) return result
  checkDuplicatePositions(coordinates, path, result.warnings, precision)
  // Check for antimeridian crossings
  for (let i = 0; i < coordinates.length - 1; i++) {
    const lon1 = coordinates[i][0]
    const lon2 = coordinates[i + 1][0]
    if (Math.abs(lon2 - lon1) > 180) {
      result.warnings.push({ code: VALIDATION_CODES.ANTIMERIDIAN_CROSSING, path: `${path}/${i}` })
    }
  }
  return result
}

function validateMultiLineStringCoordinates (coordinates, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_MULTI_LINESTRING_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, (line, p) => validateLineStringCoordinates(line, p, precision), path)
}

function validateLinearRing (coordinates, expectedWindingOrder, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  const result = validateCoordinatesArray(coordinates, 4, path, precision)
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
  return result
}

function validatePolygonCoordinates (coordinates, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_POLYGON_COORDINATES, path }],
      warnings: []
    }
  }
  const result = validateArray(coordinates, (ring, p, i) => validateLinearRing(ring, i === 0 ? 'counter-clockwise' : 'clockwise', p, precision), path)
  if (result.valid && coordinates.length > 1) {
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

function validateMultiPolygonCoordinates (coordinates, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_MULTIPOLYGON_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, (c, p) => validatePolygonCoordinates(c, p, precision), path)
}

function validateGeometryCollectionGeometries (geometries, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.nonEmptyArray(geometries)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_GEOMETRYCOLLECTION_GEOMETRIES, path }],
      warnings: []
    }
  }
  return validateArray(geometries, (g, p) => validateGeometry(g, p, precision), path)
}

export function validateGeometry (geometry, path = '', precision = DEFAULT_COORDINATE_PRECISION) {
  if (!is.nonEmptyObject(geometry)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_GEOMETRY, path }],
      warnings: []
    }
  }
  const coordsPath = `${path}/coordinates`
  let result
  switch (geometry.type) {
    case GEOMETRY_TYPES.POINT: {
      const positionResult = validatePosition(geometry.coordinates, coordsPath, precision)
      result = {
        valid: positionResult.valid,
        errors: positionResult.errors,
        warnings: positionResult.warnings
      }
      break
    }
    case GEOMETRY_TYPES.MULTI_POINT:
      result = validateCoordinatesArray(geometry.coordinates, 0, coordsPath, precision)
      break
    case GEOMETRY_TYPES.LINESTRING:
      result = validateLineStringCoordinates(geometry.coordinates, coordsPath, precision)
      break
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      result = validateMultiLineStringCoordinates(geometry.coordinates, coordsPath, precision)
      break
    case GEOMETRY_TYPES.POLYGON:
      result = validatePolygonCoordinates(geometry.coordinates, coordsPath, precision)
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      result = validateMultiPolygonCoordinates(geometry.coordinates, coordsPath, precision)
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      result = validateGeometryCollectionGeometries(geometry.geometries, `${path}/geometries`, precision)
      break
    default:
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_GEOMETRY_TYPE, path, params: { type: geometry.type } }],
        warnings: []
      }
  }
  result = validateOptionalBBox(geometry, result, path, precision)
  // Count this geometry by its own type. A GeometryCollection counts as one
  // and its members are NOT decomposed, so we overwrite any statistics that
  // bubbled up from the members.
  result.statistics = { geometries: { [geometry.type]: 1 } }
  return result
}
