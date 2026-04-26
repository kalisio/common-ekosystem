import { assert, is } from '@kalisio/common-core'
import proj4 from 'proj4'

export function listProjections () {
  return Object.keys(proj4.defs)
}

export function registerProjection (name, def) {
  assert.all([
    { value: name, validator: is.nonEmptyString, message: 'name must be a non empty string' },
    { value: def, validator: (v) => (is.nonEmptyString(v) || is.nonEmptyObject(v)), message: 'def must be a non empty string or a non empty object' }
  ])
  proj4.defs(name, def)
}

export function hasProjection (name) {
  assert.that(name, is.nonEmptyString, 'name must be a non empty string')
  return is.defined(proj4.defs(name))
}

export function getProjection (name) {
  assert.that(name, is.nonEmptyString, 'name must be a non empty string')
  return proj4.defs(name)
}
