import { is } from './is.js'
import { assert } from './assert.js'

export const has = {

  key (obj, key) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be an object' },
      { value: key, validator: is.string, message: 'key must be a string' }
    ])
    return Object.hasOwn(obj, key)
  },

  keys (obj, keys) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be an object' },
      { value: keys, validator: (v) => is.array(v) && v.length > 0 && v.every(is.string), message: 'keys must be an array of strings' }
    ])
    return keys.every(key => Object.hasOwn(obj, key))
  },

  keyWithValue (obj, key) {
    return has.key(obj, key) && is.defined(obj[key])
  }

}
