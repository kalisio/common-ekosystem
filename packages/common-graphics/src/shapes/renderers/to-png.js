import { getLogger } from '@kalisio/common-core/runtime'
import { image } from '#utilities'
import { toSVG } from './to-svg.js'

const logger = getLogger(['common-graphics', 'to-png'])

export async function toPNG (params, context) {
  const { pngCache } = context
  if (params.key) {
    const cached = pngCache.get(params.key)
    if (cached) {
      logger.debug('PNG {key} retrieved from cache', { key: params.key })
      return cached
    }
  }
  const png = await image.toDataURL(await image.fromSVG(toSVG(params, context)))
  if (params.key) {
    pngCache.set(params.key, png)
    logger.debug('PNG {key} cached', { key: params.key })
  }
  return png
}
