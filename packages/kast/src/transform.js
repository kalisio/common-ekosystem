import _ from 'lodash'
import { assert, is } from '@kalisio/kore'
import { convert } from './convert.js'
import { filter } from './filter.js'
import { apply } from './apply.js'

export function transform (json, options) {
  assert.all([
    { value: json, validator: (v) => is.plainObject(v) || is.array(v), message: 'json must be an object or an array' },
    { value: options, validator: is.plainObject, message: 'options must be an object' }
  ])
  if (options.toArray) json = convert.toArray(json)
  if (options.toObjects) json = convert.toObjects(json, options.toObjects)
  // Safety check
  const isArray = Array.isArray(json)
  if (!isArray) json = [json]
  if (options.filter) json = filter(json, options.filter)
  // By default we perform transformation in place
  if (!_.get(options, 'inPlace', true)) {
    json = _.cloneDeep(json)
  }
  // Apply mapping
  if (options.mapping) apply.mapping(json, options.mapping)
  // Iterate over unit mapping
  if (options.unitMapping) apply.unitMapping(json, options.unitMapping)
  // Then iterate over JSON objects to pick/omit properties in place
  if (options.pick || options.omit || options.merge) {
    apply.modifier(json, _.pick(options, ['pick', 'omit', 'merge']))
  }
  // Transform back to object when required
  if (!isArray) {
    if (!options.asArray) json = (json.length > 0 ? json[0] : {})
  } else if (options.asObject) {
    json = (json.length > 0 ? json[0] : {})
  }
  return json
}
