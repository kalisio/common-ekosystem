import chroma from 'chroma-js'
import { assert, is, has } from '@kalisio/common-core/predicates'

export const COLORS = Object.freeze(Object.keys(chroma.colors))

function pick (value, colors, metric, isBetter) {
  const ref = chroma(value)
  let best = colors[0]
  let bestScore = metric(ref, best)
  for (let i = 1; i < colors.length; i++) {
    const score = metric(ref, colors[i])
    if (isBetter(score, bestScore)) {
      best = colors[i]
      bestScore = score
    }
  }
  return best
}

export const color = {

  is (value) {
    return chroma.valid(value)
  },

  nearest (value, colors = COLORS) {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: colors, validator: is.nonEmptyArray, message: 'colors must be a non empty array' }
    ])
    return pick(value, colors, chroma.distance, (a, b) => a < b)
  },

  farthest (value, colors = COLORS) {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: colors, validator: is.nonEmptyArray, message: 'colors must be a non empty array' }
    ])
    return pick(value, colors, chroma.distance, (a, b) => a > b)
  },

  contrast (value, light = 'white', dark = 'black') {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: light, validator: color.is, message: 'light must be a color' },
      { value: dark, validator: color.is, message: 'dark must be a color' }
    ])
    return pick(value, [light, dark], chroma.contrast, (a, b) => a > b)
  },

  scale (options) {
    assert.that(options, (v) => has.key(v, 'colors'), 'options must have the colors property')
    let result = chroma.scale(options.colors)
    if (options.domain && !is.array(options.classes)) result = result.domain(options.domain)
    if (options.classes != null) result = result.classes(options.classes)
    return result
  }

}
