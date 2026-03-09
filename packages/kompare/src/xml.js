import fs from 'fs'
import { XMLParser } from 'fast-xml-parser'
import { json } from './json.js'
import { normalizeString } from './text.js'

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true
})

export const xml = {

  isEqual (xml1, xml2, options = {}) {
    const str1 = normalizeString(xml1, options)
    const str2 = normalizeString(xml2, options)

    const obj1 = PARSER.parse(str1)
    const obj2 = PARSER.parse(str2)

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

    const obj1 = PARSER.parse(str1)
    const obj2 = PARSER.parse(str2)

    return json.compare(obj1, obj2, options)
  }
}
