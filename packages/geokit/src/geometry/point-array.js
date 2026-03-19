import { asserts, is } from '@kalisio/check'
import { truncateCoordinate } from '../core/index.js'
import { Point } from './point.js'
import { BoundingBox } from './bounding-box.js'

export function PointArray (points = []) {
  asserts.that(points, is.array, 'points must be an array')
  const _hasAlt = points.some(p => (is.array(p) && p.length > 2) || (p && (p.alt != null || p.z != null)))
  const _stride = _hasAlt ? 3 : 2
  const _buffer = new Float64Array(points.length * _stride)
  const _length = points.length
  let _isValid = true

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const lon = p.lon ?? p.longitude ?? p[0] ?? null
    const lat = p.lat ?? p.latitude ?? p[1] ?? null
    if (!is.number(lon) || !is.number(lat)) {
      _isValid = false
      break
    }
    _buffer[i * _stride + 0] = lon
    _buffer[i * _stride + 1] = lat
    if (_stride === 3) {
      const alt = p.alt ?? p.z ?? p[2] ?? 0
      if (!is.number(alt)) {
        _isValid = false
        break
      }
      _buffer[i * _stride + 2] = alt
    }
  }

  const pointAt = (i) => {
    const value = _stride === 3
      ? [_buffer[i * _stride], _buffer[i * _stride + 1], _buffer[i * _stride + 2]]
      : [_buffer[i * _stride], _buffer[i * _stride + 1]]
    return Point(value)
  }

  return {
    get type () { return 'PointArray' },
    get dimension () { return _stride },
    get length () { return _length },
    get buffer () { return _buffer },
    at: pointAt,

    isValid () {
      return _isValid
    },

    [Symbol.iterator]: function * () {
      if (!_isValid || _length === 0) return
      for (let i = 0; i < _length; i++) yield pointAt(i)
    },

    forEach (fn) {
      if (!_isValid || _length === 0) return
      for (let i = 0; i < _length; i++) fn(pointAt(i), i)
    },

    map (fn) {
      const results = []
      if (!_isValid || _length === 0) return results
      for (let i = 0; i < _length; i++) results.push(fn(pointAt(i), i))
      return results
    },

    toArray () {
      const arr = []
      if (!_isValid || _length === 0) return arr
      for (let i = 0; i < _length; i++) arr.push(pointAt(i).toArray())
      return arr
    },

    toGeoJSON () {
      const coordinates = []
      if (!_isValid || _length === 0) return { coordinates }
      for (let i = 0; i < _length; i++) {
        const c = pointAt(i)
        const arr = c.altitude != null ? [c.longitude, c.latitude, c.altitude] : [c.longitude, c.latitude]
        coordinates.push(arr)
      }
      return { coordinates }
    },

    truncate (precision = 7) {
      asserts.all([
        { value: precision, validator: (p) => is.inRange(p, 0, 8), message: 'precision must be in range [0,8]' },
        { value: this, validator: (v) => v.isValid(), message: 'this must be valid' }
      ])
      for (let i = 0; i < _buffer.length; i++) {
        _buffer[i] = truncateCoordinate(_buffer[i], precision)
      }
      return this
    },

    bbox () {
      if (!_isValid || _length === 0) return null
      let minLon = Infinity; let maxLon = -Infinity
      let minLat = Infinity; let maxLat = -Infinity
      let minAlt = Infinity; let maxAlt = -Infinity
      if (_stride === 2) {
        for (let i = 0; i < _length; i++) {
          const lon = _buffer[i * _stride]
          const lat = _buffer[i * _stride + 1]
          minLon = Math.min(minLon, lon)
          minLat = Math.min(minLat, lat)
          maxLon = Math.max(maxLon, lon)
          maxLat = Math.max(maxLat, lat)
        }
        return BoundingBox([[minLon, minLat], [maxLon, maxLat]])
      }
      for (let i = 0; i < _length; i++) {
        const lon = _buffer[i * _stride]
        const lat = _buffer[i * _stride + 1]
        const alt = _buffer[i * _stride + 2]
        minLon = Math.min(minLon, lon)
        minLat = Math.min(minLat, lat)
        maxLon = Math.max(maxLon, lon)
        maxLat = Math.max(maxLat, lat)
        minAlt = Math.min(minAlt, alt)
        maxAlt = Math.max(maxAlt, alt)
      }
      return BoundingBox([[minLon, minLat, minAlt], [maxLon, maxLat, maxAlt]])
    },

    centroid () {
      if (!_isValid || _length === 0) return null
      let sumLon = 0; let sumLat = 0; let sumAlt = 0
      if (_stride === 2) {
        for (let i = 0; i < _length; i++) {
          sumLon += _buffer[i * _stride]
          sumLat += _buffer[i * _stride + 1]
        }
        return Point([sumLon / _length, sumLat / _length])
      }
      for (let i = 0; i < _length; i++) {
        sumLon += _buffer[i * _stride]
        sumLat += _buffer[i * _stride + 1]
        sumAlt += _buffer[i * _stride + 2]
      }
      return Point([sumLon / _length, sumLat / _length, sumAlt / _length])
    }
  }
}
