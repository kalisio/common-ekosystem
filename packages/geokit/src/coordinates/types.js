import { asserts, is } from '@kalisio/check'

export const COORDINATE_TYPES = {
  LATITUDE: ['LATITUDE', 'latitude', 'LAT', 'lat'],
  LONGITUDE: ['LONGITUDE', 'longitude', 'LON', 'lon']
}

export function isLongitudeType (type) {
  asserts.that(type, is.string, 'type must be a string')
  return COORDINATE_TYPES.LONGITUDE.includes(type)
}

export function isLatitudeType (type) {
  asserts.that(type, is.string, 'type must be a string')
  return COORDINATE_TYPES.LATITUDE.includes(type)
}

export function isCoordinateType (type) {
  asserts.that(type, is.string, 'type must be a string')
  return isLongitudeType(type) || isLatitudeType(type)
}
