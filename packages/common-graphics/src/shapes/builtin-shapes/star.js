import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

function computeStarSize (params) {
  if (params.size) return { width: params.size[0], height: params.size[1] }
  if (params.radius) return { width: params.radius * 2.1, height: params.radius * 2.1 }
  return { width: 50, height: 50 }
}

export function star4 (params) {
  const shape =
    `<path d="M50 0 L65 40 L100 50 L65 60 L50 100 L35 60 L0 50 L35 40 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape, computeStarSize)
}

export function star5 (params) {
  const shape =
    `<path d="M50 0 L63 37 L100 37 L70 60 L83 97 L50 74 L17 97 L30 60 L0 37 L37 37 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape, computeStarSize)
}

export function star6 (params) {
  const shape =
    `<path d="M50 0 L58 40 L93 25 L65 50 L93 75 L58 60 L50 100 L42 60 L7 75 L35 50 L7 25 L42 40 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape, computeStarSize)
}
