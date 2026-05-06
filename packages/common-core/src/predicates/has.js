import { is } from './is.js'
import { assert } from './assert.js'

export const has = {

  key (obj, key) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be an object' },
      { value: key, validator: is.nonEmptyString, message: 'key must be a non empty string' }
    ])
    return Object.hasOwn(obj, key)
  },

  keys (obj, keys) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be an object' },
      { value: keys, validator: (v) => is.array(v) && v.length > 0 && v.every(is.nonEmptyString), message: 'keys must be an array of non empty strings' }
    ])
    return keys.every(key => has.key(obj, key))
  },

  keyWithValue (obj, key) {
    return has.key(obj, key) && is.defined(obj[key])
  },

  path (obj, path) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be an object' },
      { value: path, validator: is.nonEmptyString, message: 'path must be a non empty string' }
    ])
    let current = obj
    for (const key of path.split('.')) {
      if (!current || !is.plainObject(current) || !(key in current)) return false
      current = current[key]
    }
    return true
  }

}
