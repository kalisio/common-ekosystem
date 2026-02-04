/**
 * Type checking and validation utilities
 * @namespace is
 */
export const is = {
  /**
   * Check if value is defined (not null or undefined)
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is not null and not undefined
   * @example
   * is.defined(0) // true
   * is.defined('') // true
   * is.defined(null) // false
   * is.defined(undefined) // false
   */
  defined (value) {
    return value !== null && value !== undefined
  },

  /**
   * Check if value is null or undefined
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is null or undefined
   * @example
   * is.nil(null) // true
   * is.nil(undefined) // true
   * is.nil(0) // false
   * is.nil('') // false
   */
  nil (value) {
    return !is.defined(value)
  },

  /**
   * Check if value is a plain object (not array, not null, not a class instance)
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a plain object literal
   * @example
   * is.plainObject({}) // true
   * is.plainObject({ name: 'John' }) // true
   * is.plainObject([]) // false
   * is.plainObject(null) // false
   * is.plainObject(new Date()) // false
   */
  plainObject (value) {
    return is.defined(value) &&
           typeof value === 'object' &&
           !Array.isArray(value) &&
           value.constructor === Object
  },

  /**
   * Check if value is an empty object
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a plain object with no keys
   * @example
   * is.emptyObject({}) // true
   * is.emptyObject({ name: 'John' }) // false
   * is.emptyObject([]) // false
   */
  emptyObject (value) {
    return is.plainObject(value) && Object.keys(value).length === 0
  },

  /**
   * Check if value is a string
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a string
   * @example
   * is.string('hello') // true
   * is.string('') // true
   * is.string(123) // false
   */
  string (value) {
    return typeof value === 'string'
  },

  /**
   * Check if value is an empty string (whitespace only)
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a string with only whitespace
   * @example
   * is.emptyString('') // true
   * is.emptyString('   ') // true
   * is.emptyString('hello') // false
   * is.emptyString(null) // false
   */
  emptyString (value) {
    return is.string(value) && value.trim().length === 0
  },

  /**
   * Check if value is a valid number (not NaN, not Infinity)
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a finite number
   * @example
   * is.number(42) // true
   * is.number(3.14) // true
   * is.number(NaN) // false
   * is.number(Infinity) // false
   * is.number('42') // false
   */
  number (value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  },

  /**
   * Check if value is an integer
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is an integer
   * @example
   * is.integer(42) // true
   * is.integer(0) // true
   * is.integer(3.14) // false
   * is.integer('42') // false
   */
  integer (value) {
    return is.number(value) && Number.isInteger(value)
  },

  /**
   * Check if value is an array
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is an array
   * @example
   * is.array([]) // true
   * is.array([1, 2, 3]) // true
   * is.array({}) // false
   * is.array('hello') // false
   */
  array (value) {
    return Array.isArray(value)
  },

  /**
   * Check if value is an empty array
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is an array with no elements
   * @example
   * is.emptyArray([]) // true
   * is.emptyArray([1, 2]) // false
   * is.emptyArray({}) // false
   */
  emptyArray (value) {
    return is.array(value) && value.length === 0
  },

  /**
   * Check if value is an array of specific length
   * @param {*} value - The value to check
   * @param {number} length - The expected length
   * @returns {boolean} True if the value is an array with the specified length
   * @example
   * is.arrayOfLength([1, 2, 3], 3) // true
   * is.arrayOfLength([1, 2], 3) // false
   * is.arrayOfLength([], 0) // true
   */
  arrayOfLength (value, length) {
    return is.array(value) && value.length === length
  },

  /**
   * Check if value is a function
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a function
   * @example
   * is.function(() => {}) // true
   * is.function(function() {}) // true
   * is.function(Array.isArray) // true
   * is.function({}) // false
   */
  function (value) {
    return typeof value === 'function'
  },

  /**
   * Check if value is a boolean
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a boolean
   * @example
   * is.boolean(true) // true
   * is.boolean(false) // true
   * is.boolean(1) // false
   * is.boolean('true') // false
   */
  boolean (value) {
    return typeof value === 'boolean'
  },

  /**
   * Check if value is one of the allowed values
   * @param {*} value - The value to check
   * @param {Array} allowedValues - Array of allowed values
   * @returns {boolean} True if the value is included in allowedValues
   * @example
   * is.oneOf('red', ['red', 'green', 'blue']) // true
   * is.oneOf('yellow', ['red', 'green', 'blue']) // false
   * is.oneOf(2, [1, 2, 3]) // true
   */
  oneOf (value, allowedValues) {
    return allowedValues.includes(value)
  },

  /**
   * Check if value is a positive number
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a number greater than 0
   * @example
   * is.positive(5) // true
   * is.positive(0.1) // true
   * is.positive(0) // false
   * is.positive(-5) // false
   */
  positive (value) {
    return is.number(value) && value > 0
  },

  /**
   * Check if value is a negative number
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is a number less than 0
   * @example
   * is.negative(-5) // true
   * is.negative(-0.1) // true
   * is.negative(0) // false
   * is.negative(5) // false
   */
  negative (value) {
    return is.number(value) && value < 0
  },

  /**
   * Check if value is within a numeric range (inclusive)
   * @param {*} value - The value to check
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {boolean} True if the value is a number between min and max (inclusive)
   * @example
   * is.inRange(5, 1, 10) // true
   * is.inRange(1, 1, 10) // true
   * is.inRange(10, 1, 10) // true
   * is.inRange(0, 1, 10) // false
   * is.inRange(11, 1, 10) // false
   */
  inRange (value, min, max) {
    return is.number(value) && value >= min && value <= max
  },

  /**
   * Check if value is empty (null, undefined, empty string, empty array, or empty object)
   * @param {*} value - The value to check
   * @returns {boolean} True if the value is considered empty
   * @example
   * is.empty(null) // true
   * is.empty(undefined) // true
   * is.empty('') // true
   * is.empty('   ') // true
   * is.empty([]) // true
   * is.empty({}) // true
   * is.empty(0) // false
   * is.empty(false) // false
   * is.empty('hello') // false
   */
  empty (value) {
    if (is.nil(value)) return true
    if (is.string(value)) return value.trim().length === 0
    if (is.array(value)) return value.length === 0
    if (is.plainObject(value)) return Object.keys(value).length === 0
    return false
  }
}
