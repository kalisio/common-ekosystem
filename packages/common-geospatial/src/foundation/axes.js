import { assert, is } from '@kalisio/common-core/predicates'

export const AXES = {
  LATITUDE: 'LAT',
  LONGITUDE: 'LON',
  ALTITUDE: 'ALT'
}

export function isAxis (axis) {
  assert.that(axis, is.string, 'axis must be a string')
  return Object.values(AXES).includes(axis)
}

export function isLatitude (axis) {
  assert.that(axis, is.string, 'axis must be a string')
  return axis === AXES.LATITUDE
}

export function isLongitude (axis) {
  assert.that(axis, is.string, 'axis must be a string')
  return axis === AXES.LONGITUDE
}

export function isAltitude (axis) {
  assert.that(axis, is.string, 'axis must be a string')
  return axis === AXES.ALTITUDE
}
