import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function flag (params) {
  const shape =
    `<path d="M15 0 L25 0 L25 8 L90 8 L72 34 L90 60 L25 60 L25 100 L15 100 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}
