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
  },

  any (validations) {
    const passed = validations.some(({ value, validator }) => validator(value))
    if (!passed) {
      const message = validations.map(({ message }) => message).join(' or ')
      throw new TypeError(message)
    }
  }
}
