import { assert, is, has } from '@kalisio/check'
import { Point } from '../geometry/point.js'

export function BoundingBox (bbox) {
  let _min = null
  let _max = null
  let _isValid = false

  if (is.array(bbox) && bbox.length === 2) {
    _min = Point(bbox[0])
    _max = Point(bbox[1])
    _isValid = _min.isValid() && _max.isValid()
  } else if (is.plainObject(bbox) && has.keys(bbox, ['min', 'max'])) {
    _min = Point(bbox.min)
    _max = Point(bbox.max)
    _isValid = _min.isValid() && _max.isValid()
  }

  return {
    get type () { return 'BoundingBox' },
    get dimension () { return _isValid ? _min.dimension : 0 },
    get min () { return _min },
    get max () { return _max },

    isValid () {
      return _isValid
    },

    truncate (precision = 7) {
      assert.all([
        { value: precision, validator: (v) => is.inRange(v, 0, 8), message: 'precision must be in range [0, 8]' },
        { value: this, validator: (v) => v.isValid, message: 'this must be a valid BBox' }
      ])
      _min.truncate(precision)
      _max.truncate(precision)
      return this
    },

    extend (point) {
      assert.all([
        { value: point, validator: (v) => is.defined(v) && v.isValid(), message: 'point must be a valid Point' },
        { value: this, validator: (v) => v.isValid, message: 'this must be a valid BBox' }
      ])
      _min.longitude = Math.min(_min.longitude, point.longitude)
      _min.latitude = Math.min(_min.latitude, point.latitude)
      _max.longitude = Math.max(_max.longitude, point.longitude)
      _max.latitude = Math.max(_max.latitude, point.latitude)
      if (this.dimension === 3) {
        const alt = point.altitude ?? 0
        _min.altitude = Math.min(_min.altitude, alt)
        _max.altitude = Math.max(_max.altitude, alt)
      }
      return this
    },

    merge (bbox) {
      assert.all([
        { value: bbox, validator: (v) => is.defined(v) && v.isValid, message: 'v must be a valid BBox' },
        { value: this, validator: (v) => v.isValid, message: 'this must be a valid BBox' }
      ])
      return this.extend(bbox.max).extend(bbox.min)
    },

    toArray () {
      if (!_isValid) return null
      return [_min.toArray(), _max.toArray()]
    },

    toJSON () {
      if (!_isValid) return null
      return {
        min: _min.toJSON(),
        max: _max.toJSON()
      }
    },

    toGeoJSON () {
      if (!_isValid) return null
      return { bbox: [..._min.toArray(), ..._max.toArray()] }
    }
  }
}
