// Always-active checks, for conditions that must still hold in production.
// A failure throws a TypeError by default, or an instance of the given error type.
export const ensure = {
  that (value, validator, message, ErrorType = TypeError) {
    if (!validator(value)) throw new ErrorType(message)
  },

  all (validations, ErrorType = TypeError) {
    for (const { value, validator, message } of validations) {
      ensure.that(value, validator, message, ErrorType)
    }
  },

  any (validations, ErrorType = TypeError) {
    if (validations.length === 0) return
    const passed = validations.some(({ value, validator }) => validator(value))
    if (!passed) {
      throw new ErrorType(validations.map(({ message }) => message).join(' or '))
    }
  }
}
