import { assert, is } from '../predicates'

export const math = {

  square (value) {
    assert.that(value, is.number, 'value must be a number')
    return value * value
  },

  cube (value) {
    assert.that(value, is.number, 'value must be a number')
    return math.square(value) * value
  },

  clamp (value, min, max) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: min, validator: is.number, message: 'min must be a number' },
      { value: max, validator: is.number, message: 'max must be a number' }
    ])
    return Math.min(Math.max(value, min), max)
  },

  round (value, precision = 2) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: precision, validator: is.positiveInteger, message: 'precision must be a positive integer' }
    ])
    const factor = 10 ** precision
    return Math.round(value * factor) / factor
  },

  percentage (value, total) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: total, validator: is.number, message: 'total must be a number' }
    ])
    return math.round(value / total * 100, 2)
  },

  linear (t, initial = 0, final = 1) {
    assert.all([
      { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
      { value: initial, validator: is.number, message: 'initial must be a number' },
      { value: final, validator: is.number, message: 'final must be a number' }
    ])
    return initial + t * (final - initial)
  },

  easeIn (t, linearity = 0.5) {
    assert.all([
      { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
      { value: linearity, validator: is.number, message: 'linearity must be a number' }
    ])
    return Math.pow(t, 1 / linearity)
  },

  easeOut (t, linearity = 0.5) {
    assert.all([
      { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
      { value: linearity, validator: is.number, message: 'linearity must be a number' }
    ])
    return 1 - Math.pow(1 - t, 1 / linearity)
  },

  cubicBezier (t, x1 = 0.42, y1 = 0, x2 = 0.58, y2 = 1) {
    const u = 1 - t
    const tt = t * t
    const uu = u * u
    return uu * u * y1 + 3 * uu * t * x1 + 3 * u * tt * x2 + tt * t * y2
  },

  sum (values) {
    assert.that(values, is.array, 'values must be an array')
    return values.reduce((acc, v) => acc + v, 0)
  },

  average (values) {
    assert.that(values, is.nonEmptyArray, 'values must be a non-empty array')
    return math.sum(values) / values.length
  },

  median (values) {
    assert.that(values, is.nonEmptyArray, 'values must be a non-empty array')
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? math.linear(0.5, sorted[mid - 1], sorted[mid])
      : sorted[mid]
  }

}
