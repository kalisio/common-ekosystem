import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function pentagon (params) {
  const shape =
    `<path d="M50 0 L100 38 L81 100 L19 100 L0 38 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}

export function hexagon (params) {
  const shape =
    `<path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}

export function octagon (params) {
  const shape =
    `<path d="M29 0 L71 0 L100 29 L100 71 L71 100 L29 100 L0 71 L0 29 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}

export function polygon (params) {
  const shape =
    `<path d="M50 0 L90 20 L100 55 L75 95 L20 100 L0 60 L15 10 Z"
      ${toSVGStyleAttributes(params)}
      ${toSVGTransformAttribute(params.transform)}
    >${toSVGTitleElement(params)}</path>`
  return setupStandardShape(params, shape)
}
