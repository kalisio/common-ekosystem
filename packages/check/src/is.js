import { assert } from './assert.js'

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

  nonEmptyObject (value) {
    return is.plainObject(value) && Object.keys(value).length > 0
  },

  string (value) {
    return typeof value === 'string'
  },

  emptyString (value) {
    return is.string(value) && value.trim().length === 0
  },

  nonEmptyString (value) {
    return is.string(value) && value.trim().length > 0
  },

  regularExpression (value) {
    return is.defined(value) && value instanceof RegExp
  },

  number (value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  },

  positive (value) {
    return is.number(value) && value > 0
  },

  nonPositive (value) {
    return is.number(value) && value <= 0
  },

  negative (value) {
    return is.number(value) && value < 0
  },

  nonNegative (value) {
    return is.number(value) && value >= 0
  },

  inRange (value, min, max) {
    assert.that(max, (v) => v >= min, 'max must be greater than or equal to min')
    return is.number(value) && value >= min && value <= max
  },

  inRangeExclusive (value, min, max) {
    assert.that(max, (v) => v > min, 'max must be greater than min')
    return is.number(value) && value > min && value < max
  },

  inRangeExclusiveMin (value, min, max) {
    assert.that(max, (v) => v > min, 'max must be greater than min')
    return is.number(value) && value > min && value <= max
  },

  inRangeExclusiveMax (value, min, max) {
    assert.that(max, (v) => v >= min, 'max must be greater than or equal to min')
    return is.number(value) && value >= min && value < max
  },

  integer (value) {
    return is.number(value) && Number.isInteger(value)
  },

  positiveInteger (value) {
    return is.integer(value) && is.positive(value)
  },

  nonPositiveInteger (value) {
    return is.integer(value) && is.nonPositive(value)
  },

  negativeInteger (value) {
    return is.integer(value) && is.negative(value)
  },

  nonNegativeInteger (value) {
    return is.integer(value) && is.nonNegative(value)
  },
  array (value) {
    return Array.isArray(value)
  },

  emptyArray (value) {
    return is.array(value) && value.length === 0
  },

  nonEmptyArray (value) {
    return is.array(value) && value.length > 0
  },

  arrayOfLength (value, length) {
    assert.that(length, is.nonNegativeInteger, 'length must be a non negative integer')
    return is.array(value) && value.length === length
  },

  arrayOfLengthAtLeast (value, minLength) {
    assert.that(minLength, is.nonNegativeInteger, 'minLength must be a non negative integer')
    return is.array(value) && value.length >= minLength
  },

  arrayOfLengthAtMost (value, maxLength) {
    assert.that(maxLength, is.nonNegativeInteger, 'maxLength must be a non negative integer')
    return is.array(value) && value.length <= maxLength
  },

  arrayOfLengthBetween (value, minLength, maxLength) {
    assert.all([
      { value: minLength, validator: is.nonNegativeInteger, message: 'minLength must be a non negative integer' },
      { value: maxLength, validator: is.nonNegativeInteger, message: 'maxLength must be a non negative integer' },
      { value: minLength, validator: (v) => v <= maxLength, message: 'minLength must be less than or equal to maxLength' }
    ])
    return is.array(value) && value.length >= minLength && value.length <= maxLength
  },

  map (value) {
    return is.defined(value) && value instanceof Map
  },

  emptyMap (value) {
    return is.map(value) && value.size === 0
  },

  nonEmptyMap (value) {
    return is.map(value) && value.size > 0
  },

  set (value) {
    return is.defined(value) && value instanceof Set
  },

  emptySet (value) {
    return is.set(value) && value.size === 0
  },

  nonEmptySet (value) {
    return is.set(value) && value.size > 0
  },

  function (value) {
    return typeof value === 'function'
  },

  boolean (value) {
    return typeof value === 'boolean'
  },

  oneOf (value, allowedValues) {
    assert.that(allowedValues, is.nonEmptyArray, 'allowed values must be a non empty array')
    return allowedValues.includes(value)
  },

  empty (value) {
    if (is.nil(value)) return true
    if (is.string(value)) return is.emptyString(value)
    if (is.array(value)) return is.emptyArray(value)
    if (is.plainObject(value)) return is.emptyObject(value)
    if (is.map(value)) return is.emptyMap(value)
    if (is.set(value)) return is.emptySet(value)
    return false
  }

}
