import chroma from 'chroma-js'
import { assert, is, has } from '@kalisio/common-core/predicates'

export const color = {

  is (value) {
    return chroma.valid(value)
  },

  nearest (value, colors = Object.keys(chroma.colors)) {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: colors, validator: is.nonEmptyArray, message: 'colors must be a non empty array' }
    ])
    return colors.reduce((nearest, current) => {
      return chroma.distance(value, current) < chroma.distance(value, nearest)
        ? current
        : nearest
    }, colors[0])
  },

  farthest (value, colors = Object.keys(chroma.colors)) {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: colors, validator: is.nonEmptyArray, message: 'colors must be a non empty array' }
    ])
    return colors.reduce((farthest, current) => {
      return chroma.contrast(value, current) > chroma.contrast(value, farthest)
        ? current
        : farthest
    }, colors[0])
  },

  contrast (value, light = 'white', dark = 'black') {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: light, validator: color.is, message: 'light must be a color' },
      { value: dark, validator: color.is, message: 'dark must be a color' }
    ])
    return color.farthest(value, [light, dark])
  },

  scale (options) {
    assert.that(options, (v) => has.key(v, 'colors'), 'options must have the colors property')
    let result = chroma.scale(options.colors)
    if (is.array(options.classes)) {
      result = result.classes(options.classes)
    } else {
      if (options.domain) result = result.domain(options.domain)
      if (options.classes) result = result.classes(options.classes)
    }
    return result
  }

}
