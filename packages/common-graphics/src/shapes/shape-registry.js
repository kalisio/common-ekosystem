import { LRUCache } from 'lru-cache'
import { BUILTIN_SHAPES } from './builtin-shapes'

export const ShapeRegistry = new LRUCache({ max: 1024 })

// Register builtin shapes
ShapeRegistry.set('circle', BUILTIN_SHAPES.circle)
ShapeRegistry.set('cross', BUILTIN_SHAPES.cross)
ShapeRegistry.set('diamond', BUILTIN_SHAPES.diamond)
ShapeRegistry.set('donut', BUILTIN_SHAPES.donut)
ShapeRegistry.set('pie', BUILTIN_SHAPES.pie)
ShapeRegistry.set('heart', BUILTIN_SHAPES.heart)
ShapeRegistry.set('pentagon', BUILTIN_SHAPES.pentagon)
ShapeRegistry.set('hexagon', BUILTIN_SHAPES.hexagon)
ShapeRegistry.set('polygon', BUILTIN_SHAPES.polygon)
ShapeRegistry.set('rect', BUILTIN_SHAPES.rect)
ShapeRegistry.set('rounded-rect', BUILTIN_SHAPES.roundedRect)
ShapeRegistry.set('star4', BUILTIN_SHAPES.star4)
ShapeRegistry.set('star5', BUILTIN_SHAPES.star5)
ShapeRegistry.set('star6', BUILTIN_SHAPES.star6)
ShapeRegistry.set('triangle', BUILTIN_SHAPES.triangle)
ShapeRegistry.set('triangle-down', BUILTIN_SHAPES.triangleDown)
ShapeRegistry.set('triangle-right', BUILTIN_SHAPES.triangleRight)
ShapeRegistry.set('triangle-left', BUILTIN_SHAPES.triangleLeft)
ShapeRegistry.set('marker-pin', BUILTIN_SHAPES.markerPin)
ShapeRegistry.set('square-pin', BUILTIN_SHAPES.squarePin)
