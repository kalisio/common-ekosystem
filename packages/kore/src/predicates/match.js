import { assert } from './assert.js'
import { is } from './is.js'

export const match = {

  pattern (value, pattern) {
    assert.all([
      { value, validator: is.string, message: 'value must be a string' },
      { value: pattern, validator: (v) => v instanceof RegExp, message: 'pattern must be a RegExp' }
    ])
    return is.string(value) && pattern instanceof RegExp && pattern.test(value)
  }

}
