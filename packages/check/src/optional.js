import { is } from './is.js'
import { assert } from './assert.js'

export function optional (validator) {
  assert.that(validator, is.function, 'validator must be a function')
  function optionalValidator (value) {
    if (is.nil(value)) return true
    return validator(value)
  }
  optionalValidator._optional = true
  return optionalValidator
}
