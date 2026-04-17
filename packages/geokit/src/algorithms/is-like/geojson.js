import { is } from '@kalisio/check'
import { isLikeGeometry } from './geometry.js'

export const FEATURE_TYPES = {
  FEATURE: 'Feature',
  FEATURE_COLLECTION: 'FeatureCollection'
}

export function isLikeFeature (object) {
  if (!is.plainObject(object)) return false
  return FEATURE_TYPES.FEATURE === object.type
}

export function isLikeFeatureCollection (object) {
  if (!is.plainObject(object)) return false
  if (object.type !== FEATURE_TYPES.FEATURE_COLLECTION) return false
  return is.array(object.features)
}

export function isLikeGeoJson (object) {
  if (!is.plainObject(object)) return false
  if (isLikeGeometry(object)) return true
  if (isLikeFeature(object)) return true
  return isLikeFeatureCollection(object)
}
