import { asserts } from './asserts.js'
import { is } from './is.js'

export const matches = {

  pattern (value, pattern) {
    asserts.all([
      { value, validator: is.string, message: 'value must be a string' },
      { value: pattern, validator: (v) => v instanceof RegExp, message: 'pattern must be a RegExp' }
    ])
    return is.string(value) && pattern instanceof RegExp && pattern.test(value)
  }

}
