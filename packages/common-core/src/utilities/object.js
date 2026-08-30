import { assert, is, conform, optional } from '../predicates/index.js'
import { string } from './string.js'

const SORT_OPTIONS_SCHEMA = {
  ignoreSpaces: optional(is.boolean),
  ignoreDiacritics: optional(is.boolean),
  ignoreCase: optional(is.boolean),
  locale: optional(is.string)
}

const NORMALIZE_OPTIONS_SCHEMA = {
  ...SORT_OPTIONS_SCHEMA,
  ignoredKeys: optional(is.array)
}

function normalizeObject (obj, options = {}) {
  if (!is.defined(obj)) return obj
  const ignoredKeys = options?.ignoredKeys ?? []
  const sortOptions = { ignoreDiacritics: false, ignoreCase: false, locale: options.locale }
  if (is.array(obj)) {
    return obj
      .map(v => normalizeObject(v, options))
      .sort((a, b) =>
        string.compare(JSON.stringify(a), JSON.stringify(b), sortOptions)
      )
  }
  if (is.plainObject(obj)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key]) => !ignoredKeys.includes(key))
        .sort(([a], [b]) => string.compare(a, b, sortOptions))
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
    assert.all([
      { value: obj, validator: (v) => is.array(v) || is.plainObject(v), message: 'obj must be an array or a plain object' },
      { value: options, validator: (v) => conform.schema(v, NORMALIZE_OPTIONS_SCHEMA) }
    ])
    return normalizeObject(obj, options)
  },

  reorder (obj, property, options = {}) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be a plain object' },
      { value: property, validator: is.string, message: 'property must be a string' },
      { value: options, validator: (v) => conform.schema(v, SORT_OPTIONS_SCHEMA) }
    ])
    const compareValues = (a, b) => string.compare(a[property], b[property], options)
    return Object.fromEntries(
      Object.entries(obj).sort(([, a], [, b]) => compareValues(a, b))
    )
  },

  lookup (obj, path) {
    assert.all([
      { value: obj, validator: is.defined, message: 'obj must be defined' },
      { value: path, validator: is.nonEmptyString, message: 'path must be a non empty string' }
    ])
    return path.split('.').reduce((value, key) => value?.[key], obj)
  },

  dotify (obj) {
    assert.that(obj, is.plainObject, 'obj must be a plain object')
    const result = {}
    function recurse (object, current) {
      for (const [key, value] of Object.entries(object)) {
        const newKey = current ? `${current}.${key}` : key
        if (is.nonEmptyObject(value)) {
          recurse(value, newKey) // it's a nested object, so do it again
        } else {
          result[newKey] = value // it's not an object, an array or {}, so set the property
        }
      }
    }
    recurse(obj)
    return result
  },

  sort (arr, property, options = {}) {
    assert.all([
      { value: arr, validator: is.array, message: 'arr must be an array' },
      { value: property, validator: is.string, message: 'property must be a string' },
      { value: options, validator: (v) => conform.schema(v, SORT_OPTIONS_SCHEMA) }
    ])
    return [...arr].sort((a, b) => string.compare(a[property], b[property], options))
  }
}
