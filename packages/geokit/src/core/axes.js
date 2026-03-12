import { asserts, is } from '@kalisio/check'
import { directions } from './directions.js'

export const axes = Object.freeze({
  LATITUDE: 'LAT',
  LONGITUDE: 'LON',
  ALTITUDE: 'ALT',

  isAxis (axis) {
    asserts.that(axis, is.string, 'axis must be a string')
    return this.isLongitude(axis) || this.isLatitude(axis) || this.isAltitude(axis)
  },

  isLongitude (axis) {
    asserts.that(axis, is.string, 'axis must be a string')
    return axis === this.LONGITUDE
  },

  isLatitude (axis) {
    asserts.that(axis, is.string, 'axis must be a string')
    return axis === this.LATITUDE
  },

  isAltitude (axis) {
    asserts.that(axis, is.string, 'axis must be a string')
    return axis === this.ALTITUDE
  },

  guessAxis (coord, dir) {
    asserts.that(coord, is.number, 'coord must be a number')
    if (is.defined(dir)) {
      asserts.that(dir, (v) => directions.isDirection(v), 'dir must be a direction')
      if (directions.isEast(dir) || directions.isWest(dir)) return this.LONGITUDE
      if (directions.isNorth(dir) || directions.isSouth(dir)) return this.LATITUDE
    }
    // Out of lat range → must be lon
    if (Math.abs(coord) > 90) return this.LONGITUDE
    // Ambiguous case: could be either lat or lon
    return [this.LONGITUDE, this.LATITUDE]
  }
})
