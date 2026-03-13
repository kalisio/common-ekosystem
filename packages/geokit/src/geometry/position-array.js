import { asserts, is } from '@kalisio/check'
import { coordinate } from '../core'
import { Position } from './position.js'
import { BoundingBox } from './bounding-box.js'

export function PositionArray (points = []) {
  const hasAlt = points.some(p => (is.array(p) && p.length > 2) || (p && (p.alt != null || p.z != null)))
  const stride = hasAlt ? 3 : 2
  const buffer = new Float64Array(points.length * stride)
  let isValid = true

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const lon = p.lon ?? p.longitude ?? p[0] ?? null
    const lat = p.lat ?? p.latitude ?? p[1] ?? null
    if (!is.number(lon) || !is.number(lat)) {
      isValid = false
      break
    }
    buffer[i * stride + 0] = lon
    buffer[i * stride + 1] = lat
    if (stride === 3) {
      const alt = p.alt ?? p.z ?? p[2] ?? 0
      if (!is.number(alt)) {
        isValid = false
        break
      }
      buffer[i * stride + 2] = alt
    }
  }

  const length = points.length

  const positionAt = (i) => {
    const value = stride === 3
      ? [buffer[i * stride], buffer[i * stride + 1], buffer[i * stride + 2]]
      : [buffer[i * stride], buffer[i * stride + 1]]
    return Position(value)
  }

  return {
    length,
    stride,
    buffer,
    isValid,
    at: positionAt,

    get dimension () { return stride },

    [Symbol.iterator]: function * () {
      if (!isValid || length === 0) return
      for (let i = 0; i < length; i++) yield positionAt(i)
    },

    forEach (fn) {
      if (!isValid || length === 0) return
      for (let i = 0; i < length; i++) fn(positionAt(i), i)
    },

    map (fn) {
      const results = []
      if (!isValid || length === 0) return results
      for (let i = 0; i < length; i++) results.push(fn(positionAt(i), i))
      return results
    },

    toArray () {
      const arr = []
      if (!isValid || length === 0) return arr
      for (let i = 0; i < length; i++) arr.push(positionAt(i).toArray())
      return arr
    },

    toGeoJSON () {
      const coordinates = []
      if (!isValid || length === 0) return { coordinates }
      for (let i = 0; i < length; i++) {
        const c = positionAt(i)
        const arr = c.altitude != null ? [c.longitude, c.latitude, c.altitude] : [c.longitude, c.latitude]
        coordinates.push(arr)
      }
      return { coordinates }
    },

    truncate (precision = 7) {
      asserts.all([
        { value: precision, validator: (p) => is.inRange(p, 0, 8), message: 'precision must be in range [0,8]' },
        { value: this, validator: (v) => v.isValid, message: 'this must be valid' }
      ])
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = coordinate.truncate(buffer[i], precision)
      }
      return this
    },

    bbox () {
      if (!isValid || length === 0) return null
      let minLon = Infinity; let maxLon = -Infinity
      let minLat = Infinity; let maxLat = -Infinity
      let minAlt = Infinity; let maxAlt = -Infinity
      if (stride === 2) {
        for (let i = 0; i < length; i++) {
          const lon = buffer[i * stride]
          const lat = buffer[i * stride + 1]
          minLon = Math.min(minLon, lon)
          minLat = Math.min(minLat, lat)
          maxLon = Math.max(maxLon, lon)
          maxLat = Math.max(maxLat, lat)
        }
        return BoundingBox([[minLon, minLat], [maxLon, maxLat]])
      }
      for (let i = 0; i < length; i++) {
        const lon = buffer[i * stride]
        const lat = buffer[i * stride + 1]
        const alt = buffer[i * stride + 2]
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
      if (!isValid || length === 0) return null
      let sumLon = 0; let sumLat = 0; let sumAlt = 0
      if (stride === 2) {
        for (let i = 0; i < length; i++) {
          sumLon += buffer[i * stride]
          sumLat += buffer[i * stride + 1]
        }
        return Position([sumLon / length, sumLat / length])
      }
      for (let i = 0; i < length; i++) {
        sumLon += buffer[i * stride]
        sumLat += buffer[i * stride + 1]
        sumAlt += buffer[i * stride + 2]
      }
      return Position([sumLon / length, sumLat / length, sumAlt / length])
    }
  }
}
