const ENABLED =
  typeof process === 'undefined' ||
  process.env?.NODE_ENV !== 'production'

export const assert = {

  that (value, validator, errorMessage) {
    if (!ENABLED) return
    if (!validator(value)) {
      throw new TypeError(errorMessage)
    }
  },

  all (validations) {
    if (!ENABLED) return
    for (const { value, validator, message } of validations) {
      assert.that(value, validator, message)
    }
  },

  any (validations) {
    if (!ENABLED) return
    const passed = validations.some(({ value, validator }) => validator(value))
    if (!passed) {
      throw new TypeError(
        validations.map(({ message }) => message).join(' or ')
      )
    }
  }

}
