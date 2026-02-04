import { is } from './is.js'

/**
 * Pattern matching and validation utilities
 * @namespace matches
 */
export const matches = {
  /**
   * Check if a string value matches a regular expression pattern
   * @param {*} value - The value to test
   * @param {RegExp} pattern - The regular expression pattern to match against
   * @returns {boolean} True if the value is a string and matches the pattern
   * @example
   * matches.pattern('hello123', /\d+/) // true
   * matches.pattern('hello', /^\w+$/) // true
   * matches.pattern('test@example.com', /^[\w.-]+@[\w.-]+\.\w+$/) // true
   * matches.pattern('hello', /\d+/) // false
   * matches.pattern(123, /\d+/) // false (not a string)
   * matches.pattern('hello', 'pattern') // false (not a RegExp)
   */
  pattern (value, pattern) {
    return is.string(value) && pattern instanceof RegExp && pattern.test(value)
  }
}
