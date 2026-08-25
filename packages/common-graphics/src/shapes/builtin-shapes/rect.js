import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

function computeRectSize (params) {
  if (params.size) return { width: params.size[0], height: params.size[1] }
  if (params.radius) return { width: params.radius * 1.8, height: params.radius * 1.8 }
  return { width: 50, height: 50 }
}

export function rect (params) {
  const shape =
    `<rect x="0" y="0" width="100" height="100"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</rect>`
  return setupStandardShape(params, shape, computeRectSize)
}

export function roundedRect (params) {
  const shape =
    `<rect x="0" y="0" width="100" height="100" rx="20" ry="20"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</rect>`
  return setupStandardShape(params, shape, computeRectSize)
}
