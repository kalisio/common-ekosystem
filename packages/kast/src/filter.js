import sift from 'sift'
import { assert, is } from '@kalisio/kore'

export function filter (array, query) {
  assert.all([
    { value: array, validator: is.array, message: 'array must be an array' },
    { value: query, validator: is.plainObject, message: 'query must be an object' }
  ])
  const predicate = sift(query)
  return array.filter(predicate)
}
