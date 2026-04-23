import _ from 'lodash'
import { unit } from 'mathjs'
import moment from 'moment'
import { assert, is } from '@kalisio/common-core'

export const convert = {

  toArray (obj) {
    assert.that(obj, is.plainObject, 'obj must be an object')
    return _.toArray(obj)
  },

  toObjects (obj, keys) {
    assert.all([
      { value: obj, validator: is.array, message: 'obj must be an array' },
      { value: keys, validator: is.nonEmptyArray, message: 'keys must be a non empty array' }
    ])
    return _.map(obj, array => _.zipObject(keys, array))
  },

  toValue (value, units) {
    assert.all([
      { value, validator: is.defined, message: 'value must be an array' },
      { value: units, validator: is.plainObject, message: 'units must be a non empty array' }
    ])
    if (units.asDate) {
      let date
      if (units.asDate === 'utc') {
        date = units.from ? moment.utc(value, units.from) : moment.utc(value)
      } else {
        date = units.from ? moment(value, units.from) : moment(value)
      }
      return units.to ? date.format(units.to) : date.toDate()
    }
    if (units.asString) {
      return _.isNumber(units.asString) ? value.toString(units.asString) : value.toString()
    }
    if (units.asNumber) {
      if (typeof value === 'string') value = _.replace(value, ' ', '')
      return _.toNumber(value)
    }
    return unit(value, units.from).toNumber(units.to)
  }

}
