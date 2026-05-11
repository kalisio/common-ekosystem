import { is } from '@kalisio/common-core'
import chroma from 'chroma-js'

export const color = {

  is (value) {
    return chroma.valid(value) // chroma.isValid n'existe pas, c'est chroma.valid
  },

  contrast (value, light = 'white', dark = 'black') {
    return chroma.contrast(value, 'white') < chroma.contrast(value, 'black') ? dark : light
  },

  scale (options) {
    let result = chroma.scale(options.colors)
    if (options.classes) {
      if (is.array(options.classes)) {
        result = result.classes(options.classes)
      } else {
        if (options.domain) result = result.domain(options.domain).classes(options.classes)
        else result = result.classes(options.classes)
      }
    } else if (options.domain) result = result.domain(options.domain)
    return result
  }

}
