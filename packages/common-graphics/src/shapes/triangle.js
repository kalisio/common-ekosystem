import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../utils/svg.js'

function getSize (params) {
  if (params.size) return { width: params.size[0], height: params.size[1] }
  if (params.radius) return { width: params.radius * 1.8, height: params.radius * 1.8 }
  return { width: 50, height: 50 }
}

export function triangle (params) {
  return {
    ...getSize(params),
    margin: params.stroke ? params.stroke.width ?? 1 : 0,
    shape:
      `<polygon points="50 0, 100 100, 0 100"
        ${toSVGStyleAttributes(params)}
        ${toSVGTransformAttribute(params.transform)}
      >${toSVGTitleElement(params)}</polygon>`,
    icon: {
      classes: params.icon?.classes,
      transform: {
        translate: [50, 50]
      }
    },
    text: {
      transform: {
        translate: [50, 50]
      },
      ...params.text
    },
    style: params.style
  }
}

export function triangleDown (params) {
  return triangle({
    ...params,
    transform: {
      rotate: [180, 50, 50]
    }
  })
}

export function triangleRight (params) {
  return triangle({
    ...params,
    transform: {
      rotate: [90, 50, 50]
    }
  })
}

export function triangleLeft (params) {
  return triangle({
    ...params,
    transform: {
      rotate: [270, 50, 50]
    }
  })
}
