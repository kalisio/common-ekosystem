export const assert = {

  isEnabled: process.env?.NODE_ENV !== 'production',

  that (value, validator, errorMessage) {
    if (!assert.isEnabled) return
    if (!validator(value)) {
      throw new TypeError(errorMessage)
    }
  },

  all (validations) {
    if (!assert.isEnabled) return
    for (const { value, validator, message } of validations) {
      assert.that(value, validator, message)
    }
  },

  any (validations) {
    if (!assert.isEnabled) return
    const passed = validations.some(({ value, validator }) => validator(value))
    if (!passed) {
      const message = validations.map(({ message }) => message).join(' or ')
      throw new TypeError(message)
    }
  }
}
