import { LRUCache } from 'lru-cache'
import { assert, is, has } from '@kalisio/common-core/predicates'
import { BUILTIN_SHAPES } from './builtin-shapes/index.js'
import { toSVG, toPNG } from './renderers/index.js'

export class ShapeFactory {
  constructor (options) {
    this.registry = new LRUCache({ max: options?.registrySize || 100 })
    this.svgCache = new LRUCache({ max: options?.svgCacheSize || 100 })
    this.pngCache = new LRUCache({ max: options?.pngCacheSize || 100 })
    this.registry.set('circle', BUILTIN_SHAPES.circle)
    this.registry.set('cross', BUILTIN_SHAPES.cross)
    this.registry.set('diamond', BUILTIN_SHAPES.diamond)
    this.registry.set('donut', BUILTIN_SHAPES.donut)
    this.registry.set('pie', BUILTIN_SHAPES.pie)
    this.registry.set('heart', BUILTIN_SHAPES.heart)
    this.registry.set('pentagon', BUILTIN_SHAPES.pentagon)
    this.registry.set('hexagon', BUILTIN_SHAPES.hexagon)
    this.registry.set('polygon', BUILTIN_SHAPES.polygon)
    this.registry.set('rect', BUILTIN_SHAPES.rect)
    this.registry.set('rounded-rect', BUILTIN_SHAPES.roundedRect)
    this.registry.set('star4', BUILTIN_SHAPES.star4)
    this.registry.set('star5', BUILTIN_SHAPES.star5)
    this.registry.set('star6', BUILTIN_SHAPES.star6)
    // Alias if we don't care about the number of branches
    this.registry.set('star', BUILTIN_SHAPES.star5)
    this.registry.set('triangle', BUILTIN_SHAPES.triangle)
    this.registry.set('triangle-down', BUILTIN_SHAPES.triangleDown)
    this.registry.set('triangle-right', BUILTIN_SHAPES.triangleRight)
    this.registry.set('triangle-left', BUILTIN_SHAPES.triangleLeft)
    this.registry.set('marker-pin', BUILTIN_SHAPES.markerPin)
    this.registry.set('square-pin', BUILTIN_SHAPES.squarePin)
  }

  list () {
    return [...this.registry.keys()]
  }

  has (type) {
    assert.that(type, is.string, 'type must a string')
    return this.registry.has(type)
  }

  register (type, buildFn) {
    assert.all([
      { value: type, validator: is.string, message: 'type must be a string' },
      { value: buildFn, validator: is.function, message: 'buildFn must be a function' }
    ])
    this.registry.set(type, buildFn)
  }

  build (params) {
    assert.that(params, (v) => has.key(v, 'shape'), 'params must be an object with the property shape')
    const buildFn = this.registry.get(params.shape)
    assert.that(buildFn, is.function, 'param.shape must be a known shape')
    const shape = { ...params, ...buildFn(params) }
    assert.all([
      { value: shape.width, validator: is.positiveInteger, message: 'shape.width must be a positive integer' },
      { value: shape.height, validator: is.positiveInteger, message: 'shape.height must be a positive integer' },
      { value: shape.margin, validator: is.positiveInteger, message: 'shape.margin must be a positive integer' }
    ])
    return {
      ...shape,
      toSVG: () => toSVG(shape, { pngCache: this.pngCache, svgCache: this.svgCache }),
      toPNG: () => toPNG(shape, { pngCache: this.pngCache, svgCache: this.svgCache })
    }
  }
}
