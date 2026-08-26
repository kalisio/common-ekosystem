import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

export function windBarb (params) {
  const speed = Math.max(0, Math.round((params.speed ?? 0) / 5) * 5)
  const direction = params.direction ?? 0
  const showAnchor = params.showAnchor ?? true
  const anchorRadius = params.anchorRadius ?? 8
  const x = 50
  const tip = 10
  const anchor = 90
  const barbLength = 28
  const halfBarbLength = 12
  const barbDrop = 12
  const spacing = 10
  const halfBarbOffset = 8
  const pennantWidth = 28
  const pennantHeight = 14
  const transform = {
    rotate: [direction, x, anchor]
  }
  if (speed === 0) {
    let shape = `<g ${toSVGTransformAttribute(transform)}>`
    shape += `
      <circle
        cx="${x}"
        cy="${anchor}"
        r="15"
        fill="none"
        ${toSVGStyleAttributes(params)}
      />
    `
    if (showAnchor) {
      shape += `
        <circle
          cx="${x}"
          cy="${anchor}"
          r="${anchorRadius}"
          ${toSVGStyleAttributes(params)}
        />
      `
    }
    shape += toSVGTitleElement(params)
    shape += '</g>'
    return setupStandardShape(params, shape)
  }
  const pennants = Math.floor(speed / 50)
  const remainder = speed % 50
  const fullBarbs = Math.floor(remainder / 10)
  const halfBarb = remainder % 10 === 5
  let shape = `<g ${toSVGTransformAttribute(transform)}>`
  shape += `
    <path
      d="M${x} ${anchor} L${x} ${tip}"
      ${toSVGStyleAttributes(params)}
    />
  `
  if (showAnchor) {
    shape += `
      <circle
        cx="${x}"
        cy="${anchor}"
        r="${anchorRadius}"
        ${toSVGStyleAttributes(params)}
      />
    `
  }
  let y = tip
  for (let i = 0; i < pennants; i++) {
    shape += `
      <path
        d="M${x} ${y} L${x + pennantWidth} ${y + pennantHeight} L${x} ${y + pennantHeight} Z"
        ${toSVGStyleAttributes(params)}
      />
    `
    y += pennantHeight
  }
  for (let i = 0; i < fullBarbs; i++) {
    shape += `
      <path
        d="M${x} ${y} L${x + barbLength} ${y + barbDrop}"
        ${toSVGStyleAttributes(params)}
      />
    `
    y += spacing
  }
  if (halfBarb) {
    y += halfBarbOffset
    shape += `
      <path
        d="M${x} ${y} L${x + halfBarbLength} ${y + barbDrop / 2}"
        ${toSVGStyleAttributes(params)}
      />
    `
  }
  shape += toSVGTitleElement(params)
  shape += '</g>'
  return setupStandardShape(params, shape)
}
