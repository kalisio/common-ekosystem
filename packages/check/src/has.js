import { is } from './is.js'

export const has = {
  // Check if object has a specific key
  key (obj, key) {
    if (!is.plainObject(obj)) return false
    return key in obj
  },

  // Check if object has all specified keys
  keys (obj, keys) {
    if (!is.plainObject(obj)) return false
    return keys.every(k => k in obj)
  },

  // Check if object has a key with a defined value
  keyWithValue (obj, key) {
    return has.key(obj, key) && is.defined(obj[key])
  }
}
