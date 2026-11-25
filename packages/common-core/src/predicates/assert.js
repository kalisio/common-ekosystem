import { ensure } from './ensure.js'

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

// Development-time checks: ensure raising AssertionError, skipped in production
export const assert = {
  that (value, validator, message) {
    if (ENABLED) ensure.that(value, validator, message, AssertionError)
  },

  all (validations) {
    if (ENABLED) ensure.all(validations, AssertionError)
  },

  any (validations) {
    if (ENABLED) ensure.any(validations, AssertionError)
  }
}
