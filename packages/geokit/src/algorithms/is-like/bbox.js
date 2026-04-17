import { is } from '@kalisio/check'

export function isLikeBBox (object) {
  if (!is.arrayOfLength(object, 4) && !is.arrayOfLength(object, 6)) return false
  return object.every(is.number)
}
