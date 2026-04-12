import { assert, is } from '@kalisio/check'
import { validatePosition } from '../foundation'

function _validateArray (items, validator, path = '') {
  const response = { valid: true, errors: [], warnings: [] }
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

function _validateCoordinatesArray (coordinates, minimumLength = 0, path = '') {
  if (!is.arrayOfLengthAtLeast(coordinates, minimumLength)) {
    return {
      valid: false,
      errors: [{ message: `Invalid coordinates: must have at least ${minimumLength} positions`, path }],
      warnings: []
    }
  }
  return _validateArray(coordinates, validatePosition, path)
}

function _validateLineStringCoordinates (coordinates, path = '') {
  const result = _validateCoordinatesArray(coordinates, 2, path)
  if (!result.valid) return result
  // Check for antimeridian crossings
  for (let i = 0; i < coordinates.length - 1; i++) {
    const lon1 = coordinates[i][0]
    const lon2 = coordinates[i + 1][0]
    if (Math.abs(lon2 - lon1) > 180) {
      result.warnings.push({
        message: `LineString crosses the antimeridian between positions ${i} and ${i + 1}, consider using MultiLineString`,
        path: `${path}/${i}`
      })
    }
  }
  return result
}

function _validateMultiLineStringCoordinates (coordinates, path = '') {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid MultiLineString: coordinates must be a non empty array', path }],
      warnings: []
    }
  }
  return _validateArray(coordinates, _validateLineStringCoordinates, path)
}

function _getLinearRingWindingOrder (coordinates) {
  let sum = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i]
    const [x2, y2] = coordinates[i + 1]
    sum += (x2 - x1) * (y2 + y1)
  }
  return sum > 0 ? 'clockwise' : 'counter-clockwise'
}

function _validateLinearRing (coordinates, expectedWindingOrder, path = '') {
  const result = _validateCoordinatesArray(coordinates, 4, path)
  if (!result.valid) return result
  // Check ring is closed
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    result.valid = false
    result.errors.push({ message: 'Invalid LinearRing: first and last position must be identical', path })
    return result
  }
  // Check winding order
  const actualWindingOrder = _getLinearRingWindingOrder(coordinates)
  if (actualWindingOrder !== expectedWindingOrder) {
    result.valid = false
    result.errors.push({ message: `Ring must be ${expectedWindingOrder} but is ${actualWindingOrder}`, path })
  }
  return result
}

function _validatePolygonCoordinates (coordinates, path = '') {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid Polygon: coordinates must be a non empty array', path }],
      warnings: []
    }
  }
  return _validateArray(coordinates, (ring, p, i) => _validateLinearRing(ring, i === 0 ? 'counter-clockwise' : 'clockwise', p), path)
}

function _validateMultiPolygonCoordinates (coordinates, path = '') {
  if (!is.nonEmptyArray(coordinates)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid MultiPolygon: coordinates must be a non empty array', path }],
      warnings: []
    }
  }
  return _validateArray(coordinates, (c, p) => _validatePolygonCoordinates(c, p), path)
}

function _validateGeometryCollectionGeometries (geometries, path = '') {
  if (!is.nonEmptyArray(geometries)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid geometries: geometries must be a non empty array', path }],
      warnings: []
    }
  }
  return _validateArray(geometries, (g, p) => validateGeometry(g, p), path)
}

export function validateGeometry (geometry, path = '') {
  if (!is.nonEmptyObject(geometry)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid geometry: geometry must be a non empty object', path }],
      warnings: []
    }
  }
  const coordsPath = `${path}/coordinates`
  switch (geometry.type) {
    case 'Point': {
      const result = validatePosition(geometry.coordinates, coordsPath)
      return {
        valid: result.valid,
        errors: result.errors.map(e => ({ ...e, path: coordsPath })),
        warnings: result.warnings.map(w => ({ ...w, path: coordsPath }))
      }
    }
    case 'MultiPoint':
      return _validateCoordinatesArray(geometry.coordinates, 0, coordsPath)
    case 'LineString':
      return _validateLineStringCoordinates(geometry.coordinates, coordsPath)
    case 'MultiLineString':
      return _validateMultiLineStringCoordinates(geometry.coordinates, coordsPath)
    case 'Polygon':
      return _validatePolygonCoordinates(geometry.coordinates, coordsPath)
    case 'MultiPolygon':
      return _validateMultiPolygonCoordinates(geometry.coordinates, coordsPath)
    case 'GeometryCollection':
      return _validateGeometryCollectionGeometries(geometry.geometries, `${path}/geometries`)
    default:
      return {
        valid: false,
        errors: [{ message: `Invalid geometry type: ${geometry.type}`, path }],
        warnings: []
      }
  }
}

function _validateFeature (feature, path = '') {
  if (!is.nonEmptyObject(feature)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid feature: feature must be a non empty object', path }],
      warnings: []
    }
  }
  switch (feature.type) {
    case 'Feature':
      if (is.defined(feature.geometry)) return validateGeometry(feature.geometry, `${path}/geometry`)
      return { valid: true, errors: [], warnings: [{ message: 'Feature has no geometry', path }] }
    case 'FeatureCollection':
      if (is.nonEmptyArray(feature.features)) return _validateArray(feature.features, _validateFeature, `${path}/features`)
      return {
        valid: false,
        errors: [{ message: 'Invalid FeatureCollection: features must be a non empty array', path }],
        warnings: []
      }
    default:
      return {
        valid: false,
        errors: [{ message: `Invalid feature: unknown type: ${feature.type}`, path }],
        warnings: []
      }
  }
}

export function validate (geoJson) {
  assert.that(geoJson, is.nonEmptyObject, 'geojson must be a non empty object')
  return _validateFeature(geoJson, '')
}
