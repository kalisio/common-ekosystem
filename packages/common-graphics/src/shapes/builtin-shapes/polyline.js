import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function polyline (params) {
  const shape =
    `<path d="M35 25L65 95L99 17L91 13L65 75L35 5L1 83L9 87Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`

  return setupStandardShape(params, shape)
}
