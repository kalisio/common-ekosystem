import { is } from './is.js'

export const matches = {
  pattern (value, pattern) {
    return is.string(value) && pattern instanceof RegExp && pattern.test(value)
  }
}
