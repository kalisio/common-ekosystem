import _ from 'lodash'
import { XMLParser } from 'fast-xml-parser'
import { createComparator } from './comparator.js'

const DEFAULT_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true
}

export const xml = createComparator((str, options) => {
  const parser = new XMLParser({ ...DEFAULT_PARSER_OPTIONS, ..._.get(options, 'parser', {}) })
  return parser.parse(str)
})
