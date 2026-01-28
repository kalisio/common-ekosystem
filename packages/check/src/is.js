export const is = {
  // Check if value is defined (not null or undefined)
  defined (value) {
    return value !== null && value !== undefined
  },

  // Check if value is null or undefined
  nil (value) {
    return !is.defined(value)
  },

  // Check if value is a plain object (not array, not null, not a class)
  plainObject (value) {
    return is.defined(value) &&
           typeof value === 'object' &&
           !Array.isArray(value) &&
           value.constructor === Object
  },

  // Check if value is a non-empty object
  emptyObject (value) {
    return is.plainObject(value) && Object.keys(value).length === 0
  },

  // Check if value is a string
  string (value) {
    return typeof value === 'string'
  },

  // Check if value is a non-empty string
  emptyString (value) {
    return is.string(value) && value.trim().length === 0
  },

  // Check if value is a valid number (not NaN, not Infinity)
  number (value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  },

  // Check if value is an integer
  integer (value) {
    return is.number(value) && Number.isInteger(value)
  },

  // Check if value is an array
  array (value) {
    return Array.isArray(value)
  },

  // Check if value is a non-empty array
  emptyArray (value) {
    return is.array(value) && value.length === 0
  },

  // Check if value is an array of specific length
  arrayOfLength (value, length) {
    return is.array(value) && value.length === length
  },

  // Check if value is a function
  function (value) {
    return typeof value === 'function'
  },

  // Check if value is a boolean
  boolean (value) {
    return typeof value === 'boolean'
  },

  // Check if value is one of allowed values
  oneOf (value, allowedValues) {
    return allowedValues.includes(value)
  },

  // Check if value is a positive number
  positive (value) {
    return is.number(value) && value > 0
  },

  // Check if value is a negative number
  negative (value) {
    return is.number(value) && value < 0
  },

  // Check if value is within numeric range
  inRange (value, min, max) {
    return is.number(value) && value >= min && value <= max
  },

  // Check if value is empty (null, undefined, '', [], {})
  empty (value) {
    if (is.nil(value)) return true
    if (is.string(value)) return value.trim().length === 0
    if (is.array(value)) return value.length === 0
    if (is.plainObject(value)) return Object.keys(value).length === 0
    return false
  }
}
