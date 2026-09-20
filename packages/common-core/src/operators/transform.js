import { isNumber, toNumber, has, get, set, unset, pick, merge } from 'lodash-es'
import { unit } from 'mathjs'
import moment from 'moment'
import sift from 'sift'
import { assert, is } from '../predicates/index.js'
import { object, string } from '../utilities/index.js'

const CASE_FUNCTIONS = {
  camelCase: string.camelCase,
  pascalCase: string.pascalCase,
  kebabCase: string.kebabCase,
  snakeCase: string.snakeCase,
  constantCase: string.constantCase,
  dotCase: string.dotCase,
  startCase: string.startCase,
  upperCase: string.upperCase,
  lowerCase: string.lowerCase,
  capitalize: string.capitalize
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
  if (units.from || units.to) {
    return unit(value, units.from).toNumber(units.to)
  }
  return value
}

function mapping (array, mapping) {
  const entries = Object.entries(mapping).map(([inputPath, output]) => {
    const isOutputObject = is.plainObject(output)
    assert.that(
      output,
      (v) => is.nonEmptyString(v) || (is.plainObject(v) && is.nonEmptyString(v.path)),
      `mapping output for '${inputPath}' must be a non empty path or an object with a non empty path`
    )
    return {
      inputPath,
      outputPath: isOutputObject ? output.path : output,
      values: isOutputObject ? output.values : undefined,
      shouldDelete: isOutputObject ? (output.delete ?? true) : true
    }
  })
  for (const item of array) {
    const writes = entries
      .filter(e => has(item, e.inputPath))
      .map(e => {
        let value = get(item, e.inputPath)
        if (e.values) value = Object.hasOwn(e.values, value) ? e.values[value] : value
        return { ...e, value }
      })
    const targetPaths = new Set(writes.map(w => w.outputPath))
    for (const w of writes) set(item, w.outputPath, w.value)
    for (const w of writes) {
      if (w.shouldDelete && w.inputPath !== w.outputPath && !targetPaths.has(w.inputPath)) {
        unset(item, w.inputPath)
      }
    }
  }
  return array
}

function unitMapping (array, unitMapping) {
  const entries = Object.entries(unitMapping)
  // validate every units bag up front, before any mutation
  for (const [inputPath, units] of entries) {
    assert.that(units, is.plainObject, `unitMapping '${inputPath}' must be an object`)
  }
  for (const [inputPath, units] of entries) {
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

function toObjects (array, keys) {
  assert.all([
    { value: array, validator: (v) => is.arrayOf(v, is.array), message: 'toObjects requires an array of arrays' },
    { value: keys, validator: (v) => is.nonEmptyArrayOf(v, is.nonEmptyString), message: 'toObjects must be a non empty array of non empty strings' }
  ])
  return array.map(arr => Object.fromEntries(keys.map((key, index) => [key, arr[index]])))
}

function mutate (array, options) {
  for (const item of array) {
    if (options.pick) object.replace(item, pick(item, options.pick))
    if (options.omit) {
      for (const path of options.omit) unset(item, path)
    }
    if (options.merge) merge(item, options.merge)
  }
  return array
}

export function transform (obj, options) {
  assert.all([
    { value: obj, validator: (v) => is.plainObject(v) || is.array(v), message: 'obj must be an object or an array' },
    { value: options, validator: is.plainObject, message: 'options must be an object' }
  ])
  if (options.toArray) obj = Object.values(obj)
  if (options.toObjects) obj = toObjects(obj, options.toObjects)
  const isArray = Array.isArray(obj)
  if (!isArray) obj = [obj]
  if (options.filter) obj = obj.filter(sift(options.filter))
  if (!(options.inPlace ?? true)) obj = object.clone(obj)
  if (options.mapping) mapping(obj, options.mapping)
  if (options.unitMapping) unitMapping(obj, options.unitMapping)
  mutate(obj, options)
  if (!isArray) {
    if (!options.asArray) obj = (obj.length > 0 ? obj[0] : {})
  } else if (options.asObject) {
    obj = (obj.length > 0 ? obj[0] : {})
  }
  return obj
}
