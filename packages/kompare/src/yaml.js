import fs from 'fs'
import YAML from 'yaml'
import { json } from './json.js'

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

export const yaml = {

  /**
   * Compares two YAML strings after normalization and parsing.
   *
   * The comparison can ignore case, surrounding spaces, and/or accents
   * depending on the provided options (via JSON comparison).
   *
   * @param {string} yaml1 - The first YAML string to compare.
   * @param {string} yaml2 - The second YAML string to compare.
   * @param {Object} [options={}] - Normalization options.
   * @param {boolean} [options.ignoreCase=false] - Whether to ignore case differences.
   * @param {boolean} [options.ignoreSpaces=false] - Whether to ignore leading and trailing spaces.
   * @param {boolean} [options.ignoreAccents=false] - Whether to remove diacritical marks before comparison.
   *
   * @returns {boolean} Returns `true` if the normalized and parsed YAMLs are equal, otherwise `false`.
   *
   * @example
   * equal("key: Valeur", "key: valeur", {
   * ignoreCase: true
   * })
   * // → true
   */
  isEqual (yaml1, yaml2, options = {}) {
    const str1 = normalizeString(yaml1, options)
    const str2 = normalizeString(yaml2, options)

    const obj1 = YAML.parse(str1)
    const obj2 = YAML.parse(str2)

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

    const obj1 = YAML.parse(str1)
    const obj2 = YAML.parse(str2)

    return json.compare(obj1, obj2, options)
  }
}
