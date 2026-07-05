import booleanClockwise from '@turf/boolean-clockwise'
import kinks from '@turf/kinks'
import { is } from '@kalisio/common-core'
import { isSamePosition } from '../../foundation'
import { GEOMETRY_TYPES } from '../is-like.js'
import { VALIDATION_CODES } from './codes.js'
import { validatePosition } from './position.js'
import { validateOptionalBBox, validateArray } from './utils.js'

function findConsecutiveDuplicateIndex (positions, startAt = 0) {
  for (let i = startAt; i < positions.length - 1; i++) {
    if (isSamePosition(positions[i], positions[i + 1])) return i
  }
  return -1
}

function checkDuplicatePositions (positions, path, warnings) {
  let i = findConsecutiveDuplicateIndex(positions)
  while (i !== -1) {
    warnings.push({ code: VALIDATION_CODES.DUPLICATE_POSITION, path: `${path}/${i}` })
    i = findConsecutiveDuplicateIndex(positions, i + 1)
  }
}

function validateCoordinatesArray (coordinates, minimumLength = 0, path = '') {
  if (!is.arrayOfLengthAtLeast(coordinates, minimumLength)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_COORDINATES_LENGTH, path, params: { minimumLength } }],
      warnings: []
    }
  }
  return validateArray(coordinates, validatePosition, path)
}

function validateLineStringCoordinates (coordinates, path = '') {
  const result = validateCoordinatesArray(coordinates, 2, path)
  if (!result.valid) return result
  checkDuplicatePositions(coordinates, path, result.warnings)
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

function validateMultiLineStringCoordinates (coordinates, path = '') {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_MULTI_LINESTRING_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, validateLineStringCoordinates, path)
}

function validateLinearRing (coordinates, expectedWindingOrder, path = '') {
  const result = validateCoordinatesArray(coordinates, 4, path)
  if (!result.valid) return result
  // check ring is closed
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    result.valid = false
    result.errors.push({ code: VALIDATION_CODES.RING_NOT_CLOSED, path })
    return result
  }
  // Check for duplicate consecutive positions (the intentional closing
  // duplicate is never flagged, since first/last are only equal across the
  // whole array, not adjacent to each other).
  checkDuplicatePositions(coordinates, path, result.warnings)
  // check winding order
  const isClockwise = booleanClockwise(coordinates)
  const actualWindingOrder = isClockwise ? 'clockwise' : 'counter-clockwise'
  if (actualWindingOrder !== expectedWindingOrder) {
    result.warnings.push({
      code: VALIDATION_CODES.INVALID_WINDING_ORDER,
      path,
      params: { expected: expectedWindingOrder, actual: actualWindingOrder }
    })
  }
  // check self-intersection
  const intersections = kinks({ type: 'Polygon', coordinates: [coordinates] })
  if (intersections.features.length > 0) {
    result.valid = false
    result.errors.push({
      code: VALIDATION_CODES.SELF_INTERSECTION,
      path,
      params: { count: intersections.features.length }
    })
  }
  return result
}

function validatePolygonCoordinates (coordinates, path = '') {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_POLYGON_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, (ring, p, i) => validateLinearRing(ring, i === 0 ? 'counter-clockwise' : 'clockwise', p), path)
}

function validateMultiPolygonCoordinates (coordinates, path = '') {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_MULTIPOLYGON_COORDINATES, path }],
      warnings: []
    }
  }
  return validateArray(coordinates, (c, p) => validatePolygonCoordinates(c, p), path)
}

function validateGeometryCollectionGeometries (geometries, path = '') {
  if (!is.nonEmptyArray(geometries)) {
    return {
      valid: false,
      errors: [{ code: VALIDATION_CODES.INVALID_GEOMETRYCOLLECTION_GEOMETRIES, path }],
      warnings: []
    }
  }
  return validateArray(geometries, (g, p) => validateGeometry(g, p), path)
}

export function validateGeometry (geometry, path = '') {
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
      const positionResult = validatePosition(geometry.coordinates, coordsPath)
      result = {
        valid: positionResult.valid,
        errors: positionResult.errors,
        warnings: positionResult.warnings
      }
      break
    }
    case GEOMETRY_TYPES.MULTI_POINT:
      result = validateCoordinatesArray(geometry.coordinates, 0, coordsPath)
      break
    case GEOMETRY_TYPES.LINESTRING:
      result = validateLineStringCoordinates(geometry.coordinates, coordsPath)
      break
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      result = validateMultiLineStringCoordinates(geometry.coordinates, coordsPath)
      break
    case GEOMETRY_TYPES.POLYGON:
      result = validatePolygonCoordinates(geometry.coordinates, coordsPath)
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      result = validateMultiPolygonCoordinates(geometry.coordinates, coordsPath)
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      result = validateGeometryCollectionGeometries(geometry.geometries, `${path}/geometries`)
      break
    default:
      return {
        valid: false,
        errors: [{ code: VALIDATION_CODES.INVALID_GEOMETRY_TYPE, path, params: { type: geometry.type } }],
        warnings: []
      }
  }
  result = validateOptionalBBox(geometry, result, path)
  // Count this geometry by its own type. A GeometryCollection counts as one
  // and its members are NOT decomposed, so we overwrite any statistics that
  // bubbled up from the members.
  result.statistics = { geometries: { [geometry.type]: 1 } }
  return result
}
