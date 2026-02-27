import fs from 'fs'

// Helper function to normalize an XML content based on options
// Same normalization logic as in text.js, applied to the XML string
function normalizeXmlString (str, options) {
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
   * Compares two XML strings after normalization.
   *
   * The comparison can ignore case, surrounding spaces, and/or accents
   * depending on the provided options.
   *
   * @param {string} xml1 - The first XML string to compare.
   * @param {string} xml2 - The second XML string to compare.
   * @param {Object} [options={}] - Normalization options.
   * @param {boolean} [options.ignoreCase=false] - Whether to ignore case differences.
   * @param {boolean} [options.ignoreSpaces=false] - Whether to ignore leading and trailing spaces.
   * @param {boolean} [options.ignoreAccents=false] - Whether to remove diacritical marks before comparison.
   *
   * @returns {boolean} Returns `true` if the normalized XML strings are equal, otherwise `false`.
   */
  isEqual (xml1, xml2, options = {}) {
    const str1 = normalizeXmlString(xml1, options)
    const str2 = normalizeXmlString(xml2, options)
    return str1 === str2
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
    const areEqual = this.isEqual(a, b, options)
    const str1 = normalizeXmlString(a, options)
    const str2 = normalizeXmlString(b, options)

    return {
      isEqual: areEqual,
      differences: areEqual
        ? { updated: [] }
        : {
            updated: [{
              // We use 'xml' as the path to indicate the entire XML block differs
              path: 'xml',
              oldValue: str1,
              newValue: str2
            }]
          }
    }
  }
}
