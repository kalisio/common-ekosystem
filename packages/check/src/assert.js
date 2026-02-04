/**
 * Utilities for asserting values and validations
 * @namespace assert
 */
export const assert = {
  /**
   * Assert that a value passes validation
   * @param {*} value - The value to validate
   * @param {Function} validator - A function that returns true if the value is valid
   * @param {string} errorMessage - The error message to throw if validation fails
   * @throws {TypeError} Throws a TypeError if the validator returns false
   * @returns {void}
   * @example
   * assert.that(5, (v) => v > 0, 'Value must be positive') // passes
   * assert.that(-1, (v) => v > 0, 'Value must be positive') // throws TypeError
   * assert.that('hello', (v) => typeof v === 'string', 'Must be a string') // passes
   */
  that (value, validator, errorMessage) {
    if (!validator(value)) {
      throw new TypeError(errorMessage)
    }
  },

  /**
   * Assert multiple validations at once
   * @param {Array<{value: *, validator: Function, message: string}>} validations - Array of validation objects
   * @param {*} validations[].value - The value to validate
   * @param {Function} validations[].validator - The validator function
   * @param {string} validations[].message - The error message if validation fails
   * @throws {TypeError} Throws a TypeError on the first failed validation
   * @returns {void}
   * @example
   * assert.all([
   *   { value: 5, validator: (v) => v > 0, message: 'Must be positive' },
   *   { value: 'test', validator: (v) => v.length > 0, message: 'Must not be empty' }
   * ]) // passes
   *
   * @example
   * assert.all([
   *   { value: 5, validator: (v) => v > 0, message: 'Must be positive' },
   *   { value: -1, validator: (v) => v > 0, message: 'Must be positive' }
   * ]) // throws TypeError: 'Must be positive'
   */
  all (validations) {
    for (const { value, validator, message } of validations) {
      assert.that(value, validator, message)
    }
  }
}
