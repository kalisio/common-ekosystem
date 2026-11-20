import { assert, is } from '@kalisio/common-core/predicates'
import { getLogger } from '@kalisio/common-core/runtime'

const logger = getLogger(['common-graphics', 'to-svg'])

function toClassNames (classes) {
  if (is.array(classes)) return classes.filter(is.nonEmptyString).join(' ')
  return is.nonEmptyString(classes) ? classes : ''
}

function toScale (height) {
  assert.that(height, is.positive, 'height must be a positive number')
  return 100 / height
}

function toTransformArguments (value) {
  return is.array(value) ? value.join(' ') : value
}

export function toSVG (params, context) {
  assert.all([
    { value: params.width, validator: is.positive, message: 'width must be a positive number' },
    { value: params.height, validator: is.positive, message: 'height must be a positive number' }
  ])
  const { svgCache } = context
  // Check whether this shape is already in the cache
  if (params.key) {
    const svg = svgCache.get(params.key)
    if (svg) {
      logger.debug(`SVG '${params.key}' retrieved from cache`)
      return svg
    }
  }
  // Otherwise setup the svg string
  const width = params.width
  const height = params.height
  const margin = params.margin ?? 0
  let attributes = 'xmlns="http://www.w3.org/2000/svg"'
  attributes += ` width="${width}" height="${height}"`
  attributes += ` viewBox="${0 - margin} ${0 - margin} ${100 + margin * 2} ${100 + margin * 2}"`
  attributes += ' preserveAspectRatio="none"'
  attributes += ' overflow="visible"'
  let shapeElement = params.shape
  const styleElement = toSVGStyleElement(params)
  const textElement = toSVGTextElement(params)
  const iconElement = toSVGIconElement(params)
  if (textElement !== '' || iconElement !== '') shapeElement = `<g>${shapeElement}${textElement}${iconElement}</g>`
  const svg = `<svg ${attributes}>${styleElement}${shapeElement}</svg>`
  if (params.key) {
    svgCache.set(params.key, svg)
    logger.debug(`SVG '${params.key}' cached`)
  }
  return svg
}

export function toSVGStyleElement (params) {
  if (!params.style) return ''
  return `<style>${params.style}</style>`
}

export function toSVGTextElement (params) {
  const { text, height } = params
  if (is.empty(text?.label)) return ''
  const size = (text.size ?? 12) * toScale(height)
  let attrs = `text-anchor="middle" alignment-baseline="central" font-size="${size}px"`
  const classNames = toClassNames(text.classes)
  if (classNames) attrs += ` class="${classNames}"`
  if (text.color) attrs += ` fill="${text.color}"`
  if (text.font) attrs += ` font-family="${text.font}"`
  if (text.style) attrs += ` font-style="${text.style}"`
  if (text.weight) attrs += ` font-weight="${text.weight}"`
  if (text.variant) attrs += ` font-variant="${text.variant}"`
  if (text.cursor) attrs += ` cursor="${text.cursor}"`
  if (text.transform) attrs += ` ${toSVGTransformAttribute(text.transform)}`
  return `<g transform="translate(50 50)"><text ${attrs}>${text.label}</text></g>`
}

export function toSVGIconElement (params) {
  const { icon, height } = params
  if (!icon) return ''
  const classNames = toClassNames(icon.classes)
  if (!classNames && !icon.url && !icon.symbol) return ''
  if (classNames) {
    const size = (icon.size ?? 12) * toScale(height)
    let iconStyle = `font-size:${size}px;`
    if (icon.color) iconStyle += `color:${icon.color};`
    const iconElement = `<i style="${iconStyle}" class="${classNames}"></i>`
    const divStyle = 'display:flex;align-items:center;justify-content:center;height:100%;width:100%;'
    const divElement = `<div xmlns="http://www.w3.org/1999/xhtml" style="${divStyle}">${iconElement}</div>`
    return `<foreignObject width="100" height="100">${divElement}</foreignObject>`
  }
  const size = is.defined(icon.size) ? icon.size * toScale(height) : 100
  const offset = (100 - size) / 2
  if (icon.symbol) {
    const color = icon.color ?? '#000000'
    const opacity = icon.opacity ?? 1
    return `<svg x="${offset}" y="${offset}" width="${size}" height="${size}" opacity="${opacity}" fill="${color}"><use href="${icon.symbol}"/></svg>`
  }
  return `<image href="${icon.url}" x="${offset}" y="${offset}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`
}

export function toSVGTitleElement (params) {
  const { label } = params
  if (is.empty(label)) return ''
  return `<title>${label}</title>`
}

export function toSVGStyleAttributes (params) {
  if (!params) return ''
  let attrs = ''
  if (is.defined(params.color)) attrs += `fill="${params.color}" `
  if (is.defined(params.opacity)) attrs += `fill-opacity="${params.opacity}" `
  const stroke = params.stroke
  if (stroke && stroke.color !== 'transparent') {
    attrs += 'vector-effect="non-scaling-stroke" '
    attrs += `stroke-width="${stroke.width ?? '1px'}" `
    attrs += `stroke="${stroke.color || 'black'}" `
    if (is.defined(stroke.opacity)) attrs += `stroke-opacity="${stroke.opacity}" `
    if (stroke.dashArray) attrs += `stroke-dasharray="${stroke.dashArray}" `
    if (is.defined(stroke.dashOffset)) attrs += `stroke-dashoffset="${stroke.dashOffset}" `
    if (stroke.lineCap) attrs += `stroke-linecap="${stroke.lineCap}" `
    if (stroke.lineJoin) attrs += `stroke-linejoin="${stroke.lineJoin}" `
    if (stroke.miterLimit) attrs += `stroke-miterlimit="${stroke.miterLimit}"`
  }
  return attrs.trim()
}

export function toSVGTransformAttribute (transform) {
  if (!transform) return ''
  let attr = 'transform="'
  if (transform.rotate) attr += `rotate(${toTransformArguments(transform.rotate)}) `
  if (transform.translate) attr += `translate(${toTransformArguments(transform.translate)}) `
  if (transform.scale) attr += `scale(${toTransformArguments(transform.scale)}) `
  if (transform.skewX) attr += `skewX(${transform.skewX}) `
  if (transform.skewY) attr += `skewY(${transform.skewY}) `
  return attr.trim() + '"'
}
