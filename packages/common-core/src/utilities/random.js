import { assert, is } from '../predicates/index.js'

export const random = {

  integer (min, max) {
    assert.all([
      { value: min, validator: is.integer, message: 'min must be an integer' },
      { value: max, validator: is.integer, message: 'max must be an integer' }
    ])
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  number (min, max) {
    assert.all([
      { value: min, validator: is.number, message: 'min must be a number' },
      { value: max, validator: is.number, message: 'max must be a number' }
    ])
    return Math.random() * (max - min) + min
  },

  choice (array) {
    assert.that(array, is.nonEmptyArray, 'array must be a non-empty array')
    return array[Math.floor(Math.random() * array.length)]
  },

  sample (generator, count) {
    assert.all([
      { value: generator, validator: is.function, message: 'generator must be a function' },
      { value: count, validator: is.nonNegativeInteger, message: 'count must be a non-negative integer' }
    ])
    return Array.from({ length: count }, () => generator())
  },

  shuffle (array) {
    assert.that(array, is.array, 'array must be an array')
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

}
