import { isEqual } from 'lodash-es'
import { assert, is, has } from '../predicates'
import { object } from '../utilities'

function diffArrays (arr1, arr2, path = '', diffs = { missing: [], extra: [], updated: [] }) {
  const maxLen = Math.max(arr1.length, arr2.length)
  for (let i = 0; i < maxLen; i++) {
    const newPath = `${path}[${i}]`
    if (i >= arr1.length) {
      diffs.extra.push(newPath)
    } else if (i >= arr2.length) {
      diffs.missing.push(newPath)
    } else if (!isEqual(arr1[i], arr2[i])) {
      if (is.plainObject(arr1[i]) && is.plainObject(arr2[i])) {
        diffObjects(arr1[i], arr2[i], newPath, diffs)
      } else if (is.array(arr1[i]) && is.array(arr2[i])) {
        diffArrays(arr1[i], arr2[i], newPath, diffs)
      } else {
        diffs.updated.push({ path: newPath, oldValue: arr1[i], newValue: arr2[i] })
      }
    }
  }
  return diffs
}

function diffObjects (obj1, obj2, path = '', diffs = { missing: [], extra: [], updated: [] }) {
  for (const [key, value] of Object.entries(obj1)) {
    const newPath = path ? `${path}.${key}` : key
    if (!has.key(obj2, key)) {
      diffs.missing.push(newPath)
    } else {
      const otherValue = obj2[key]
      if (!isEqual(value, otherValue)) {
        if (is.plainObject(value) && is.plainObject(otherValue)) {
          diffObjects(value, otherValue, newPath, diffs)
        } else if (is.array(value) && is.array(otherValue)) {
          diffArrays(value, otherValue, newPath, diffs)
        } else {
          diffs.updated.push({ path: newPath, oldValue: value, newValue: otherValue })
        }
      }
    }
  }
  for (const key of Object.keys(obj2)) {
    const newPath = path ? `${path}.${key}` : key
    if (!has.key(obj1, key)) {
      diffs.extra.push(newPath)
    }
  }
  return diffs
}

export function compare (obj1, obj2, options = {}) {
  assert.all([
    { value: obj1, validator: v => is.plainObject(v) || is.array(v), message: 'obj1 should be an object or an array' },
    { value: obj2, validator: v => is.plainObject(v) || is.array(v), message: 'obj2 should be an object or an array' }
  ])
  const nObj1 = object.normalize(obj1, options)
  const nObj2 = object.normalize(obj2, options)
  const isSame = isEqual(nObj1, nObj2)
  const getDifferences = () => {
    if (!isSame) {
      if (is.array(nObj1) && is.array(nObj2)) return diffArrays(nObj1, nObj2)
      if (is.plainObject(nObj1) && is.plainObject(nObj2)) return diffObjects(nObj1, nObj2)
    }
    return { missing: [], extra: [], updated: [] }
  }
  return {
    isEqual: isSame,
    differences: getDifferences()
  }
}
