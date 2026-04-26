import { assert, is } from '../predicates'
import { string } from './string.js'

function normalizeObject (obj, options = {}) {
  if (!is.defined(obj)) return obj
  const ignoredKeys = options?.ignoredKeys ?? []
  if (is.array(obj)) {
    return obj
      .map(v => normalizeObject(v, options))
      .sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
      )
  }
  if (is.plainObject(obj)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key]) => !ignoredKeys.includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [
          key,
          normalizeObject(value, options)
        ])
    )
  }
  if (is.string(obj)) {
    return string.normalize(obj, options)
  }
  return obj
}

export const object = {

  clone (obj) {
    assert.that(obj, is.defined, 'obj must be defined')
    return structuredClone(obj)
  },

  normalize (obj, options = {}) {
    assert.that(obj, is.defined, 'obj must be defined')
    return normalizeObject(obj, options)
  }

}
