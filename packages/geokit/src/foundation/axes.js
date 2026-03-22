import { asserts, is } from '@kalisio/check'

export const AXES = {
  LATITUDE: 'LAT',
  LONGITUDE: 'LON',
  ALTITUDE: 'ALT'
}

export function isAxis (axis) {
  asserts.that(axis, is.string, 'axis must be a string')
  return Object.values(AXES).includes(axis)
}

export function isLatitude (axis) {
  asserts.that(axis, is.string, 'axis must be a string')
  return axis === AXES.LATITUDE
}

export function isLongitude (axis) {
  asserts.that(axis, is.string, 'axis must be a string')
  return axis === AXES.LONGITUDE
}

export function isAltitude (axis) {
  asserts.that(axis, is.string, 'axis must be a string')
  return axis === AXES.ALTITUDE
}
