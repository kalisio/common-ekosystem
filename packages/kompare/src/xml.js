import fs from 'fs'
import { XMLParser } from 'fast-xml-parser'
import { json } from './json.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true
})

function normalizeString (str, options) {
  const {
    ignoreSpaces = false,
    ignoreAccents = false,
    ignoreCase = false
  } = options
  let result = str
  if (ignoreSpaces) {
    result = result.trim()
  }
  if (ignoreAccents) {
    result = result
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }
  if (ignoreCase) {
    result = result.toLowerCase()
  }
  return result
}

export const xml = {

  /**
   * Compares two XML strings after normalization and parsing.
   *
   * @param {string} xml1 - The first XML string to compare.
   * @param {string} xml2 - The second XML string to compare.
   * @param {Object} [options={}] - Normalization options.
   * @param {boolean} [options.ignoreCase=false] - Whether to ignore case differences.
   * @param {boolean} [options.ignoreSpaces=false] - Whether to ignore leading and trailing spaces.
   * @param {boolean} [options.ignoreAccents=false] - Whether to remove diacritical marks before comparison.
   */
  isEqual (xml1, xml2, options = {}) {
    const str1 = normalizeString(xml1, options)
    const str2 = normalizeString(xml2, options)

    const obj1 = parser.parse(str1)
    const obj2 = parser.parse(str2)

    return json.isEqual(obj1, obj2, options)
  },

  isEqualFile (content, filePath, options = {}) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return this.isEqual(content, fileContent, options)
  },

  isEqualFiles (path1, path2, options = {}) {
    const fileContent1 = fs.readFileSync(path1, 'utf-8')
    const fileContent2 = fs.readFileSync(path2, 'utf-8')
    return this.isEqual(fileContent1, fileContent2, options)
  },

  compare (a, b, options = {}) {
    const str1 = normalizeString(a, options)
    const str2 = normalizeString(b, options)

    const obj1 = parser.parse(str1)
    const obj2 = parser.parse(str2)

    return json.compare(obj1, obj2, options)
  }
}
