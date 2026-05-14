import { getLogger } from '@logtape/logtape'
import { LRUCache } from 'lru-cache'
import { is } from '@kalisio/common-core'
import { ShapeRegistry } from './shape-registry.js'
import { toSVG } from './renderers/to-svg.js'
import { toPNG } from './renderers/to-png.js'

const logger = getLogger(['common-graphics', 'shape-generator'])

export class ShapeGenerator {
  constructor (options) {
    this.svgCache = new LRUCache({ max: options?.svgCacheSize || 100 })
    this.pngCache = new LRUCache({ max: options?.pngCacheSize || 100 })
  }

  listShapeTypes () {
    return [...ShapeRegistry.keys()]
  }

  hasShapeType (type) {
    return ShapeRegistry.has(type)
  }

  registerShapeType (type, generatorFn) {
    ShapeRegistry.set(type, generatorFn)
  }

  renderShape (params) {
    // check arguments
    if (!params.shape) {
      logger.error('Invalid argument: \'params.shape\' must be defined')
    }
    const zoom = params.zoom || 1
    if (!is.number(zoom) || !is.positive(zoom)) {
      logger.error('Invalid argument: \'params.zoom\' must be positive number')
    }
    // generate the shape
    const generatorFn = ShapeRegistry.get(params.shape)
    if (!generatorFn) {
      logger.error(`Invalid shape: '${params.shape}' is unknown`)
    }
    params = { ...params, ...generatorFn(params) }
    if (!is.number(params.width) || !is.positive(params.width)) {
      logger.error('Invalid computed property: \'params.width\' must be a positive number')
    }
    if (!is.number(params.height) || !is.positive(params.height)) {
      logger.error('Invalid computed property: \'params.height\' must be a positive number')
    }
    if (!is.number(params.margin) || is.negative(params.margin)) {
      logger.error('Invalid computed property: \'params.margin\' must be a non-negative number')
    }
    return {
      ...params,
      toSVG: () => toSVG(params, { pngCache: this.pngCache, svgCache: this.svgCache }),
      toPNG: () => toPNG(params, { pngCache: this.pngCache, svgCache: this.svgCache })
    }
  }
}
