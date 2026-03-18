import { asserts, is } from '@kalisio/check'
import {
  AXES,
  getNorth,
  getSouth,
  getEast,
  getWest,
  COORDINATE_MODELS,
  truncateCoordinate,
  parseCoordinate,
  convertCoordinate,
  guessCoordinateAxis
} from '../core'

export function Position (position) {
  const _value = [null, null, null]

  if (is.array(position) && position.length > 1) {
    _value[0] = position[0]
    _value[1] = position[1]
    if (position.length > 2) _value[2] = position[2]
  } else if (is.plainObject(position)) {
    _value[0] = position.lon ?? position.longitude ?? position.x ?? null
    _value[1] = position.lat ?? position.latitude ?? position.y ?? null
    _value[2] = position.alt ?? position.altitude ?? position.z ?? null
  }

  return {
    get type () { return 'Position' },
    get dimension () { return is.defined(_value[2]) ? 3 : 2 },
    get longitude () { return _value[0] },
    get latitude () { return _value[1] },
    get altitude () { return _value[2] },
    set longitude (lon) { _value[0] = lon },
    set latitude (lat) { _value[1] = lat },
    set altitude (alt) { _value[2] = alt },

    isValid () {
      if (!is.number(_value[0])) return false
      if (!is.number(_value[1])) return false
      if (is.defined(_value[2]) && !is.number(_value[2])) return false
      return true
    },

    normalize () {
      asserts.that(this, (v) => v.isValid(), 'this must be a valid Coord')
      let lon = _value[0]
      let lat = _value[1]
      if (lat < -90 || lat > 90) {
        lat = ((lat + 180) % 360 + 360) % 360 - 180
        if (lat > 90) {
          lat = 180 - lat
          lon += 180
        } else if (lat < -90) {
          lat = -180 - lat
          lon += 180
        }
      }
      if (lon < -180 || lon > 180) {
        lon = ((lon + 180) % 360 + 360) % 360 - 180
        if (lon === -180) lon = 180
        if (Object.is(lon, -0)) lon = 0
      }
      _value[0] = lon
      _value[1] = lat
      return this
    },

    truncate (precision = 7) {
      asserts.all([
        { value: precision, validator: (p) => is.inRange(p, 0, 8), message: 'precision must be in range [0, 8]' },
        { value: this, validator: (v) => v.isValid(), message: 'this must be valid' }
      ])
      _value[0] = truncateCoordinate(_value[0], precision)
      _value[1] = truncateCoordinate(_value[1], precision)
      if (is.defined(_value[2])) _value[2] = truncateCoordinate(_value[2], precision)
      return this
    },

    toArray () {
      if (!this.isValid()) return null
      return is.defined(_value[2]) ? [..._value] : [_value[0], _value[1]]
    },

    toJSON () {
      if (!this.isValid()) return null
      const json = {
        lon: _value[0],
        lat: _value[1]
      }
      if (is.defined(_value[2])) json.alt = _value[2]
      return json
    },

    toGeoJSON () {
      if (!this.isValid()) return null
      return { coordinates: this.toArray() }
    },

    toString (format, decimalPlaces = 5) {
      asserts.all([
        { value: format, validator: is.nonEmptyString, message: 'format must be a non-empty string' },
        { value: decimalPlaces, validator: is.positiveInteger, message: 'options must be a positive integer' }
      ])
      if (!this.isValid()) return null
      const latDD = COORDINATE_MODELS.DD({
        degrees: Math.abs(_value[1]),
        direction: _value[1] < 0 ? getSouth().symbol : getNorth().symbol
      })
      const lat = convertCoordinate(latDD, format)
      if (!lat.isValid()) return ''
      const lonDD = COORDINATE_MODELS.DD({
        degrees: Math.abs(_value[0]),
        direction: _value[0] < 0 ? getWest().symbol : getEast().symbol
      })
      const lon = convertCoordinate(lonDD, format)
      if (!lon.isValid()) return ''
      return `${lat.toString(decimalPlaces)} ${lon.toString(decimalPlaces)}`
    }
  }
}

export function isPosition (position) {
  return is.defined(position) && position.type === 'Position'
}

export function parsePosition (pattern) {
  asserts.that(pattern, (v) => is.nonEmptyString(v), 'pattern must be a non-empty string')
  const parts = pattern.split(/[,;|]/)
  if (parts.length !== 2) return null
  const [first, second] = parts.map(parseCoordinate)
  if (!first || !second) return null
  const firstDD = first.toDecimal()
  const secondDD = second.toDecimal()
  const firstAxis = guessCoordinateAxis(firstDD.degrees, firstDD.direction)
  const secondAxis = guessCoordinateAxis(secondDD.degrees, secondDD.direction)
  // If both ar explicit or one is explicit, the other is ambiguous
  if ((firstAxis === AXES.LONGITUDE && secondAxis === AXES.LATITUDE) ||
      (firstAxis === AXES.LONGITUDE && is.array(secondAxis)) ||
      (secondAxis === AXES.LATITUDE && is.array(firstAxis))) {
    return Position([firstDD.degrees, secondDD.degrees])
  }
  if ((firstAxis === AXES.LATITUDE && secondAxis === AXES.LONGITUDE) ||
      (firstAxis === AXES.LATITUDE && is.array(secondAxis)) ||
      (secondAxis === AXES.LONGITUDE && is.array(firstAxis))) {
    return Position([secondDD.degrees, firstDD.degrees])
  }
  // If both are ambiguous → assume [lat, lon] order by convention
  if (!firstAxis && !secondAxis) {
    return [
      Position([firstDD.degrees, secondDD.degrees]),
      Position([secondDD.degrees, firstDD.degrees])
    ]
  }
}
