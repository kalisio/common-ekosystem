import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function cross (params) {
  const shape =
    `<path d="M35 0 L65 0 L65 35 L100 35 L100 65 L65 65 L65 100 L35 100 L35 65 L0 65 L0 35 L35 35 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}

export function x (params) {
  const shape =
    `<path d="M0 15 L15 0 L50 35 L85 0 L100 15 L65 50 L100 85 L85 100 L50 65 L15 100 L0 85 L35 50 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}
