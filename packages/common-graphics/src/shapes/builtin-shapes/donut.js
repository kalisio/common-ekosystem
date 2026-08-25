import { getLogger } from '@logtape/logtape'
import { is } from '@kalisio/common-core/predicates'
import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../renderers/to-svg.js'
import { setupStandardShape } from '../helpers.js'

const logger = getLogger(['common-graphics', 'donut'])

const DEFAULT_STYLE = `
  .graphiks-donut-slice { cursor: pointer; transition: opacity 0.2s, transform 0.2s; }
  .graphiks-donut-slice:hover { opacity: 0.8; transform-origin: center; transform: scale(1.05); }
`

export function donut (params) {
  if (!is.defined(params)) {
    logger.error('Invalid arguments: \'params\' must be defined')
    return
  }
  if (!is.defined(params.slices)) {
    logger.error('Invalid arguments: \'params.slices\' must be defined')
    return
  }
  const outerRadius = 50
  const innerRadius = params.innerRadius ?? 20
  const center = outerRadius
  const sum = params.slices.reduce((sum, slice) => {
    return sum + (slice.value || 0)
  }, 0)
  if (sum === 0) {
    logger.error('Invalid arguments: slices sum value must be non null')
    return
  }
  let shape = `<g ${toSVGTransformAttribute(params.transform)}>`
  let currentAngle = -Math.PI / 2
  if (params.slices.length === 1) {
    const slice = params.slices[0]
    const pathData = `
      M ${center} ${center - outerRadius}
      A ${outerRadius} ${outerRadius} 0 1 1 ${center} ${center + outerRadius}
      A ${outerRadius} ${outerRadius} 0 1 1 ${center} ${center - outerRadius}
      M ${center} ${center - innerRadius}
      A ${innerRadius} ${innerRadius} 0 1 0 ${center} ${center + innerRadius}
      A ${innerRadius} ${innerRadius} 0 1 0 ${center} ${center - innerRadius}
    `
    shape += `<path d="${pathData.trim()}" ${toSVGStyleAttributes(params)}>${toSVGTitleElement(slice)}</path>`
  } else {
    for (const slice of params.slices) {
      const percentage = slice.value / sum
      const angle = percentage * Math.PI * 2
      if (angle <= 0) continue
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      const startCos = Math.cos(startAngle)
      const startSin = Math.sin(startAngle)
      const endCos = Math.cos(endAngle)
      const endSin = Math.sin(endAngle)
      const x1 = center + outerRadius * startCos
      const y1 = center + outerRadius * startSin
      const x2 = center + outerRadius * endCos
      const y2 = center + outerRadius * endSin
      const x3 = center + innerRadius * endCos
      const y3 = center + innerRadius * endSin
      const x4 = center + innerRadius * startCos
      const y4 = center + innerRadius * startSin
      const largeArc = angle > Math.PI ? 1 : 0
      const pathData = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `
      const styleAttrs = toSVGStyleAttributes({
        ...slice,
        stroke: params.stroke
      })
      shape += `<path d="${pathData.trim()}" ${styleAttrs} class="graphiks-donut-slice">${toSVGTitleElement(slice)}</path>`
      currentAngle += angle
    }
  }
  shape += '</g>'
  const centerColor = params.center?.color
  if (centerColor && centerColor !== 'transparent') {
    shape += `<circle cx="${center}" cy="${center}" r="${innerRadius}" fill="${centerColor}" />`
  }
  return {
    ...setupStandardShape(params, shape),
    style: params.style || DEFAULT_STYLE
  }
}

export function pie (params) {
  return donut({
    innerRadius: 0,
    ...params
  })
}
