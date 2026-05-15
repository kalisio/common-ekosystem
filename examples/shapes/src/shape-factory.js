import { ShapeFactory } from '@kalisio/common-graphics'

let shapeFactory
if (!shapeFactory) shapeFactory = new ShapeFactory()

export { shapeFactory }
