import { asserts, is, has } from '@kalisio/check'
import { Position } from './position.js'

export function BoundingBox (bounds) {
  let min = null
  let max = null
  let isValid = false

  if (is.array(bounds) && bounds.length === 2) {
    min = Position(bounds[0])
    max = Position(bounds[1])
    isValid = min.isValid() && max.isValid()
  } else if (is.plainObject(bounds) && has.keys(bounds, ['min', 'max'])) {
    min = Position(bounds.min)
    max = Position(bounds.max)
    isValid = min.isValid() && max.isValid()
  }

  return {
    get min () { return min },
    get max () { return max },
    get isValid () { return isValid },
    get dimension () { return isValid ? min.dimension : 0 },

    truncate (precision = 7) {
      asserts.all([
        { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' },
        { value: this, validator: (v) => v.isValid, message: 'this must be a valid BBox' }
      ])
      min.truncate(precision)
      max.truncate(precision)
      return this
    },

    extend (position) {
      asserts.all([
        { value: position, validator: (v) => is.defined(v) && v.isValid(), message: 'position must be a valid Position' },
        { value: this, validator: (v) => v.isValid, message: 'this must be a valid BBox' }
      ])
      min.longitude = Math.min(min.longitude, position.longitude)
      min.latitude = Math.min(min.latitude, position.latitude)
      max.longitude = Math.max(max.longitude, position.longitude)
      max.latitude = Math.max(max.latitude, position.latitude)
      if (this.dimension === 3) {
        const alt = position.altitude ?? 0
        min.altitude = Math.min(min.altitude, alt)
        max.altitude = Math.max(max.altitude, alt)
      }
      return this
    },

    merge (bbox) {
      asserts.all([
        { value: bbox, validator: (v) => is.defined(v) && v.isValid, message: 'v must be a valid BBox' },
        { value: this, validator: (v) => v.isValid, message: 'this must be a valid BBox' }
      ])
      return this.extend(bbox.max).extend(bbox.min)
    },

    toArray () {
      if (!isValid) return null
      return [min.toArray(), max.toArray()]
    },

    toJSON () {
      if (!isValid) return null
      return {
        min: min.toJSON(),
        max: max.toJSON()
      }
    },

    toGeoJSON () {
      if (!isValid) return null
      return { bbox: [...min.toArray(), ...max.toArray()] }
    }
  }
}
