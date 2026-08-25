import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function target (params) {
  const shape =
    `<path
      d="M50 0
         A50 50 0 1 0 50 100
         A50 50 0 1 0 50 0
         Z
         M50 20
         A30 30 0 1 1 50 80
         A30 30 0 1 1 50 20
         Z
         M50 38
         A12 12 0 1 0 50 62
         A12 12 0 1 0 50 38
         Z"
      fill-rule="evenodd"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}
