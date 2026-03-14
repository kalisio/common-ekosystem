import { is } from './is.js'
import { asserts } from './asserts.js'

export function optional (validator) {
  asserts.that(validator, is.function, 'validator must be a function')
  function optionalValidator (value) {
    return validator(value)
  }
  optionalValidator._optional = true
  return optionalValidator
}
