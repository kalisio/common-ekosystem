import { assert, is, has } from '@kalisio/common-core/predicates'
import { string } from '@kalisio/common-core/utilities'
import { Factory, Cache } from '@kalisio/common-core/structures'
import * as BUILTIN_SHAPES from './builtin-shapes/index.js'
import { toSVG, toPNG } from './renderers/index.js'

export class ShapeFactory {
  constructor (options) {
    this.registry = new Factory('shapes')
    this.svgCache = new Cache('svg', { max: options?.svgCacheSize || 100 })
    this.pngCache = new Cache('png', { max: options?.pngCacheSize || 100 })
    for (const [name, shape] of Object.entries(BUILTIN_SHAPES)) {
      this.registry.register(string.kebabCase(name), shape)
    }
    // Alias for compatibility
    this.registry.register('star', BUILTIN_SHAPES.star5)
  }

  list () {
    return [...this.registry.keys()]
  }

  has (type) {
    assert.that(type, is.string, 'type must be a string')
    return this.registry.has(type)
  }

  register (type, buildFn) {
    assert.all([
      { value: type, validator: is.string, message: 'type must be a string' },
      { value: buildFn, validator: is.function, message: 'buildFn must be a function' }
    ])
    if (this.registry.has(type)) {
      this.registry.replace(type, buildFn)
    } else {
      this.registry.register(type, buildFn)
    }
  }

  build (params) {
    assert.that(params, (v) => is.object(v) && has.key(v, 'shape'), 'params must be an object with the property shape')
    const shape = { ...params, ...this.registry.create(params.shape, params) }
    assert.all([
      { value: shape.width, validator: is.positiveInteger, message: 'shape.width must be a positive integer' },
      { value: shape.height, validator: is.positiveInteger, message: 'shape.height must be a positive integer' },
      { value: shape.margin, validator: is.nonNegativeInteger, message: 'shape.margin must be a non negative integer' }
    ])
    return {
      ...shape,
      toSVG: () => toSVG(shape, { pngCache: this.pngCache, svgCache: this.svgCache }),
      toPNG: () => toPNG(shape, { pngCache: this.pngCache, svgCache: this.svgCache })
    }
  }
}
