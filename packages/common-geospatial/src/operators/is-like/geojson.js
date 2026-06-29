import { is } from '@kalisio/common-core'
import { isLikeGeometry } from './geometry.js'

export const FEATURE_TYPES = {
  FEATURE: 'Feature',
  FEATURE_COLLECTION: 'FeatureCollection'
}

export function isLikeFeature (object) {
  return is.plainObject(object) &&
    object.type === FEATURE_TYPES.FEATURE
}

export function isLikeFeatureCollection (object) {
  return is.plainObject(object) &&
    object.type === FEATURE_TYPES.FEATURE_COLLECTION &&
    is.array(object.features)
}

export function isLikeFeatureOrFeatureCollection (object) {
  return isLikeFeature(object) || isLikeFeatureCollection(object)
}

export function isLikeGeoJson (object) {
  return isLikeFeatureOrFeatureCollection(object) || isLikeGeometry(object)
}
