export function computeStandardSize (params) {
  if (params.size) {
    return {
      width: params.size[0],
      height: params.size[1]
    }
  }
  if (params.radius) {
    return {
      width: params.radius * 2,
      height: params.radius * 2
    }
  }
  return {
    width: 50,
    height: 50
  }
}

export function setupStandardShape (params, shape, computeSize = computeStandardSize) {
  return {
    ...computeSize(params),
    margin: params.stroke ? params.stroke.width ?? 1 : 0,
    shape,
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
