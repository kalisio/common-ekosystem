import fs from 'node:fs'
import { asserts, is } from '@kalisio/check'
import { json } from './json.js'

function createComparator (parse) {
  return {
    isEqual (str1, str2, options = {}) {
      asserts.all([
        { value: str1, validator: (v) => !is.emptyString(v), message: 'str1 should be a non-empty string' },
        { value: str2, validator: (v) => !is.emptyString(v), message: 'str2 should be a non-empty string' }
      ])
      const obj1 = parse(str1, options)
      const obj2 = parse(str2, options)
      return json.isEqual(obj1, obj2, options)
    },

    isEqualFile (str, filePath, options = {}) {
      asserts.all([
        { value: str, validator: (v) => !is.emptyString(v), message: 'str should be a non-empty string' },
        { value: filePath, validator: (v) => !is.emptyString(v), message: 'filePath should be a non-empty string' }
      ])
      return this.isEqual(str, fs.readFileSync(filePath, 'utf-8'), options)
    },

    isEqualFiles (filePath1, filePath2, options = {}) {
      asserts.all([
        { value: filePath1, validator: (v) => !is.emptyString(v), message: 'filePath1 should be a non-empty string' },
        { value: filePath2, validator: (v) => !is.emptyString(v), message: 'filePath2 should be a non-empty string' }
      ])
      return this.isEqual(fs.readFileSync(filePath1, 'utf-8'), fs.readFileSync(filePath2, 'utf-8'), options)
    },

    compare (str1, str2, options = {}) {
      asserts.all([
        { value: str1, validator: (v) => !is.emptyString(v), message: 'str1 should be a non-empty string' },
        { value: str2, validator: (v) => !is.emptyString(v), message: 'str2 should be a non-empty string' }
      ])
      const obj1 = parse(str1, options)
      const obj2 = parse(str2, options)
      return json.compare(obj1, obj2, options)
    }
  }
}

export { createComparator }
