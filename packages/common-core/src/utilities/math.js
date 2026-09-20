import { assert, is } from '../predicates/index.js'

export const math = {

  clamp (value, min, max) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: min, validator: is.number, message: 'min must be a number' },
      { value: max, validator: is.number, message: 'max must be a number' },
      { value: max, validator: (v) => v >= min, message: 'max must be greater than or equal to min' }
    ])
    return Math.min(Math.max(value, min), max)
  },

  round (value, precision = 2) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: precision, validator: is.nonNegativeInteger, message: 'precision must be a non-negative integer' }
    ])
    const factor = 10 ** precision
    return Math.round(value * factor) / factor
  },

  sign (value, epsilon = 0) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: epsilon, validator: is.nonNegative, message: 'epsilon must be a non-negative number' }
    ])
    if (value > epsilon) return 1
    if (value < -epsilon) return -1
    return 0
  },

  percentage (value, total) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: total, validator: is.positive, message: 'total must be a positive number' }
    ])
    return math.round(value / total * 100, 2)
  },

  exponential (value, decimals = 2) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: decimals, validator: is.nonNegativeInteger, message: 'decimals must be a non-negative integer' }
    ])
    if (value === 0) return `0.${'0'.repeat(decimals)}e+0`
    const exp = Math.floor(Math.log10(Math.abs(value)))
    const mantissa = value / Math.pow(10, exp)
    const fixed = mantissa.toFixed(decimals)
    return `${fixed}e${exp >= 0 ? '+' : ''}${exp}`
  },

  linear (t, initial = 0, final = 1) {
    assert.all([
      { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
      { value: initial, validator: is.number, message: 'initial must be a number' },
      { value: final, validator: is.number, message: 'final must be a number' }
    ])
    return initial + t * (final - initial)
  },

  to: {
    radians (degrees) {
      assert.that(degrees, is.number, 'degrees must be a number')
      return (degrees * Math.PI) / 180
    },

    degrees (radians) {
      assert.that(radians, is.number, 'radians must be a number')
      return (radians * 180) / Math.PI
    }
  },

  pow: {
    square (value) {
      assert.that(value, is.number, 'value must be a number')
      return value * value
    },

    cube (value) {
      assert.that(value, is.number, 'value must be a number')
      return math.pow.square(value) * value
    }
  },

  ease: {
    in (t, linearity = 0.5) {
      assert.all([
        { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
        { value: linearity, validator: is.positive, message: 'linearity must be a positive number' }
      ])
      return Math.pow(t, 1 / linearity)
    },

    out (t, linearity = 0.5) {
      assert.all([
        { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
        { value: linearity, validator: is.positive, message: 'linearity must be a positive number' }
      ])
      return 1 - Math.pow(1 - t, 1 / linearity)
    },

    cubicBezier (t, p0 = 0, p1 = 0.42, p2 = 0.58, p3 = 1) {
      assert.all([
        { value: t, validator: (v) => is.inRange(v, 0, 1), message: 't must be in range [0, 1]' },
        { value: p0, validator: is.number, message: 'p0 must be a number' },
        { value: p1, validator: is.number, message: 'p1 must be a number' },
        { value: p2, validator: is.number, message: 'p2 must be a number' },
        { value: p3, validator: is.number, message: 'p3 must be a number' }
      ])
      const u = 1 - t
      return (
        u * u * u * p0 +
        3 * u * u * t * p1 +
        3 * u * t * t * p2 +
        t * t * t * p3
      )
    }
  },

  stats: {
    sum (values) {
      assert.that(
        values,
        (v) => is.array(v) && v.every(is.number),
        'values must be an array of numbers'
      )
      return values.reduce((acc, v) => acc + v, 0)
    },

    average (values) {
      assert.that(
        values,
        (v) => is.nonEmptyArray(v) && v.every(is.number),
        'values must be a non-empty array of numbers'
      )
      return math.stats.sum(values) / values.length
    },

    median (values) {
      assert.that(
        values,
        (v) => is.nonEmptyArray(v) && v.every(is.number),
        'values must be a non-empty array of numbers'
      )
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0
        ? math.linear(0.5, sorted[mid - 1], sorted[mid])
        : sorted[mid]
    }
  }

}
