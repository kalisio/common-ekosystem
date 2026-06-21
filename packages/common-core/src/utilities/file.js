import { assert, is } from '../predicates/index.js'

export const file = {

  SIZE_UNITS: {
    B: 'B',
    KB: 'KB',
    MB: 'MB',
    GB: 'GB'
  },

  parse (filePath) {
    assert.that(filePath, is.string, 'filePath must be a string')
    const normalized = filePath.replace(/\\/g, '/')
    const lastSlash = normalized.lastIndexOf('/')
    const dir = lastSlash === -1 ? '.' : normalized.substring(0, lastSlash)
    const fileName = normalized.slice(lastSlash + 1)
    const parts = fileName.split('.')
    const isDotfile = parts[0] === '' && parts.length === 2
    const extension = (parts.length <= 1 || isDotfile) ? '' : '.' + parts.slice(1).join('.')
    const baseName = extension ? fileName.slice(0, -extension.length) : fileName
    return { fileName, extension, baseName, dir }
  },

  formatSize (bytes) {
    assert.that(bytes, is.number, 'bytes must be a number')
    let value, unit
    if (bytes < 1024) {
      value = bytes
      unit = file.SIZE_UNITS.B
    } else if (bytes < 1024 ** 2) {
      value = bytes / 1024
      unit = file.SIZE_UNITS.KB
    } else if (bytes < 1024 ** 3) {
      value = bytes / 1024 ** 2
      unit = file.SIZE_UNITS.MB
    } else {
      value = bytes / 1024 ** 3
      unit = file.SIZE_UNITS.GB
    }
    return {
      value: Number.isInteger(value) ? value : parseFloat(value.toFixed(2)),
      unit
    }
  }
}
