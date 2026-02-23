export const assert = {

  that (value, validator, errorMessage) {
    if (!validator(value)) {
      throw new TypeError(errorMessage)
    }
  },

  all (validations) {
    for (const { value, validator, message } of validations) {
      assert.that(value, validator, message)
    }
  }
}
