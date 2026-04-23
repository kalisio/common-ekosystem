import { toSVGStyleAttributes, toSVGTitleElement, toSVGTransformAttribute } from '../utils/svg.js'

function getSize (params) {
  if (params.size) return { width: params.size[0], height: params.size[1] }
  if (params.radius) return { width: params.radius * 2, height: params.radius * 2 }
  return { width: 50, height: 50 }
}

export function circle (params) {
  return {
    ...getSize(params),
    margin: params.stroke ? params.stroke.width ?? 1 : 0,
    shape:
      `<circle cx="50" cy="50" r="50"
        ${toSVGStyleAttributes(params)}
        ${toSVGTransformAttribute(params.transform)}
      >${toSVGTitleElement(params)}</circle>`,
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
