import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

function computeDiamondSize (params) {
  if (params.size) return { width: params.size[0], height: params.size[1] }
  if (params.radius) return { width: params.radius * 2.2, height: params.radius * 2.2 }
  return { width: 50, height: 50 }
}

export function diamond (params) {
  const shape =
    `<polygon points="50 0, 100 50, 50 100, 0 50"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</polygon>`
  return setupStandardShape(params, shape, computeDiamondSize)
}
