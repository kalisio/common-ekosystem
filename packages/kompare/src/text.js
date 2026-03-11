import fs from 'fs'

export function normalizeString (str, options) {
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

  isEqual (text1, text2, options = {}) {
    const str1 = normalizeString(text1, options)
    const str2 = normalizeString(text2, options)
    return str1 === str2
  },

  isEqualFile (text, textFilePath, options = {}) {
    const textFileContent = fs.readFileSync(textFilePath, 'utf-8')
    return this.isEqual(text, textFileContent, options)
  },

  isEqualFiles (textFilePath1, textFilePath2, options = {}) {
    const textFileContent1 = fs.readFileSync(textFilePath1, 'utf-8')
    const textFileContent2 = fs.readFileSync(textFilePath2, 'utf-8')
    return this.isEqual(textFileContent1, textFileContent2, options)
  }
}
