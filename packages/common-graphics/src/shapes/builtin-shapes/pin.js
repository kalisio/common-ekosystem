import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function markerPin (params) {
  const shape =
    `<path d="M50 98C50 98 2 70 2 36C2 18 23 2 50 2C77 2 98 18 98 36C98 70 50 98 50 98Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return {
    ...setupStandardShape(params, shape),
    anchor: 'bottom-center'
  }
}

export function squarePin (params) {
  const shape =
    `<path d="M4 16 Q 4 4 16 4 L 84 4 Q 96 4 96 16 L 96 64 Q 96 76 84 76 L 64 76 L 50 96 L 36 76 L 16 76 Q 4 76 4 64Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return {
    ...setupStandardShape(params, shape),
    anchor: 'bottom-center'
  }
}
