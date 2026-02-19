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

export const text = {

  /**
   * Compares two strings after normalization.
   *
   * The comparison can ignore case, surrounding spaces, and/or accents
   * depending on the provided options.
   *
   * @param {string} text1 - The first string to compare.
   * @param {string} text2 - The second string to compare.
   * @param {Object} [options={}] - Normalization options.
   * @param {boolean} [options.ignoreCase=false] - Whether to ignore case differences.
   * @param {boolean} [options.ignoreSpaces=false] - Whether to ignore leading and trailing spaces.
   * @param {boolean} [options.ignoreAccents=false] - Whether to remove diacritical marks before comparison.
   *
   * @returns {boolean} Returns `true` if the normalized strings are equal, otherwise `false`.
   *
   * @example
   * equal("École", "ecole", {
   *   ignoreCase: true,
   *   ignoreAccents: true
   * })
   * // → true
   */
  isEqual (text1, text2, options = {}) {
    const str1 = normalizeString(text1, options)
    const str2 = normalizeString(text2, options)
    return str1 === str2
  }
}
