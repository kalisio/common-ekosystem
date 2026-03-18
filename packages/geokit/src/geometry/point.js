import { Position, isPosition } from './position.js'

export function Point (position) {
  const _pos = isPosition(position) ? position : Position(position)

  return {
    get type () { return 'Point' },
    get position () { return _pos },
    get longitude () { return _pos.longitude },
    get latitude () { return _pos.latitude },
    get altitude () { return _pos.altitude },
    get dimension () { return _pos.dimension },
    set longitude (lon) { _pos.longitude = lon },
    set latitude (lat) { _pos.latitude = lat },
    set altitude (alt) { _pos.altitude = alt },

    isValid () { return _pos.isValid() },

    normalize () {
      _pos.normalize()
      return this
    },

    truncate (precision) {
      _pos.truncate(precision)
      return this
    },

    toString (format, decimalPlaces) {
      return _pos.toString(format, decimalPlaces)
    },

    toArray () {
      return _pos.toArray()
    },

    toJSON () {
      return _pos.toJSON()
    },

    toGeoJSON () {
      if (!this.isValid()) return null
      return {
        type: 'Point',
        ..._pos.toGeoJSON()
      }
    }
  }
}
