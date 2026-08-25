import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function windBarb (params) {
  const speed = Math.max(0, Math.round((params.speed ?? 0) / 5) * 5)
  const center = 50
  const shaftTop = 5
  const shaftBottom = 95
  if (speed === 0) {
    const shape =
      `<circle cx="${center}" cy="${center}" r="15"
        ${toSVGStyleAttributes(params)}
        ${toSVGTransformAttribute(params.transform)}
      >${toSVGTitleElement(params)}</circle>`
    return setupStandardShape(params, shape)
  }
  const flags = Math.floor(speed / 50)
  const remainder = speed % 50
  const barbs = Math.floor(remainder / 10)
  const halfBarb = remainder % 10 === 5
  const flagHeight = 14
  const flagWidth = 28
  const barbSpacing = 8
  const barbLength = 30
  const halfBarbLength = 18
  let shape = `<g ${toSVGTransformAttribute(params.transform)}>`
  shape += `<path d="M${center} ${shaftBottom} L${center} ${shaftTop}" ${toSVGStyleAttributes(params)} />`
  let y = shaftTop + 2
  for (let i = 0; i < flags; i++) {
    shape += `<path d="M${center} ${y} L${center + flagWidth} ${y + flagHeight / 2} L${center} ${y + flagHeight} Z" ${toSVGStyleAttributes(params)} />`
    y += flagHeight
  }
  if (flags > 0 && (barbs > 0 || halfBarb)) y += 3
  for (let i = 0; i < barbs; i++) {
    shape += `<path d="M${center} ${y} L${center + barbLength} ${y + 9}" ${toSVGStyleAttributes(params)} />`
    y += barbSpacing
  }
  if (halfBarb) {
    shape += `<path d="M${center} ${y} L${center + halfBarbLength} ${y + 5}" ${toSVGStyleAttributes(params)} />`
  }
  shape += toSVGTitleElement(params)
  shape += '</g>'
  return setupStandardShape(params, shape)
}
