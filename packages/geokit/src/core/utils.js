import { asserts, is } from '@kalisio/check'

export function deepFreeze (obj) {
  asserts.that(obj, (v) => is.plainObject(v) || is.array(v), 'obj must be an object or array')
  Object.freeze(obj)
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value)
    }
  }
  return obj
}
