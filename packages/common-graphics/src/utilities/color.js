import chroma from 'chroma-js'
import { assert, is, has } from '@kalisio/common-core'

export const color = {

  is (value) {
    return chroma.valid(value)
  },

  contrast (value, light = 'white', dark = 'black') {
    assert.all([
      { value, validator: color.is, message: 'value must be a color' },
      { value: light, validator: color.is, message: 'light must be a color' },
      { value: dark, validator: color.is, message: 'dark must be a color' }
    ])
    return chroma.contrast(value, light) < chroma.contrast(value, dark) ? dark : light
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
