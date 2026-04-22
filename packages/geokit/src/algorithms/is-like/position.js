import { is } from '@kalisio/kore'

export function isLikePosition (object) {
  if (!is.arrayOfLengthBetween(object, 2, 3)) return false
  return object.every(is.number)
}
