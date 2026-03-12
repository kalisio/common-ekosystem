import { asserts, is } from '@kalisio/check'
import { axes } from './axes.js'
import { directions } from './directions.js'

export const COORD_TRUNCATION_FACTORS = Array.from({ length: 9 }, (_, i) => 10 ** i)

export const coordinate = {

  truncate (coord, precision) {
    asserts.all([
      { value: coord, validator: is.number, message: 'coord must be a number' },
      { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' }
    ])
    const factor = COORD_TRUNCATION_FACTORS[precision]
    return Math.round(coord * factor) / factor
  },

  normalize (coord, axis) {
    asserts.all([
      { value: coord, validator: is.number, message: 'coord must be a number' },
      { value: axis, validator: (v) => axes.isLongitude(v) || axes.isLatitude(v), message: 'axis must be either a longitude or latitude' }
    ])
    if (axes.isLatitude(axis)) {
      // latitude is bounded to [-90, 90] — no wrapping, just clamp
      return Math.max(-90, Math.min(90, coord))
    }
    // longitude wraps around [-180, 180]
    let lon = ((coord + 180) % 360 + 360) % 360 - 180
    if (lon === -180) lon = 180
    if (Object.is(lon, -0)) lon = 0
    return lon
  },

  toSexagesimal (coord, axis = undefined) {
    asserts.that(coord, is.number, 'coord must be a number')
    const abs = Math.abs(coord)
    const deg = Math.floor(abs)
    const minFloat = (abs - deg) * 60
    const min = Math.floor(minFloat)
    const sec = (minFloat - min) * 60
    if (is.defined(axis)) {
      asserts.that(axis, (v) => axes.isLongitude(v) || axes.isLatitude(v), 'axis must be either a longitude or latitude')
      let dir
      if (axes.isLatitude(axis)) {
        dir = coord < 0 ? directions.getSouth().symbol : directions.getNorth().symbol
      } else {
        dir = coord < 0 ? directions.getWest().symbol : directions.getEast().symbol
      }
      return { deg, min, sec, dir }
    }
    // deg is always positive internally, re-apply sign for the no-type case
    return { deg: coord < 0 ? -deg : deg, min, sec }
  },

  fromSexagesimal (deg, min = 0, sec = 0, dir = undefined) {
    asserts.all([
      { value: deg, validator: is.number, message: 'deg must be a number' },
      { value: min, validator: (v) => is.inRange(v, 0, 60), message: 'min must be in range [0, 60]' },
      { value: sec, validator: (v) => is.inRange(v, 0, 60), message: 'sec must be in range [0, 60]' }
    ])
    let sign = Math.sign(deg) || 1
    if (is.defined(dir)) {
      asserts.that(dir, (v) => directions.isDirection(v), 'dir must be a direction')
      asserts.that(sign, is.positive, 'deg sign must be positive')
      if (directions.isSouth(dir) || directions.isWest(dir)) sign = -1
    }
    const dd = Math.abs(deg) + (min / 60) + (sec / 3600)
    return dd * sign
  },

  parse (pattern) {
    asserts.that(pattern, is.string, 'pattern must be a string')
    if (is.emptyString(pattern)) return null
    const input = pattern.trim()
    // DMS: 48°30'36"N | 48 30 36 N | 48°30'36.5"
    const dmsRegex = /^(-?\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSEWnsew]?)$/
    const dmsMatch = input.match(dmsRegex)
    if (dmsMatch) {
      const deg = parseFloat(dmsMatch[1])
      const min = parseFloat(dmsMatch[2])
      const sec = parseFloat(dmsMatch[3])
      const dir = dmsMatch[4] || undefined
      const value = this.fromSexagesimal(deg, min, sec, dir)
      return {
        value,
        format: 'DMS',
        type: axes.guessAxis(value, dir)
      }
    }
    // DM: 48°30'N | 48 30 N | 48°30.5'
    const dmRegex = /^(-?\d+)[°\s]+(\d+(?:\.\d+)?)['\s]*([NSEWnsew]?)$/
    const dmMatch = input.match(dmRegex)
    if (dmMatch) {
      const deg = parseFloat(dmMatch[1])
      const min = parseFloat(dmMatch[2])
      const dir = dmMatch[3] || undefined
      const value = this.fromSexagesimal(deg, min, 0, dir)
      return {
        value,
        format: 'DM',
        type: axes.guessAxis(value, dir)
      }
    }
    // DD: 48.8566 | 48.8566N | -2.3522
    const ddRegex = /^(-?\d+(?:\.\d+)?)\s*([NSEWnsew]?)$/
    const ddMatch = input.match(ddRegex)
    if (ddMatch) {
      let value = parseFloat(ddMatch[1])
      const dir = ddMatch[2] || undefined
      if (is.defined(dir) && (directions.isSouth(dir) || directions.isWest(dir))) value = -Math.abs(value)
      return {
        value,
        format: 'DD',
        type: axes.guessAxis(value, dir)
      }
    }
    return null
  }
}
