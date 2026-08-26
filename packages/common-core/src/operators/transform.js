import { isNumber, toNumber, has, get, set, unset, pick, omit, merge, camelCase, snakeCase, kebabCase, startCase, upperCase, lowerCase } from 'lodash-es'
import { unit } from 'mathjs'
import moment from 'moment'
import sift from 'sift'
import { assert, is } from '../predicates/index.js'
import { object } from '../utilities/index.js'

const CASE_FUNCTIONS = {
  camelCase,
  snakeCase,
  kebabCase,
  startCase,
  upperCase,
  lowerCase
}

function convert (value, units) {
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
    return isNumber(units.asString) ? value.toString(units.asString) : value.toString()
  }
  if (units.asNumber) {
    // Large numbers are sometimes written with space separators, e.g. '120 000 500'
    if (typeof value === 'string') value = value.replace(/ /g, '')
    return toNumber(value)
  }
  return unit(value, units.from).toNumber(units.to)
}

function mapping (array, mapping) {
  for (const [inputPath, output] of Object.entries(mapping)) {
    const isOutputObject = typeof output === 'object'
    const outputPath = isOutputObject ? output.path : output
    const shouldDelete = isOutputObject ? (output.delete ?? true) : true
    for (const object of array) {
      if (!has(object, inputPath)) continue
      let value = get(object, inputPath)
      if (isOutputObject && output.values) value = output.values[value]
      set(object, outputPath, value)
      if (shouldDelete && inputPath !== outputPath) unset(object, inputPath)
    }
  }
  return array
}

function unitMapping (array, unitMapping) {
  for (const [inputPath, units] of Object.entries(unitMapping)) {
    for (const obj of array) {
      if (has(obj, inputPath)) {
        let value = convert(get(obj, inputPath), units)
        if (units.asCase && typeof value === 'string') {
          const caseFn = CASE_FUNCTIONS[units.asCase]
          // asCase accepts a lodash case function or a native String method, e.g. toUpperCase.
          if (caseFn) value = caseFn(value)
          else if (typeof value[units.asCase] === 'function') value = value[units.asCase]()
        }
        set(obj, inputPath, value)
      } else if (has(units, 'empty')) {
        set(obj, inputPath, units.empty)
      }
    }
  }
  return array
}

export function transform (obj, options) {
  assert.all([
    { value: obj, validator: (v) => is.plainObject(v) || is.array(v), message: 'obj must be an object or an array' },
    { value: options, validator: is.plainObject, message: 'options must be an object' }
  ])
  if (options.toArray) obj = Object.values(obj)
  if (options.toObjects) obj = obj.map(arr => Object.fromEntries(options.toObjects.map((k, i) => [k, arr[i]])))
  const isArray = Array.isArray(obj)
  if (!isArray) obj = [obj]
  if (options.filter) obj = obj.filter(sift(options.filter))
  if (!(options.inPlace ?? true)) {
    obj = object.clone(obj)
  }
  if (options.mapping) mapping(obj, options.mapping)
  if (options.unitMapping) unitMapping(obj, options.unitMapping)
  if (options.pick || options.omit || options.merge) {
    for (let i = 0; i < obj.length; i++) {
      let tmp = obj[i]
      if (options.pick) tmp = pick(tmp, options.pick)
      if (options.omit) tmp = omit(tmp, options.omit)
      if (options.merge) merge(tmp, options.merge)
      obj[i] = tmp
    }
  }
  if (!isArray) {
    if (!options.asArray) obj = (obj.length > 0 ? obj[0] : {})
  } else if (options.asObject) {
    obj = (obj.length > 0 ? obj[0] : {})
  }
  return obj
}
