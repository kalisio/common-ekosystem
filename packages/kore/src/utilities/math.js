import { assert, is } from '../predicates'

export const math = {

  square (value) {
    assert.that(value, is.number, 'value must be a number')
    return value * value
  },

  cube (value) {
    assert.that(value, is.number, 'value must be a number')
    return this.square(value) * value
  },

  clamp (value, min, max) {
    assert.all([
      { value, validator: is.number, message: 'value must be a number' },
      { value: min, validator: is.number, message: 'min must be a number' },
      { value: max, validator: is.number, message: 'max must be a number' }
    ])
    return Math.min(Math.max(value, min), max)
  },

  easeIn (t, linearity = 0.5) {
    assert.all([
      { value: t, validator: is.inRange(0, 1), message: 't must be in range [0, 1]' },
      { value: linearity, validator: is.number, message: 'linearity must be a number' }
    ])
    return Math.pow(t, 1 / linearity)
  },

  easeOut (t, linearity = 0.5) {
    assert.all([
      { value: t, validator: is.inRange(0, 1), message: 't must be in range [0, 1]' },
      { value: linearity, validator: is.number, message: 'linearity must be a number' }
    ])
    return 1 - Math.pow(1 - t, 1 / linearity)
  },

  linear (t, initial = 0, final = 1) {
    assert.all([
      { value: t, validator: is.inRange(0, 1), message: 't must be in range [0, 1]' },
      { value: initial, validator: is.number, message: 'initial must be a number' },
      { value: final, validator: is.number, message: 'final must be a number' }
    ])
    return initial + t * final
  },

  cubicBezier (t, x1 = 0.42, y1 = 0, x2 = 0.58, y2 = 1) {
    const u = 1 - t
    const tt = t * t
    const uu = u * u
    return uu * u * y1 + 3 * uu * t * x1 + 3 * u * tt * x2 + tt * t * y2
  }
}
