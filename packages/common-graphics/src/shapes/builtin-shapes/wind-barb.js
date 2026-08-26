import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

const CENTER_X = 50
const CENTER_Y = 50

function computeOffset (direction, radius) {
  const rad = direction * Math.PI / 180
  return [CENTER_X + radius * Math.sin(rad), CENTER_Y + radius * Math.cos(rad)]
}

export function windBarb (params) {
  const speed = Math.max(0, Math.round((params.speed ?? 0) / 5) * 5)
  const direction = params.direction ?? 0
  const strokeWidth = params.stroke?.width ?? 0
  const anchorRadius = params.anchorRadius ?? 8
  const offsetRadius = 48 - anchorRadius - strokeWidth
  const baseX = CENTER_X
  const baseY = CENTER_Y + offsetRadius
  const tipY = CENTER_Y - offsetRadius
  const calmRadius = 18
  const barbLength = 20
  const halfBarbLength = barbLength / 2
  const barbDrop = 11
  const spacing = 8
  const halfBarbOffset = 7
  const pennantWidth = 20
  const pennantHeight = 13
  const pennantGap = 2
  const offset = speed === 0 ? [CENTER_X, CENTER_Y] : computeOffset(direction, offsetRadius)
  const transform = {
    rotate: [direction, CENTER_X, CENTER_Y]
  }
  let shape = `<g ${toSVGTransformAttribute(transform)}>`
  if (speed === 0) {
    const calmParams = {
      ...params,
      color: 'transparent'
    }
    shape += `
      <circle
        cx="${CENTER_X}"
        cy="${CENTER_Y}"
        r="${calmRadius}"
        ${toSVGStyleAttributes(calmParams)}
      />
    `
    if (anchorRadius > 0) {
      shape += `
        <circle
          cx="${CENTER_X}"
          cy="${CENTER_Y}"
          r="${anchorRadius}"
          ${toSVGStyleAttributes(params)}
        />
      `
    }
    shape += toSVGTitleElement(params)
    shape += '</g>'
    return {
      ...setupStandardShape(params, shape),
      anchor: offset
    }
  }
  const pennants = Math.floor(speed / 50)
  const remainder = speed % 50
  const fullBarbs = Math.floor(remainder / 10)
  const halfBarb = remainder % 10 === 5
  shape += `
    <path
      d="M${baseX} ${baseY} L${baseX} ${tipY}"
      ${toSVGStyleAttributes(params)}
    />
  `
  if (anchorRadius > 0) {
    shape += `
      <circle
        cx="${baseX}"
        cy="${baseY}"
        r="${anchorRadius}"
        ${toSVGStyleAttributes(params)}
      />
    `
  }
  let y = tipY
  for (let i = 0; i < pennants; i++) {
    shape += `
      <path
        d="M${baseX} ${y} L${baseX + pennantWidth} ${y + pennantHeight / 2} L${baseX} ${y + pennantHeight} Z"
        ${toSVGStyleAttributes(params)}
      />
    `
    y += pennantHeight + pennantGap
  }
  for (let i = 0; i < fullBarbs; i++) {
    shape += `
      <path
        d="M${baseX} ${y} L${baseX + barbLength} ${y + barbDrop}"
        ${toSVGStyleAttributes(params)}
      />
    `
    y += spacing
  }
  if (halfBarb) {
    if (fullBarbs === 0 && pennants === 0) {
      y += halfBarbOffset
    }
    shape += `
      <path
        d="M${baseX} ${y} L${baseX + halfBarbLength} ${y + barbDrop / 2}"
        ${toSVGStyleAttributes(params)}
      />
    `
  }
  shape += toSVGTitleElement(params)
  shape += '</g>'
  return {
    ...setupStandardShape(params, shape),
    anchor: offset
  }
}
