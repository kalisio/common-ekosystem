import { is } from './is.js'

/**
 * Utilities for checking object properties and keys
 * @namespace has
 */
export const has = {
  /**
   * Check if object has a specific key
   * @param {Object} obj - The object to check
   * @param {string} key - The key to look for
   * @returns {boolean} True if the object has the key, false otherwise
   * @example
   * has.key({ name: 'John' }, 'name') // true
   * has.key({ name: 'John' }, 'age') // false
   * has.key(null, 'name') // false
   */
  key (obj, key) {
    if (!is.plainObject(obj)) return false
    return key in obj
  },

  /**
   * Check if object has all specified keys
   * @param {Object} obj - The object to check
   * @param {string[]} keys - Array of keys to look for
   * @returns {boolean} True if the object has all keys, false otherwise
   * @example
   * has.keys({ name: 'John', age: 30 }, ['name', 'age']) // true
   * has.keys({ name: 'John' }, ['name', 'age']) // false
   * has.keys({}, []) // true
   */
  keys (obj, keys) {
    if (!is.plainObject(obj)) return false
    return keys.every(k => k in obj)
  },

  /**
   * Check if object has a key with a defined value (not null or undefined)
   * @param {Object} obj - The object to check
   * @param {string} key - The key to look for
   * @returns {boolean} True if the object has the key and its value is defined, false otherwise
   * @example
   * has.keyWithValue({ name: 'John' }, 'name') // true
   * has.keyWithValue({ name: undefined }, 'name') // false
   * has.keyWithValue({ name: null }, 'name') // false
   * has.keyWithValue({}, 'name') // false
   */
  keyWithValue (obj, key) {
    return has.key(obj, key) && is.defined(obj[key])
  }
}
