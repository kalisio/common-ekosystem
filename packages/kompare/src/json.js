import fs from 'node:fs'
import _ from 'lodash'
import { assert, is } from '@kalisio/kore'
import { normalizeString } from './text'

// Helper function to normalize a content in order to be compared with _.isEqual
function normalizeObject (object, options) {
  if (_.isArray(object)) {
    return _.chain(object)
      .map(v => normalizeObject(v, options))
      .sortBy(v => JSON.stringify(v))
      .value()
  }
  if (_.isPlainObject(object)) {
    const ignoredKeys = _.get(options, 'ignoredKeys', [])
    return _.chain(object)
      .toPairs()
      .filter(([key]) => !ignoredKeys.includes(key)) // ignore key
      .sortBy(([key]) => key) // sort keys
      .map(([k, v]) => [k, normalizeObject(v, options)])
      .fromPairs()
      .value()
  }
  if (_.isString(object)) {
    return normalizeString(object, options)
  }
  return object
}

// Helper function to calculate the differences between 2 objects
function diffObjects (object1, object2, path = '', diffs = { missing: [], extra: [], updated: [] }) {
  _.forEach(object1, (value, key) => {
    const newPath = path ? `${path}.${key}` : key
    if (!_.has(object2, key)) {
      diffs.missing.push(newPath)
    } else if (!_.isEqual(value, object2[key])) {
      if (_.isObject(value) && _.isObject(object2[key])) {
        diffObjects(value, object2[key], newPath, diffs)
      } else {
        diffs.updated.push({
          path: newPath,
          oldValue: value,
          newValue: object2[key]
        })
      }
    }
  })
  _.forEach(object2, (value, key) => {
    const newPath = path ? `${path}.${key}` : key
    if (!_.has(object1, key)) {
      diffs.extra.push(newPath)
    }
  })
  return diffs
}

export const json = {

  isEqual (json1, json2, options = {}) {
    assert.all([
      { value: json1, validator: is.nonEmptyObject, message: 'json1 should be a non-empty object' },
      { value: json2, validator: is.nonEmptyObject, message: 'json2 should be a non-empty object' }
    ])
    const obj1 = normalizeObject(json1, options)
    const obj2 = normalizeObject(json2, options)
    return _.isEqual(obj1, obj2)
  },

  isEqualFile (json, jsonFilePath, options = {}) {
    assert.all([
      { value: json, validator: is.nonEmptyObject, message: 'json should be a non-empty object' },
      { value: jsonFilePath, validator: is.nonEmptyString, message: 'jsonFilePath should be a non-empty string' }
    ])
    const jsonFileContent = fs.readFileSync(jsonFilePath, 'utf-8')
    return this.isEqual(json, JSON.parse(jsonFileContent), options)
  },

  isEqualFiles (jsonFilePath1, jsonFilePath2, options = {}) {
    assert.all([
      { value: jsonFilePath1, validator: is.nonEmptyString, message: 'jsonFilePath1 should be a non-empty string' },
      { value: jsonFilePath2, validator: is.nonEmptyString, message: 'jsonFilePath2 should be a non-empty string' }
    ])
    const jsonFileContent1 = fs.readFileSync(jsonFilePath1, 'utf-8')
    const jsonFileContent2 = fs.readFileSync(jsonFilePath2, 'utf-8')
    return this.isEqual(JSON.parse(jsonFileContent1), JSON.parse(jsonFileContent2), options)
  },

  compare (json1, json2, options = {}) {
    assert.all([
      { value: json1, validator: is.nonEmptyObject, message: 'json1 should be a non-empty object' },
      { value: json2, validator: is.nonEmptyObject, message: 'json2 should be a non-empty object' }
    ])
    const obj1 = normalizeObject(json1, options)
    const obj2 = normalizeObject(json2, options)
    return {
      isEqual: _.isEqual(obj1, obj2),
      differences: diffObjects(obj1, obj2)
    }
  }
}
