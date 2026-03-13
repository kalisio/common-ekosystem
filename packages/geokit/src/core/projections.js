import { asserts, is, has } from '@kalisio/check'
import proj4 from 'proj4'

export const projections = {
  list () {
    return Object.keys(proj4.defs)
  },

  define (name, def) {
    asserts.all([
      { value: name, validator: is.nonEmptyString, message: 'name must be a non empty string' },
      { value: def, validator: (v) => (is.nonEmptyString(v) || is.nonEmptyObject(v)), message: 'def must be a non empty string or a non empty object' }
    ])
    proj4.defs(name, def)
  },

  get (name) {
    asserts.all([
      { value: name, validator: is.nonEmptyString, message: 'name must be a non empty string' },
      { value: name, validator: (v) => has.key(proj4.defs, v), message: 'name must be a defined projection' }
    ])
    return proj4.defs(name)
  }
}
