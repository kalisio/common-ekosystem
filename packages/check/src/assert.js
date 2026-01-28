export const assert = {
  // Assert that a value passes validation
  that (value, validator, errorMessage) {
    if (!validator(value)) {
      throw new TypeError(errorMessage)
    }
  },

  // Assert multiple validations
  all (validations) {
    for (const { value, validator, message } of validations) {
      assert.that(value, validator, message)
    }
  }
}
