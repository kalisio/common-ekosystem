import { is } from './is.js'
import { has } from './has.js'
import { assert } from './assert.js'

function check (obj, schema, path = '') {
  return Object.entries(schema).every(([key, validator]) => {
    const fullPath = path ? `${path}.${key}` : key
    if (!has.key(obj, key)) {
      return validator._optional === true
    }
    const value = obj[key]
    if (is.plainObject(validator)) {
      // recursive check
      return is.plainObject(value) && check(value, validator, fullPath)
    }
    if (typeof validator === 'function') {
      // validate value
      return validator(value)
    }
    // raise an error
    throw new TypeError(`Invalid validator for key "${fullPath}"`)
  })
}

export const conform = {
  schema (obj, schema) {
    assert.all([
      { value: obj, validator: is.plainObject, message: 'obj must be an object' },
      { value: schema, validator: is.plainObject, message: 'schema must be an object' }
    ])
    return check(obj, schema)
  }

}
