import _ from 'lodash'
import { assert, is } from '@kalisio/check'
import { convert } from './convert.js'

export const apply = {

  mapping (array, mapping) {
    assert.all([
      { value: array, validator: is.array, message: 'array must be an array' },
      { value: mapping, validator: is.plainObject, message: 'mapping must be an object' }
    ])
    _.forOwn(mapping, (output, inputPath) => {
      const isOutputObject = typeof output === 'object'
      const outputPath = isOutputObject ? output.path : output
      const shouldDelete = isOutputObject ? _.get(output, 'delete', true) : true
      _.forEach(array, object => {
        if (!_.has(object, inputPath)) return
        let value = _.get(object, inputPath)
        if (isOutputObject && output.values) value = output.values[value]
        _.set(object, outputPath, value)
        if (shouldDelete && inputPath !== outputPath) _.unset(object, inputPath)
      })
    })
    return array
  },

  unitMapping (array, unitMapping) {
    assert.all([
      { value: array, validator: is.array, message: 'array must be an array' },
      { value: unitMapping, validator: is.plainObject, message: 'unitMapping must be an object' }
    ])
    _.forOwn(unitMapping, (units, path) => {
      _.forEach(array, object => {
        if (_.has(object, path)) {
          let value = convert.toValue(_.get(object, path), units)
          if (units.asCase && typeof value === 'string') {
            value = _[units.asCase] ? _[units.asCase](value) : value[units.asCase]()
          }
          _.set(object, path, value)
        } else if (_.has(units, 'empty')) {
          _.set(object, path, units.empty)
        }
      })
    })
    return array
  },

  modifier (array, modifier) {
    assert.all([
      { value: array, validator: is.array, message: 'array must be an array' },
      { value: modifier, validator: is.plainObject, message: 'modifier must be an object' }
    ])
    for (let i = 0; i < array.length; i++) {
      let object = array[i]
      if (modifier.pick) object = _.pick(object, modifier.pick)
      if (modifier.omit) object = _.omit(object, modifier.omit)
      if (modifier.merge) _.merge(object, modifier.merge)
      array[i] = object
    }
    return array
  }
}
