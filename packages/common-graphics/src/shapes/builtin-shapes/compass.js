import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function compass (params) {
  const shape =
    `<path d="M50 0 L66 50 L50 42 L34 50 Z M50 100 L34 50 L50 58 L66 50 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}
