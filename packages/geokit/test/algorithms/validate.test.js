import { describe, it, expect } from 'vitest'
import { validate, validateGeometry } from '../../src/algorithms/validate.js'

const valid = (result) => expect(result.valid).toBe(true)
const invalid = (result) => expect(result.valid).toBe(false)
const hasError = (result, msg) => expect(result.errors.some(e => e.message.includes(msg))).toBe(true)
const hasWarning = (result, msg) => expect(result.warnings.some(w => w.message.includes(msg))).toBe(true)
const noWarnings = (result) => expect(result.warnings).toHaveLength(0)
const noErrors = (result) => expect(result.errors).toHaveLength(0)
const hasErrorAt = (result, path) => expect(result.errors.some(e => e.path === path)).toBe(true)
const hasWarningAt = (result, path) => expect(result.warnings.some(w => w.path === path)).toBe(true)
const hasErrorAtIndex = (result, index) => expect(result.errors.some(e => e.index === index)).toBe(true)

const CCW_RING = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
const CW_RING = [[0.2, 0.2], [0.2, 0.8], [0.8, 0.8], [0.8, 0.2], [0.2, 0.2]]

describe('validateGeometry — invalid input', () => {
  it('rejects null', () => {
    invalid(validateGeometry(null))
  })
  it('rejects undefined', () => {
    invalid(validateGeometry(undefined))
  })
  it('rejects a string', () => {
    invalid(validateGeometry('Point'))
  })
  it('rejects an empty object', () => {
    invalid(validateGeometry({}))
  })
  it('rejects unknown type', () => {
    const r = validateGeometry({ type: 'Triangle', coordinates: [] })
    invalid(r)
    hasError(r, 'Invalid geometry type')
  })
  it('rejects missing type', () => {
    const r = validateGeometry({ coordinates: [0, 0] })
    invalid(r)
  })
})

describe('validateGeometry — Point', () => {
  it('accepts a valid 2D point', () => {
    valid(validateGeometry({ type: 'Point', coordinates: [2.3522, 48.8566] }))
  })
  it('accepts a valid 3D point', () => {
    valid(validateGeometry({ type: 'Point', coordinates: [2.3522, 48.8566, 100] }))
  })
  it('accepts longitude at boundary -180', () => {
    valid(validateGeometry({ type: 'Point', coordinates: [-180, 0] }))
  })
  it('accepts longitude at boundary 180', () => {
    valid(validateGeometry({ type: 'Point', coordinates: [180, 0] }))
  })
  it('accepts latitude at boundary -90', () => {
    valid(validateGeometry({ type: 'Point', coordinates: [0, -90] }))
  })
  it('accepts latitude at boundary 90', () => {
    valid(validateGeometry({ type: 'Point', coordinates: [0, 90] }))
  })
  it('rejects coordinates that is not an array', () => {
    const r = validateGeometry({ type: 'Point', coordinates: '0,0' })
    invalid(r)
  })
  it('rejects coordinates with 1 element', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [2.3522] })
    invalid(r)
  })
  it('rejects coordinates with more than 3 elements', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [2.3522, 48.8566, 100, 99] })
    invalid(r)
  })
  it('rejects longitude out of range (> 180)', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [181, 0] })
    invalid(r)
    hasError(r, 'longitude')
  })
  it('rejects longitude out of range (< -180)', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [-181, 0] })
    invalid(r)
    hasError(r, 'longitude')
  })
  it('rejects latitude out of range (> 90)', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [0, 91] })
    invalid(r)
    hasError(r, 'latitude')
  })
  it('rejects latitude out of range (< -90)', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [0, -91] })
    invalid(r)
    hasError(r, 'latitude')
  })
  it('rejects non-number longitude', () => {
    const r = validateGeometry({ type: 'Point', coordinates: ['48', 0] })
    invalid(r)
  })
  it('rejects non-number latitude', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [0, '48'] })
    invalid(r)
  })
  it('rejects non-number altitude', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [0, 0, 'high'] })
    invalid(r)
  })
  it('warns on high precision longitude', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [2.35220001234, 48.8566] })
    valid(r)
    hasWarning(r, 'longitude precision is high')
  })
  it('warns on high precision latitude', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [2.3522, 48.85660001234] })
    valid(r)
    hasWarning(r, 'latitude precision is high')
  })
  it('does not warn on precision <= 6', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [2.352200, 48.856600] })
    valid(r)
    noWarnings(r)
  })
  it('sets correct path on longitude error', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [181, 0] }, '/features/0/geometry')
    hasErrorAt(r, '/features/0/geometry/coordinates')
  })
  it('sets correct path on precision warning', () => {
    const r = validateGeometry({ type: 'Point', coordinates: [2.35220001234, 48.8566] }, '/features/0/geometry')
    hasWarningAt(r, '/features/0/geometry/coordinates')
  })
})

describe('validateGeometry — MultiPoint', () => {
  it('accepts a valid multipoint', () => {
    valid(validateGeometry({ type: 'MultiPoint', coordinates: [[0, 0], [1, 1]] }))
  })
  it('accepts a multipoint with one position', () => {
    valid(validateGeometry({ type: 'MultiPoint', coordinates: [[0, 0]] }))
  })
  it('accepts an empty multipoint', () => {
    valid(validateGeometry({ type: 'MultiPoint', coordinates: [] }))
  })
  it('rejects coordinates that is not an array', () => {
    const r = validateGeometry({ type: 'MultiPoint', coordinates: null })
    invalid(r)
  })
  it('rejects invalid position inside', () => {
    const r = validateGeometry({ type: 'MultiPoint', coordinates: [[0, 0], [200, 0]] })
    invalid(r)
    hasErrorAtIndex(r, 1)
  })
  it('sets correct path on nested error', () => {
    const r = validateGeometry({ type: 'MultiPoint', coordinates: [[200, 0]] }, '/geometry')
    hasErrorAt(r, '/geometry/coordinates/0')
  })
})

describe('validateGeometry — LineString', () => {
  it('accepts a valid linestring', () => {
    valid(validateGeometry({ type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }))
  })
  it('accepts the minimum 2 positions', () => {
    valid(validateGeometry({ type: 'LineString', coordinates: [[0, 0], [1, 1]] }))
  })
  it('rejects coordinates that is not an array', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: null })
    invalid(r)
  })
  it('rejects empty coordinates', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [] })
    invalid(r)
    hasError(r, 'at least 2')
  })
  it('rejects a single position', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[0, 0]] })
    invalid(r)
    hasError(r, 'at least 2')
  })
  it('rejects invalid position inside', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[0, 0], [200, 0]] })
    invalid(r)
    hasErrorAtIndex(r, 1)
  })
  it('warns on antimeridian crossing', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
    valid(r)
    hasWarning(r, 'antimeridian')
  })
  it('warns on multiple antimeridian crossings', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0], [170, 0], [-170, 0]] })
    valid(r)
    expect(r.warnings.filter(w => w.message.includes('antimeridian'))).toHaveLength(3)
  })
  it('does not warn without antimeridian crossing', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[0, 0], [10, 10]] })
    noWarnings(r)
  })
  it('sets correct path on nested error', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[0, 0], [200, 0]] }, '/geometry')
    hasErrorAt(r, '/geometry/coordinates/1')
  })
  it('sets correct path on antimeridian warning', () => {
    const r = validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] }, '/geometry')
    hasWarningAt(r, '/geometry/coordinates/0')
  })
})

describe('validateGeometry — MultiLineString', () => {
  it('accepts a valid multilinestring', () => {
    valid(validateGeometry({
      type: 'MultiLineString',
      coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]]
    }))
  })
  it('rejects coordinates that is not an array', () => {
    const r = validateGeometry({ type: 'MultiLineString', coordinates: null })
    invalid(r)
  })
  it('rejects empty coordinates', () => {
    const r = validateGeometry({ type: 'MultiLineString', coordinates: [] })
    invalid(r)
  })
  it('rejects a linestring with less than 2 positions inside', () => {
    const r = validateGeometry({ type: 'MultiLineString', coordinates: [[[0, 0]]] })
    invalid(r)
    hasError(r, 'at least 2')
  })
  it('rejects invalid position inside', () => {
    const r = validateGeometry({
      type: 'MultiLineString',
      coordinates: [[[0, 0], [1, 1]], [[200, 0], [3, 3]]]
    })
    invalid(r)
    hasErrorAtIndex(r, 1)
  })
  it('propagates antimeridian warning from nested linestring', () => {
    const r = validateGeometry({
      type: 'MultiLineString',
      coordinates: [[[0, 0], [1, 1]], [[170, 0], [-170, 0]]]
    })
    valid(r)
    hasWarning(r, 'antimeridian')
  })
  it('sets correct path on nested error', () => {
    const r = validateGeometry({
      type: 'MultiLineString',
      coordinates: [[[0, 0], [1, 1]], [[200, 0], [1, 1]]]
    }, '/geometry')
    hasErrorAt(r, '/geometry/coordinates/1/0')
  })
})

describe('validateGeometry — Polygon', () => {
  it('accepts a valid polygon', () => {
    valid(validateGeometry({ type: 'Polygon', coordinates: [CCW_RING] }))
  })
  it('accepts a polygon with a hole', () => {
    valid(validateGeometry({ type: 'Polygon', coordinates: [CCW_RING, CW_RING] }))
  })
  it('rejects coordinates that is not an array', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: null })
    invalid(r)
  })
  it('rejects empty coordinates', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [] })
    invalid(r)
  })
  it('rejects ring with less than 4 positions', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] })
    invalid(r)
    hasError(r, 'at least 4')
  })
  it('rejects unclosed ring', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0]]] })
    invalid(r)
    hasError(r, 'first and last position must be identical')
  })
  it('rejects exterior ring with clockwise winding order', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [CW_RING] })
    invalid(r)
    hasError(r, 'counter-clockwise')
  })
  it('rejects hole with counter-clockwise winding order', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [CCW_RING, CCW_RING] })
    invalid(r)
    hasError(r, 'clockwise')
  })
  it('does not check winding order if ring is already invalid', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] })
    invalid(r)
    expect(r.errors.some(e => e.message.includes('winding'))).toBe(false)
  })
  it('rejects invalid position inside ring', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [[[200, 0], [0, 1], [1, 1], [1, 0], [200, 0]]] })
    invalid(r)
  })
  it('sets correct path on ring error', () => {
    const r = validateGeometry({ type: 'Polygon', coordinates: [CCW_RING, CCW_RING] }, '/geometry')
    hasErrorAt(r, '/geometry/coordinates/1')
  })
})

describe('validateGeometry — MultiPolygon', () => {
  it('accepts a valid multipolygon', () => {
    valid(validateGeometry({
      type: 'MultiPolygon',
      coordinates: [[CCW_RING], [CCW_RING]]
    }))
  })
  it('rejects coordinates that is not an array', () => {
    const r = validateGeometry({ type: 'MultiPolygon', coordinates: null })
    invalid(r)
  })
  it('rejects empty coordinates', () => {
    const r = validateGeometry({ type: 'MultiPolygon', coordinates: [] })
    invalid(r)
  })
  it('rejects invalid polygon inside', () => {
    const r = validateGeometry({
      type: 'MultiPolygon',
      coordinates: [[CCW_RING], [CW_RING]]
    })
    invalid(r)
    hasErrorAtIndex(r, 1)
  })
  it('rejects polygon with invalid ring inside', () => {
    const r = validateGeometry({
      type: 'MultiPolygon',
      coordinates: [[CCW_RING], [[[0, 0], [1, 1], [0, 0]]]]
    })
    invalid(r)
  })
  it('sets correct path on nested error', () => {
    const r = validateGeometry({
      type: 'MultiPolygon',
      coordinates: [[CCW_RING], [CW_RING]]
    }, '/geometry')
    hasErrorAt(r, '/geometry/coordinates/1/0')
  })
})

describe('validateGeometry — GeometryCollection', () => {
  it('accepts a valid geometry collection', () => {
    valid(validateGeometry({
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [0, 0] },
        { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
      ]
    }))
  })
  it('rejects geometries that is not an array', () => {
    const r = validateGeometry({ type: 'GeometryCollection', geometries: null })
    invalid(r)
  })
  it('rejects empty geometries', () => {
    const r = validateGeometry({ type: 'GeometryCollection', geometries: [] })
    invalid(r)
  })
  it('rejects invalid geometry inside', () => {
    const r = validateGeometry({
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [0, 0] },
        { type: 'Point', coordinates: [200, 0] }
      ]
    })
    invalid(r)
    hasErrorAtIndex(r, 1)
  })
  it('propagates warnings from nested geometry', () => {
    const r = validateGeometry({
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [2.35220001234, 48.8566] }
      ]
    })
    valid(r)
    hasWarning(r, 'longitude precision is high')
  })
  it('sets correct path on nested geometry error', () => {
    const r = validateGeometry({
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [0, 0] },
        { type: 'Point', coordinates: [200, 0] }
      ]
    }, '/geometry')
    hasErrorAt(r, '/geometry/geometries/1/coordinates')
  })
})

describe('validate — invalid input', () => {
  it('throws on null', () => {
    expect(() => validate(null)).toThrow()
  })
  it('throws on undefined', () => {
    expect(() => validate(undefined)).toThrow()
  })
  it('throws on a string', () => {
    expect(() => validate('string')).toThrow()
  })
  it('throws on an empty object', () => {
    expect(() => validate({})).toThrow()
  })
  it('rejects unknown top-level type', () => {
    const r = validate({ type: 'Unknown' })
    invalid(r)
    hasError(r, 'unknown type')
  })
  it('rejects missing type', () => {
    const r = validate({ geometry: { type: 'Point', coordinates: [0, 0] } })
    invalid(r)
  })
})

describe('validate — Feature', () => {
  it('accepts a valid feature', () => {
    valid(validate({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: {}
    }))
  })
  it('accepts a feature with null geometry and warns', () => {
    const r = validate({ type: 'Feature', geometry: null, properties: {} })
    valid(r)
    noErrors(r)
    hasWarning(r, 'no geometry')
  })
  it('accepts a feature with undefined geometry and warns', () => {
    const r = validate({ type: 'Feature', properties: {} })
    valid(r)
    noErrors(r)
    hasWarning(r, 'no geometry')
  })
  it('rejects a feature with invalid geometry', () => {
    const r = validate({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [200, 0] },
      properties: {}
    })
    invalid(r)
    hasError(r, 'longitude')
  })
  it('rejects a feature with unknown geometry type', () => {
    const r = validate({
      type: 'Feature',
      geometry: { type: 'Triangle', coordinates: [] },
      properties: {}
    })
    invalid(r)
  })
  it('propagates warnings from geometry', () => {
    const r = validate({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35220001234, 48.8566] },
      properties: {}
    })
    valid(r)
    hasWarning(r, 'longitude precision is high')
  })
  it('sets correct path on geometry error', () => {
    const r = validate({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [200, 0] },
      properties: {}
    })
    hasErrorAt(r, '/geometry/coordinates')
  })
  it('sets correct path on no geometry warning', () => {
    const r = validate({ type: 'Feature', geometry: null, properties: {} })
    hasWarningAt(r, '')
  })
})

describe('validate — FeatureCollection', () => {
  it('accepts a valid feature collection', () => {
    valid(validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} }
      ]
    }))
  })
  it('rejects features that is not an array', () => {
    const r = validate({ type: 'FeatureCollection', features: null })
    invalid(r)
    hasError(r, 'non empty array')
  })
  it('rejects empty features array', () => {
    const r = validate({ type: 'FeatureCollection', features: [] })
    invalid(r)
    hasError(r, 'non empty array')
  })
  it('rejects collection with invalid feature', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
      ]
    })
    invalid(r)
  })
  it('collects errors from multiple invalid features', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 200] }, properties: {} }
      ]
    })
    invalid(r)
    expect(r.errors.length).toBeGreaterThanOrEqual(2)
  })
  it('sets index on nested feature error', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
      ]
    })
    hasErrorAtIndex(r, 1)
  })
  it('sets correct path on nested feature error', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
      ]
    })
    hasErrorAt(r, '/features/0/geometry/coordinates')
  })
  it('propagates warnings from features', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [2.35220001234, 48.8566] }, properties: {} }
      ]
    })
    valid(r)
    hasWarning(r, 'longitude precision is high')
  })
  it('sets correct path on nested feature warning', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [2.35220001234, 48.8566] }, properties: {} }
      ]
    })
    hasWarningAt(r, '/features/0/geometry/coordinates')
  })
  it('accepts features with null geometry inside collection', () => {
    const r = validate({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: null, properties: {} }
      ]
    })
    valid(r)
    hasWarning(r, 'no geometry')
  })
})
