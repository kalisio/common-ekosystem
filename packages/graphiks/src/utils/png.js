import { logger } from './logger.js'
import { toSVG } from './svg.js'

export async function toPNG (params, context) {
  const { pngCache } = context
  // check whether the PNG is already in the cache
  if (params.key) {
    const png = pngCache.get(params.key)
    if (png) {
      logger.debug(`PNG '${params.key}' retrieved from cache`)
      return png
    }
  }
  const svgBlob = new Blob([toSVG(params, context)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)
  const img = await new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0)
  const png = canvas.toDataURL('image/png')
  URL.revokeObjectURL(url)
  if (params.key) {
    pngCache.set(params.key, png)
    logger.debug(`PNG '${params.key}' cached`)
  }
  return png
}
