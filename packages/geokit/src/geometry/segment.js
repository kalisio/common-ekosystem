import { asserts, is } from '@kalisio/check'
import { Point, isPoint } from './point.js'

export function Segment (start, end) {
  asserts.all([
    { value: start, validator: is.defined, message: 'start must be defined' },
    { value: end, validator: is.defined, message: 'end must be defined' }
  ])
  const _start = isPoint(start) ? start : Point(start)
  const _end = isPoint(end) ? end : Point(end)
  let _length = null
  let _midpoint = null

  return {
    get type () { return 'Segment' },
    get start () { return _start },
    get end () { return _end },
    get dimension () { return _start.dimension },

    isValid () {
      return _start.isValid() && _end.isValid()
    },

    length () {
      if (!this.isValid()) return null
      if (_length === null) {
        const dLon = _end.longitude - _start.longitude
        const dLat = _end.latitude - _start.latitude
        _length = Math.sqrt(dLon * dLon + dLat * dLat)
      }
      return _length
    },

    midpoint () {
      if (!this.isValid()) return null
      if (_midpoint === null) {
        _midpoint = Point([
          (_start.longitude + _end.longitude) / 2,
          (_start.latitude + _end.latitude) / 2
        ])
      }
      return _midpoint
    },

    isOn (point) {

    },

    toArray () {
      if (!this.isValid()) return null
      return [_start.toArray(), _end.toArray()]
    },

    toGeoJSON () {
      if (!this.isValid()) return null
      return {
        type: 'LineString',
        coordinates: this.toArray()
      }
    }
  }
}

export function isSegment (obj) {
  return is.defined(obj) && obj.type === 'Segment'
}
