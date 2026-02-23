export const is = {

  defined (value) {
    return value !== null && value !== undefined
  },

  nil (value) {
    return !is.defined(value)
  },

  plainObject (value) {
    return is.defined(value) &&
           typeof value === 'object' &&
           !Array.isArray(value) &&
           value.constructor === Object
  },

  emptyObject (value) {
    return is.plainObject(value) && Object.keys(value).length === 0
  },

  string (value) {
    return typeof value === 'string'
  },

  emptyString (value) {
    return is.string(value) && value.trim().length === 0
  },

  number (value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  },

  integer (value) {
    return is.number(value) && Number.isInteger(value)
  },

  array (value) {
    return Array.isArray(value)
  },

  emptyArray (value) {
    return is.array(value) && value.length === 0
  },

  arrayOfLength (value, length) {
    return is.array(value) && value.length === length
  },

  function (value) {
    return typeof value === 'function'
  },

  boolean (value) {
    return typeof value === 'boolean'
  },

  oneOf (value, allowedValues) {
    return allowedValues.includes(value)
  },

  positive (value) {
    return is.number(value) && value > 0
  },

  negative (value) {
    return is.number(value) && value < 0
  },

  inRange (value, min, max) {
    return is.number(value) && value >= min && value <= max
  },

  empty (value) {
    if (is.nil(value)) return true
    if (is.string(value)) return value.trim().length === 0
    if (is.array(value)) return value.length === 0
    if (is.plainObject(value)) return Object.keys(value).length === 0
    return false
  }
}
