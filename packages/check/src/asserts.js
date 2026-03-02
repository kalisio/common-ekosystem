export const asserts = {

  that (value, validator, errorMessage) {
    if (!validator(value)) {
      throw new TypeError(errorMessage)
    }
  },

  all (validations) {
    for (const { value, validator, message } of validations) {
      asserts.that(value, validator, message)
    }
  }
}
