import { asserts, is } from '@kalisio/check'

export function normalizeCoordinates (longitude, latitude) {
  asserts.all([
    { value: longitude, validator: is.number, message: 'longitude must be a number' },
    { value: latitude, validator: is.number, message: 'latitude must be a number' }
  ])
  // Normalize latitude if needed
  if (latitude < -90 || latitude > 90) {
    latitude = ((latitude + 180) % 360 + 360) % 360 - 180
    // Reflect latitude at poles and adjust longitude if needed
    if (latitude > 90) {
      latitude = 180 - latitude // bounce off the North Pole
      longitude += 180 // flip longitude 180°
    } else if (latitude < -90) {
      latitude = -180 - latitude // bounce off the South Pole
      longitude += 180 // flip longitude 180°
    }
  }
  // Normalize longitude if needed
  if (longitude < -180 || longitude > 180) {
    longitude = ((longitude + 180) % 360 + 360) % 360 - 180
    if (longitude === -180) longitude = 180
    if (Object.is(longitude, -0)) longitude = 0 // fix -0 edge case
  }
  return { longitude, latitude }
}

/* export function normalizeCoordinates (coordinates) {
  asserts.all([
    { value: coordinates, validator: (v) => has.key(v, 'longitude'), message: 'coordinates must have a longitude property' },
    { value: coordinates, validator: (v) => has.key(v, 'latitude'), message: 'coordinates must have a latitude property' },
  ])
  return normalizeCoordinates(coordinates.longitude, coordinates.latitude)
} */
