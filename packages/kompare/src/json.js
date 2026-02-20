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

// Helper function to display the differences between 2 objects
function showObjectsDifferences (object1, object2, path = '') {
  _.forEach(object1, (value, key) => {
    const newPath = path ? `${path}.${key}` : key
    if (!_.has(object2, key)) {
      console.log(`:heavy_multiplication_x: Missing ${newPath}`)
    } else if (!_.isEqual(value, object2[key])) {
      if (_.isObject(value) && _.isObject(object2[key])) {
        showObjectsDifferences(value, object2[key], newPath)
      } else {
        console.log(`:arrows_counterclockwise: Updated ${newPath}: ${value} -> ${object2[key]}`)
      }
    }
  })
  _.forEach(object2, (value, key) => {
    const newPath = path ? `${path}.${key}` : key
    if (!_.has(object1, key)) {
      console.log(`Extra ${newPath}`)
    }
  })
}

export const json = {

  /**
   * Compares two JSON objects after normalization.
   *
   * The comparison can ignore specific keys provided in the options.
   *
   * @param {Object|Array} object1 - The first object to compare.
   * @param {Object|Array} object2 - The second object to compare.
   * @param {Object} [options={}] - Comparison options.
   * @param {string[]} [options.ignoredKeys=[]] - Keys to ignore during comparison.
   *
   * @returns {boolean} Returns `true` if the normalized objects are equal, otherwise `false`.
   *
   * @example
   * isEqual({ a: 1, id: '1' }, { a: 1, id: '2' }, {
   * ignoredKeys: ['id']
   * })
   * // → true
   */

  isEqual (object1, object2, options = {}) {
    const {
      ignoredKeys = []
    } = options
    const obj1 = normalizeObject(object1, ignoredKeys)
    const obj2 = normalizeObject(object2, ignoredKeys)
    showObjectsDifferences(obj1, obj2)
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
    return this.isEqual(a, b, options)
  }
}
