import { logger } from './utils/logger.js'
import { registry } from './utils/registry.js'
import { Cache } from './utils/cache.js'
import { toSVG } from './utils/svg.js'
import { toPNG } from './utils/png.js'
import { circle } from './shapes/circle.js'
import { cross } from './shapes/cross.js'
import { diamond } from './shapes/diamond.js'
import { donut, pie } from './shapes/donut.js'
import { heart } from './shapes/heart.js'
import { markerPin, squarePin } from './shapes/pin.js'
import { pentagon, hexagon, polygon } from './shapes/polygon.js'
import { rect, roundedRect } from './shapes/rect.js'
import { star4, star5, star6 } from './shapes/star.js'
import { triangle, triangleDown, triangleRight, triangleLeft } from './shapes/triangle.js'

// Register builtin shapes
registry.register('circle', circle)
registry.register('cross', cross)
registry.register('diamond', diamond)
registry.register('donut', donut)
registry.register('pie', pie)
registry.register('heart', heart)
registry.register('pentagon', pentagon)
registry.register('hexagon', hexagon)
registry.register('polygon', polygon)
registry.register('rect', rect)
registry.register('rounded-rect', roundedRect)
registry.register('star4', star4)
registry.register('star5', star5)
registry.register('star6', star6)
registry.register('triangle', triangle)
registry.register('triangle-down', triangleDown)
registry.register('triangle-right', triangleRight)
registry.register('triangle-left', triangleLeft)
registry.register('marker-pin', markerPin)
registry.register('square-pin', squarePin)

// Function to create the main graphiks instance
export class Graphiks {
  constructor (options) {
    this.svgCache = new Cache(options?.svgCacheSize || 100)
    this.pngCache = new Cache(options?.pngCacheSize || 100)
  }

  listShapeTypes () {
    return registry.list()
  }

  hasShapeType (type) {
    return registry.has(type)
  }

  registerShapeType (type, generatorFn) {
    registry.register(type, generatorFn)
  }

  renderShape (params) {
    // check arguments
    if (!params.shape) {
      logger.error('Invalid argument: \'params.shape\' must be defined')
    }
    const zoom = params.zoom || 1
    if (!Number.isFinite(zoom) || zoom <= 0) {
      logger.error('Invalid argument: \'params.zoom\' must be positive number')
    }
    // generate the shape
    const generatorFn = registry.get(params.shape)
    if (!generatorFn) {
      logger.error(`Invalid shape: '${params.shape}' is unknown`)
    }
    params = { ...params, ...generatorFn(params) }
    if (!Number.isFinite(params.width) || params.width <= 0) {
      logger.error('Invalid argument: \'params.width\' must be a positive number')
    }
    if (!Number.isFinite(params.height) || params.height <= 0) {
      logger.error('Invalid argument: \'params.height\' must be a positive number')
    }
    if (!Number.isFinite(params.margin) || params.margin < 0) {
      logger.error('Invalid argument: \'params.margin\' must be a non-negative number')
    }
    return {
      ...params,
      toSVG: () => toSVG(params, { pngCache: this.pngCache, svgCache: this.svgCache }),
      toPNG: () => toPNG(params, { pngCache: this.pngCache, svgCache: this.svgCache })
    }
  }
}
