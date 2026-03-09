import _ from 'lodash'
import fs from 'fs'

// Helper function to normalize a content in order to be compared with _.isEqual
function normalizeObject (object, ignoredKeys = []) {
  if (_.isArray(object)) {
    return _.chain(object)
      .map(v => normalizeObject(v, ignoredKeys))
      .sortBy(v => JSON.stringify(v))
      .value()
  }
  if (_.isPlainObject(object)) {
    return _.chain(object)
      .toPairs()
      .filter(([key]) => !ignoredKeys.includes(key)) // ignore key
      .sortBy(([key]) => key) // sort keys
      .map(([k, v]) => [k, normalizeObject(v, ignoredKeys)])
      .fromPairs()
      .value()
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

  isEqual (object1, object2, options = {}) {
    const {
      ignoredKeys = []
    } = options
    const obj1 = normalizeObject(object1, ignoredKeys)
    const obj2 = normalizeObject(object2, ignoredKeys)
    return _.isEqual(obj1, obj2)
  },

  isEqualFile (object, filePath, options = {}) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const fileObject = JSON.parse(fileContent)
    return this.isEqual(object, fileObject, options)
  },

  isEqualFiles (path1, path2, options = {}) {
    const fileContent1 = fs.readFileSync(path1, 'utf-8')
    const fileContent2 = fs.readFileSync(path2, 'utf-8')
    return this.isEqual(JSON.parse(fileContent1), JSON.parse(fileContent2), options)
  },

  compare (a, b, options = {}) {
    const {
      ignoredKeys = []
    } = options
    const obj1 = normalizeObject(a, ignoredKeys)
    const obj2 = normalizeObject(b, ignoredKeys)

    const result = _.isEqual(obj1, obj2)
    const differences = diffObjects(obj1, obj2)

    return {
      isEqual: result,
      differences
    }
  }
}
