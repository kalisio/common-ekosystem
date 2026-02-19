import _ from 'lodash'

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
      console.log(`✚ Extra ${newPath}`)
    }
  })
}

export const json = {
  /**
   *
   *
   * @param {Object} object1 - The first object to compare.
   * @param {Object} object2 - The second object to compare.
   * @param {Object} [options={}] - Comparison options.
   * @param {Array} [options.ignoredKeys=[]] - Keys to ignore during comparison.
   *
   * @returns {boolean}
   */
  isEqual (object1, object2, options = {}) {
    const { ignoredKeys = [] } = options
    const norm1 = normalizeObject(object1, ignoredKeys)
    const norm2 = normalizeObject(object2, ignoredKeys)
    showObjectsDifferences(norm1, norm2)
    return _.isEqual(norm1, norm2)
  }
}
