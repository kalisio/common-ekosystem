import { is } from './is.js'

export const has = {

  key (obj, key) {
    if (!is.plainObject(obj)) return false
    return key in obj
  },

  keys (obj, keys) {
    if (!is.plainObject(obj)) return false
    return keys.every(k => k in obj)
  },

  keyWithValue (obj, key) {
    return has.key(obj, key) && is.defined(obj[key])
  }
}
