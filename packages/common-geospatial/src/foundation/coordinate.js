import { assert, is, has } from '@kalisio/common-core'
import { AXES, isLatitude, isLongitude } from './axes.js'
import { isDirection, getDirectionAxis } from './directions.js'
import { COORDINATE_FORMATS, COORDINATE_MODELS, converter } from './coordinate-formats'
export { COORDINATE_FORMATS, COORDINATE_MODELS } from './coordinate-formats'

export const COORDINATE_TRUNCATION_FACTORS = Array.from({ length: 9 }, (_, i) => 10 ** i)

export function guessCoordinateAxis (coord, dir) {
  assert.that(coord, is.number, 'coord must be a number')
  if (is.defined(dir)) {
    assert.that(dir, isDirection, 'dir must be a direction')
    return getDirectionAxis(dir)
  }
  if (Math.abs(coord) > 90) return AXES.LONGITUDE
  return undefined
}

export function getCoordinatePrecision (coord) {
  assert.that(coord, is.number, 'coord must be a number')
  const str = coord.toExponential()
  const [base, exp] = str.split('e').map(Number)
  const decimalsInBase = (base.toString().split('.')[1] || '').length
  return Math.max(0, decimalsInBase - exp)
}

export function truncateCoordinate (coord, precision = 7) {
  assert.all([
    { value: coord, validator: is.number, message: 'coord must be a number' },
    { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
  ])
  const factor = COORDINATE_TRUNCATION_FACTORS[precision]
  return Math.round(coord * factor) / factor
}

export function normalizeCoordinate (coord, axis) {
  assert.all([
    { value: coord, validator: is.number, message: 'coord must be a number' },
    { value: axis, validator: (v) => isLongitude(v) || isLatitude(v), message: 'axis must be either a longitude or latitude' }
  ])
  if (isLatitude(axis)) {
    return Math.max(-90, Math.min(90, coord))
  }
  let lon = ((coord + 180) % 360 + 360) % 360 - 180
  if (lon === -180) lon = 180
  if (Object.is(lon, -0)) lon = 0
  return lon
}

export function convertCoordinate (from, to) {
  assert.all([
    { value: from, validator: (v) => is.defined(v) && v.isValid(), message: 'from must be a valid coordinate' },
    { value: to, validator: (v) => has.key(converter, v), message: `unknown format: ${to}` }
  ])
  const dd = from.format === COORDINATE_FORMATS.DD ? from : from.toDecimal()
  if (!dd.isValid()) return null
  if (to === COORDINATE_FORMATS.DD) {
    return dd
  }
  return converter[to](dd)
}

export function parseCoordinate (pattern) {
  assert.that(pattern, is.nonEmptyString, 'pattern must be a non empty string')
  for (const format of Object.keys(COORDINATE_FORMATS)) {
    const coord = COORDINATE_MODELS[format](pattern)
    if (coord.isValid()) return coord
  }
  return null
}
