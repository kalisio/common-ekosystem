import { asserts, is } from '@kalisio/check'
import { axes, coordinate } from '../core'
import { COORD_FORMATS, COORD_UNITS } from './constants.js'

export function Position (position) {
  const value = [null, null, null]

  if (is.array(position) && position.length > 1) {
    value[0] = position[0]
    value[1] = position[1]
    if (position.length > 2) value[2] = position[2]
  } else if (is.plainObject(position)) {
    value[0] = position.lon ?? position.longitude ?? position.x ?? null
    value[1] = position.lat ?? position.latitude ?? position.y ?? null
    value[2] = position.alt ?? position.altitude ?? position.z ?? null
  }

  return {
    get dimension () { return is.defined(value[2]) ? 3 : 2 },
    get longitude () { return value[0] },
    get latitude () { return value[1] },
    get altitude () { return value[2] },
    set longitude (lon) { value[0] = lon },
    set latitude (lat) { value[1] = lat },
    set altitude (alt) { value[2] = alt },

    isValid () {
      if (!is.number(value[0])) return false
      if (!is.number(value[1])) return false
      if (is.defined(value[2]) && !is.number(value[2])) return false
      return true
    },

    normalize () {
      asserts.that(this, (v) => v.isValid(), 'this must be a valid Coord')
      let lon = value[0]
      let lat = value[1]
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
      value[0] = lon
      value[1] = lat
      return this
    },

    truncate (precision = 7) {
      asserts.all([
        { value: precision, validator: (p) => is.inRange(p, 0, 8), message: 'precision must be in range [0, 8]' },
        { value: this, validator: (v) => v.isValid(), message: 'this must be valid' }
      ])
      value[0] = coordinate.truncate(value[0], precision)
      value[1] = coordinate.truncate(value[1], precision)
      if (is.defined(value[2])) value[2] = coordinate.truncate(value[2], precision)
      return this
    },

    toArray () {
      if (!this.isValid()) return null
      return is.defined(value[2]) ? [...value] : [value[0], value[1]]
    },

    toJSON () {
      if (!this.isValid()) return null
      const json = {
        lon: value[0],
        lat: value[1]
      }
      if (is.defined(value[2])) json.alt = value[2]
      return json
    },

    toGeoJSON () {
      if (!this.isValid()) return null
      return { coordinates: this.toArray() }
    },

    toSexagesimal () {
      if (!this.isValid()) return null
      const json = {
        lon: coordinate.toSexagesimal(value[0], axes.LONGITUDE),
        lat: coordinate.toSexagesimal(value[1], axes.LATITUDE)
      }
      if (is.defined(value[2])) json.alt = value[2]
      return json
    },

    toString (format, options = {}) {
      asserts.all([
        { value: format, validator: (v) => !is.emptyString(v), message: 'format must be a non-empty string' },
        { value: options, validator: is.plainObject, message: 'options must be an object' }
      ])
      if (!this.isValid()) return null
      const { latLonSeparator = ' ', decimalPlaces = 5 } = options
      const dp = parseInt(decimalPlaces)
      const resolvedFormat = COORD_FORMATS[format] ?? format // 'FFf' → 'DD MM ss X', or custom format
      const dms = this.toSexagesimal()
      if (resolvedFormat === 'AERO') {
        const latDeg = dms.lat.deg.toString().padStart(2, '0')
        const latMin = Math.floor(dms.lat.min * 10 + dms.lat.sec / 6).toString().padStart(3, '0')
        const lonDeg = dms.lon.deg.toString().padStart(3, '0')
        const lonMin = Math.floor(dms.lon.min * 10 + dms.lon.sec / 6).toString().padStart(3, '0')
        return `${latDeg}${latMin}${dms.lat.dir} ${lonDeg}${lonMin}${dms.lon.dir}`
      }
      const formatFor = (d) => resolvedFormat
        .replace(/DD/g, d.deg + COORD_UNITS.degrees)
        .replace(/dd/g, (d.deg + d.min / 60 + d.sec / 3600).toFixed(dp) + COORD_UNITS.degrees)
        .replace(/D/g, d.deg)
        .replace(/d/g, (d.deg + d.min / 60 + d.sec / 3600).toFixed(dp))
        .replace(/MM/g, d.min + COORD_UNITS.minutes)
        .replace(/mm/g, (d.min + d.sec / 60).toFixed(dp) + COORD_UNITS.minutes)
        .replace(/M/g, d.min)
        .replace(/m/g, (d.min + d.sec / 60).toFixed(dp))
        .replace(/ss/g, d.sec.toFixed(dp) + COORD_UNITS.seconds)
        .replace(/s/g, d.sec.toFixed(dp))
        .replace(/X/g, d.dir)
      return formatFor(dms.lat) + latLonSeparator + formatFor(dms.lon)
    }
  }
}

export function parsePosition (pattern) {
  asserts.that(pattern, (v) => is.string(v), 'pattern must be a non-empty string')
  const parts = pattern.split(/[,;|]/)
  if (parts.length !== 2) return null
  const [first, second] = parts.map(coordinate.parse)
  // Both parts should have the same format
  if (first.format !== second.format) return null
  // If both types are explicit
  if (first.type === axes.LONGITUDE && second.type === axes.LATITUDE) return Position([first.value, second.value])
  if (first.type === axes.LATITUDE && second.type === axes.LONGITUDE) return Position([second.value, first.value])
  // If one is explicit, the other is ambiguous
  if ((first.type === axes.LONGITUDE && is.array(second.type)) ||
      (second.type === axes.LATITUDE && is.array(first.type))) return Position([first.value, second.value])
  if ((first.type === axes.LATITUDE && is.array(second.type)) ||
      (second.type === axes.LONGITUDE && is.array(first.type))) return Position([second.value, first.value])
  // If both are ambiguous → assume [lat, lon] order by convention
  if (is.array(first.type) && is.array(second.type)) {
    return [
      Position([first.value, second.value]),
      Position([second.value, first.value])
    ]
  }
}
