// Keep process.env.NODE_ENV literal so that consumer bundlers can replace it
const ENABLED = (() => {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    // no process and no bundler replacement: keep assertions on
    return true
  }
})()

export class AssertionError extends Error {
  constructor (message) {
    super(message)
    this.name = 'AssertionError'
  }
}

function check (value, validator, message) {
  if (!validator(value)) throw new AssertionError(message)
}

export const assert = {
  that (value, validator, message) {
    if (!ENABLED) return
    check(value, validator, message)
  },

  all (validations) {
    if (!ENABLED) return
    for (const { value, validator, message } of validations) {
      check(value, validator, message)
    }
  },

  any (validations) {
    if (!ENABLED) return
    if (validations.length === 0) return
    const passed = validations.some(({ value, validator }) => validator(value))
    if (!passed) {
      throw new AssertionError(validations.map(({ message }) => message).join(' or '))
    }
  }
}
