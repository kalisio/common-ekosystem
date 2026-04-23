import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../utils/svg.js'

function getSize (params) {
  if (params.size) return { width: params.size[0], height: params.size[1] }
  if (params.radius) return { width: params.radius * 2, height: params.radius * 2 }
  return { width: 50, height: 50 }
}

export function pentagon (params) {
  return {
    ...getSize(params),
    margin: params.stroke ? params.stroke.width ?? 1 : 0,
    shape:
      `<path d="M50 0 L100 38 L81 100 L19 100 L0 38 Z"
        ${toSVGStyleAttributes(params)}
        ${toSVGTransformAttribute(params.transform)}
      >${toSVGTitleElement(params)}</path>`,
    icon: {
      transform: {
        translate: [50, 50]
      },
      ...params.icon
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

export function hexagon (params) {
  return {
    ...getSize(params),
    margin: params.stroke ? params.stroke.width ?? 1 : 0,
    shape:
      `<path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z"
        ${toSVGStyleAttributes(params)}
        ${toSVGTransformAttribute(params.transform)}
      >${toSVGTitleElement(params)}</path>`,
    icon: {
      transform: {
        translate: [50, 50]
      },
      ...params.icon
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

export function polygon (params) {
  return {
    ...getSize(params),
    margin: params.stroke ? params.stroke.width ?? 1 : 0,
    shape:
      `<path d="M50 0 L90 20 L100 55 L75 95 L20 100 L0 60 L15 10 Z"
        ${toSVGStyleAttributes(params)}
        ${toSVGTransformAttribute(params.transform)}
      >${toSVGTitleElement(params)}</path>`,
    icon: {
      transform: {
        translate: [50, 50]
      },
      ...params.icon
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
